"use client";

import {
  RefreshCw,
  Package,
  ClipboardList,
  CheckCircle2,
  Truck,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  ProgressBar,
} from "@heroui/react";
import { useState } from "react";
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import z from "zod";
import { NumberParser } from "@internationalized/number";

const NumParser = new NumberParser("pt-BR", { style: "decimal" });
const Porcentagem = z
  .string()
  .transform((str) => NumParser.parse(str.replace("%", "")));

const DadoEtapa = z.object({
  nome: z.string(),
  valor: z.int(),
  ordem: z.int(),
  progresso: Porcentagem,
});

const Etapa = z.object({
  etapa: z.enum(["Pedido", "Picking", "Conferência", "Expedição"]),
  progressoGeralEtapa: Porcentagem,
  valorTotal: z.int(),
  ordem: z.int(),
  dados: z.array(DadoEtapa),
});

const DashboardData = z.object({
  geral: z.object({
    atualizacao: z.coerce.date().or(z.date()),
    periodo: z.int(),
    progressoGeral: z.object({
      porcentagem: Porcentagem,
      valor: z.int(),
      cor: z.string().startsWith("#").length(7),
    }),
    cor: z.null(),
    etapas: z.array(Etapa),
  }),
});

async function get_data() {
  const token = await fetch("https://api.pdahub.com.br/api/Autenticacao", {
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
    },
    body: JSON.stringify({ Login: "arthur.bufalo" }),
    method: "POST",
  })
    .then((r) => r.json())
    .then((token) => `Bearer ${token.accessToken}`);

  const data = await fetch(
    "https://prd-apidash-wms.pdacloud.com.br/Dash/Progresso",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
        authorization: token,
      },
      referrer: "https://bi.pdahub.com.br/",
      body: null,
      method: "GET",
    },
  )
    .then((res) => res.json())
    .then(DashboardData.parseAsync);

  console.log(data);

  return data;
}

const etapaIcons: Record<string, React.ReactNode> = {
  Pedido: <Package className="h-5 w-5" />,
  Picking: <ClipboardList className="h-5 w-5" />,
  Conferência: <CheckCircle2 className="h-5 w-5" />,
  Expedição: <Truck className="h-5 w-5" />,
};

const etapaColors: Record<string, string> = {
  Pedido: "bg-chart-2",
  Picking: "bg-chart-3",
  Conferência: "bg-chart-1",
  Expedição: "bg-primary",
};

function formatDate(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: number | string;
  subValue?: number;
}) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  );
}

function EtapaCard({
  etapa,
  color,
}: {
  etapa: z.infer<typeof Etapa>;
  color: string;
}) {
  const icon = etapaIcons[etapa.etapa] || <Package className="h-5 w-5" />;
  const progressValue = etapa.progressoGeralEtapa;

  return (
    <Card className="border-border bg-card transition-all hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${color} text-primary-foreground`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base font-medium">
                {etapa.etapa}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {etapa.valorTotal} itens
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              {etapa.progressoGeralEtapa}
            </p>
            <p className="text-xs text-muted-foreground">do total</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar value={progressValue} color="default" aria-label="None">
          <ProgressBar.Output />
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <div className="grid gap-2">
          {etapa.dados.map((dado) => (
            <div
              key={dado.nome}
              className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2"
            >
              <span className="text-sm text-muted-foreground">{dado.nome}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  {dado.valor}
                </span>
                <span className="w-16 text-right text-xs text-muted-foreground">
                  {dado.progresso}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: get_data,
    refetchInterval: 3600000, // 1 hora em ms
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground">Erro ao carregar dados</p>
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { geral } = data;
  const progressoGeralValue = geral.progressoGeral.porcentagem;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Dashboard Logística
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento de pedidos e expedição
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Atualizado: {formatDate(geral.atualizacao)}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

        {/* Progress Overview */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {geral.progressoGeral.porcentagem}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    concluído
                  </span>
                </div>
                <ProgressBar
                  value={progressoGeralValue}
                  color="default"
                  aria-label="None"
                >
                  <ProgressBar.Output />
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
                <p className="text-sm text-muted-foreground">
                  {geral.progressoGeral.valor} pedidos finalizados nos últimos{" "}
                  {geral.periodo} dias
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {geral.etapas.map((etapa) => (
                  <StatCard
                    key={etapa.etapa}
                    label={etapa.etapa}
                    value={etapa.valorTotal}
                    subValue={etapa.progressoGeralEtapa}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapas Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {geral.etapas.map((etapa) => (
            <EtapaCard
              key={etapa.etapa}
              etapa={etapa}
              color={etapaColors[etapa.etapa] || "bg-primary"}
            />
          ))}
        </div>

        {/* Footer */}
        <footer className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Atualização automática a cada hora - Período: últimos{" "}
            {geral.periodo} dias
          </p>
        </footer>
      </div>
    </div>
  );
}
