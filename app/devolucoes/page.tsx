"use client";
import { FileUploader } from "@/components/file-uploader";
import { Button, Card, Disclosure, Spinner } from "@heroui/react";
import excel from "exceljs";
import { DatabaseIcon, HardDriveUploadIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Dexie, { type Table } from "dexie";
import z from "zod";
import { departamento_enum, excel_cell_value_schema, motivo_devolução_enum } from "@/lib/schemas";

const DevolucaoSchema = z.codec(
  z.array(excel_cell_value_schema),
  z.object({
    cliente: z.string(),
    nota_fiscal_devolução: z.number().or(z.null()).catch(null),
    data_emissão: z.date(),
    data_relatado: z.date().default(() => new Date()),
    valor_com_impostos: z.number().positive().or(z.null()).catch(null),
    valor_sem_impostos: z.number().positive().or(z.null()).catch(null),
    departamento: departamento_enum.or(z.null()).catch(null),
    motivos: z.preprocess((str) => {
      if (typeof str === "string") {
        return str.split("/");
      }
      return null;
    }, z.array(motivo_devolução_enum)),
    código_produtos: z.array(
      z.object({
        tipo: motivo_devolução_enum,
        codigo: z.string().or(z.null()),
      }),
    ),
    observações: z.string(),
    valor_descarte: z.number().positive().or(z.null()).catch(null),
    separador: z
      .string()
      .transform((str) => (str === "-" ? null : str.split("/"))),
    conferente: z
      .string()
      .transform((str) => (str === "-" ? null : str.split("/"))),
    notas_fiscais_origem: z.preprocess((cell) => {
      switch (typeof cell) {
        case "number":
          return [cell];
        case "string":
          return cell.split(" ").map(Number);
        default:
          return null;
      }
    }, z.array(z.number()).or(z.null())),
  }),
  {
    decode(excel_row) {
      const INDEXES = {
        cliente: 1,
        nota_fiscal_devolução: 2,
        data_emissão: 3,
        valor_com_impostos: 4,
        valor_sem_impostos: 5,
        departamento: 6,
        motivos: 7,
        código_produtos: 8,
        observações: 9,
        valor_descarte: 10,
        separador: 11,
        conferente: 12,
        notas_fiscais_origem: 13,
      } as const satisfies {
        [key in keyof z.infer<typeof DevolucaoSchema>]?: number;
      };

      if (excel_row.length) throw "";

      return Object.fromEntries(
        Object.entries(INDEXES).map(([key, index]) => [key, excel_row[index]]),
      ) as Record<keyof typeof INDEXES, z.infer<typeof excel_cell_value_schema>>;
    },
  },
);

// --- CLASSE DO BANCO DE DADOS ---
export class Devoluções extends Dexie {
  devolucoes!: Table<z.infer<typeof DevolucaoSchema> & { id?: number }>;

  constructor() {
    super("DevolucaoDB");

    this.version(1).stores({
      // O primeiro campo é a chave primária (++ significa autoincremento)
      // Os campos seguintes são os índices para busca
      // Use *motivos para indexar cada item dentro do array (Multi-entry index)
      devolucoes:
        "++id, cliente, data_emissão, departamento, nota_fiscal_devolução, *motivos",
    });
  }

  adicionarDevolucao(dados: unknown) {
    const dadosValidados = DevolucaoSchema.parse(dados);

    return this.devolucoes.add(dadosValidados);
  }

  buscarPorDepartamento(depto: z.infer<typeof departamento_enum>) {
    return this.devolucoes
      .where("departamento")
      .equals(depto)
      .reverse()
      .toArray();
  }

  buscarPorMotivo(motivo: z.infer<typeof motivo_devolução_enum>) {
    return this.devolucoes.where("motivos").equals(motivo).toArray();
  }
}

export async function parseXlsx(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = new excel.Workbook();
  await workbook.xlsx.load(buffer);

  console.log({ worksheets: workbook.worksheets });

  const worksheet = workbook.worksheets
    .filter((w) => w.state === "visible")
    .pop()!;

  console.log({ worksheet });

  const rows = worksheet.getRows(2, worksheet.rowCount);

  if (rows == null) return false;

  for (const row of rows) {
    console.log(row.values);
  }
}

export default function Page() {
  const db = useMemo(() => new Devoluções(), []);
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 flex flex-col items-center">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Comparador de Arquivos
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Compare arquivos XLSX e XML para identificar divergências de
            produtos
          </p>
        </div>

        <div className="w-full max-w-md text-center">
          <Disclosure>
            <Disclosure.Heading className="pb-4">
              <Button slot="trigger" variant="secondary">
                <DatabaseIcon />
                Banco de dados <Disclosure.Indicator />
              </Button>
            </Disclosure.Heading>
            <Disclosure.Content className="space-y-4">
              <FileUploader
                label="Planilha de devolução (Excel)"
                accept=".xlsx,.xls"
                file={xlsxFile}
                onFileChange={setXlsxFile}
                icon="xlsx"
              />
              {xlsxFile != null && (
                <Button onPress={() => parseXlsx(xlsxFile)}>
                  <HardDriveUploadIcon />
                  Processar dados
                </Button>
              )}
            </Disclosure.Content>
          </Disclosure>
        </div>
      </div>
    </main>
  );
}
