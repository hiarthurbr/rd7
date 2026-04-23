"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Database,
  RefreshCw,
  Calendar,
  Download,
  ArrowLeft,
  Trash2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/file-uploader";
import Link from "next/link";
import { z } from "zod";
import excel from "exceljs";

const STORAGE_KEY = "jeferson-nfs-data";

const NFData = z.object({
  Transportador: z.string().or(z.undefined()),
  PrevisaoSaida: z.coerce.date().or(z.undefined()).or(z.date()),
  NumeroNotaFiscal: z.coerce.number(),
});

const StoredNFsData = z.object({
  nfs: z.array(NFData),
  lastUpdated: z.coerce.date(),
});

const Result = z.object({
  eq: z.array(z.number()),
  ne: z.array(
    z.object({
      NF: z.number(),
      Transportador: z.string(),
    }),
  ),
});

async function parseXlsx(buffer: ArrayBuffer) {
  const workbook = new excel.Workbook();
  await workbook.xlsx.load(buffer);

  console.log({
    worksheets: workbook.worksheets.filter((w) => w.state === "visible"),
  });

  const dateWorksheet = workbook.worksheets.find(
    (w) =>
      w.state === "visible" &&
      w.findCell("A1", 0)?.value?.toString().trim().toLocaleUpperCase() ===
        "Fechamento Geral".toLocaleUpperCase(),
  );

  // @ts-expect-error
  globalThis.worksheets = workbook.worksheets.filter(
    (w) => w.state === "visible",
  );
  // @ts-expect-error
  globalThis.dateWorksheet = dateWorksheet;

  return {
    nfs: workbook.worksheets
      .filter(
        (w) =>
          w.state === "visible" &&
          w.findCell("A1", 0)?.value?.toString().trim().toLocaleUpperCase() ===
            "FECHAMENTO JEFFTRANSPORTE",
      )
      .flatMap((w) =>
        w.getColumn("A").values.filter((v) => typeof v === "number"),
      ),
    startDate: new Date(
      Math.min(
        ...dateWorksheet.getColumn("A").values.filter((v) => v instanceof Date),
      ),
    ),
    endDate: new Date(
      Math.max(
        ...dateWorksheet.getColumn("A").values.filter((v) => v instanceof Date),
      ),
    ),
  };
}

function compareWithStoredData(
  xlsxData: Awaited<ReturnType<typeof parseXlsx>>,
  storedData: z.infer<typeof StoredNFsData>,
): z.infer<typeof Result> {
  console.log({ xlsxData, storedData });

  const NFStore = storedData.nfs.filter(
    (nfe) =>
      nfe.PrevisaoSaida >= xlsxData.startDate &&
      nfe.PrevisaoSaida <= xlsxData.endDate,
  );
  const NFStoreJeferson = NFStore.filter(
    (nfe) => nfe.Transportador === "Jeferson",
  );
  const NFStoreJefersonSet = new Set(
    NFStoreJeferson.map((nf) => nf.NumeroNotaFiscal),
  );
  const NFPlaniSet = new Set(xlsxData.nfs);
  const NFNome = Object.fromEntries(
    NFStore.map((nfe) => [
      nfe.NumeroNotaFiscal,
      nfe.Transportador ?? "Nenhum especificado",
    ]),
  );

  const Correct = NFStoreJefersonSet.intersection(NFPlaniSet);
  const NotIncluded = NFStoreJefersonSet.difference(NFPlaniSet);
  const NotCorrect = NFPlaniSet.intersection(
    NFStoreJefersonSet.symmetricDifference(NFPlaniSet),
  );

  console.log({
    NFStore,
    NFStoreJeferson,
    NFNome,
    Correct,
    NotCorrect,
    NFStoreJefersonSet,
    NFPlaniSet,
    NotIncluded,
  });

  return {
    corr: Array.from(Correct),
    err: Array.from(NotCorrect).map((nf) => ({
      nf,
      entregador: NFNome[nf] ?? "Não definido",
    })),
    ni: Array.from(NotIncluded).map((nf) => ({
      nf,
      entregador: NFNome[nf] ?? "Não definido",
    })),
  };
}

function CorrList({ results }: { results: z.infer<typeof Result> }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Notas incorretas
              </CardTitle>
              <CardDescription>
                {result.err.length}
                {" nota"}
                {result.err.length === 1 ? "" : "s"}
                com entregador errado
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
                {isOpen ? "Recolher" : "Expandir"}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {result.err.map((nf) => (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-destructive shrink-0" />
                    <h4 className="font-medium text-balance">{nf.nf}</h4>
                    <div className="rounded bg-muted px-2 py-1">
                      <span className="text-muted-foreground">
                        Entregador:{" "}
                      </span>
                      <span className="font-medium">{nf.entregador}</span>
                    </div>
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    Entregador errado
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function NIList({ results }: { results: z.infer<typeof Result> }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Notas não incluidas
              </CardTitle>
              <CardDescription>
                {result.err.length}
                {" nota"}
                {result.err.length === 1 ? "" : "s"}
                não incluidas
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
                {isOpen ? "Recolher" : "Expandir"}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {result.err.map((nf) => (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-destructive shrink-0" />
                    <h4 className="font-medium text-balance">{nf.nf}</h4>
                    <div className="rounded bg-muted px-2 py-1">
                      <span className="text-muted-foreground">
                        Entregador:{" "}
                      </span>
                      <span className="font-medium">{nf.entregador}</span>
                    </div>
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    Não incluida
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function JefersonPage() {
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [storedData, setStoredData] = useState<z.infer<
    typeof StoredNFsData
  > | null>(null);
  const [results, setResults] = useState<z.infer<typeof Result> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFile, setUpdateFile] = useState<File | null>(null);

  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [isSecondOpen, setIsSecondOpen] = useState(true);

  // Carrega dados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStoredData(StoredNFsData.parse(JSON.parse(saved)));
      } catch (e) {
        console.error("Erro ao carregar dados salvos", e);
      }
    }
  }, []);

  const handleCompare = useCallback(async () => {
    if (!xlsxFile || !storedData) return;

    setIsProcessing(true);
    try {
      const xlsxBuffer = await xlsxFile.arrayBuffer();
      const xlsxData = await parseXlsx(xlsxBuffer);
      const comparison = compareWithStoredData(xlsxData, storedData);
      console.log({ comparison });
      setResults(comparison);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [xlsxFile, storedData]);

  const handleUpdateStorage = useCallback(async () => {
    setIsUpdating(true);
    try {
      const nfs: Array<z.infer<typeof NFData>> = await fetch(
        "https://api-erp.rainhadassete.com.br/api/expedicao/notas-kanban",
        {
          headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "pt-BR,pt;q=0.9",
            priority: "u=1, i",
            "sec-ch-ua":
              '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
          },
          referrer: "https://rainhaerp.rainhadassete.com.br/",
          body: null,
          method: "GET",
        },
      )
        .then((r) => r.json())
        .then((r) => r.data)
        .then(z.array(NFData).parseAsync);

      const newData: z.infer<typeof StoredNFsData> = {
        lastUpdated: new Date(),
        nfs,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setStoredData(newData);
      setResults(null);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [updateFile]);

  const handleClearStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStoredData(null);
    setResults(null);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  };

  const handleReset = () => {
    setXlsxFile(null);
    setResults(null);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
          >
            <ArrowLeft className="size-4" />
            Voltar ao comparador principal
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Comparador Jeferson
          </h1>
          <p className="text-muted-foreground mt-2">
            Compare arquivos XLSX com os dados armazenados localmente
          </p>
        </div>

        {/* Stored Data Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="size-5" />
              Dados Armazenados
            </CardTitle>
            <CardDescription>
              Base de dados local para comparação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {storedData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ultima atualização</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(storedData.lastUpdated.toISOString())}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {storedData.nfs.length}
                    </p>
                    <p className="text-xs text-muted-foreground">NFs</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateStorage}
                  >
                    <RefreshCw className="size-4 mr-2" />
                    Atualizar dados
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearStorage}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-6 justify-center">
                  <Database className="size-6 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum dado armazenado.
                  </p>
                  <Button
                    onClick={handleUpdateStorage}
                    disabled={isUpdating}
                    className="w-1/3"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="size-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Download className="size-4 mr-2" />
                        Criar base de referência
                      </>
                    )}
                  </Button>
                </div>

                <FileUploader
                  label="Comparar banco de dados com planilha (.xlsx)"
                  accept=".xlsx,.xls"
                  file={updateFile}
                  onFileChange={setUpdateFile}
                  icon="xlsx"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Section */}
        {storedData && !results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="size-5" />
                Comparar Arquivo
              </CardTitle>
              <CardDescription>
                Selecione um arquivo .xlsx para comparar com os dados
                armazenados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploader
                label="Arquivo para comparação (.xlsx)"
                accept=".xlsx,.xls"
                file={xlsxFile}
                onFileChange={setXlsxFile}
                icon="xlsx"
              />

              {xlsxFile && (
                <Button
                  onClick={handleCompare}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Comparar arquivos"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Resultados da Comparação
              </h2>
              <Button variant="outline" onClick={handleReset}>
                Nova comparação
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {results.corr.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Notas corretas
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-destructive">
                      {results.err.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Notas divergentes
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{results.ni.length}</p>
                    <p className="text-sm text-muted-foreground">
                      Notas não incluidas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            {results.err.length > 0 && results.ni.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <CorrList results={results} />
                <NIList results={results} />
              </div>
            ) : results.err.length > 0 ? (
              <CorrList results={results} />
            ) : (
              <NIList results={results} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
