"use client";

import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  RefreshCw,
  Package,
  ClipboardList,
  CheckCircle2,
  Truck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { AnimatedCounter } from "./animated-counter";
import { CircularProgress } from "./circular-progress";
import { StageChart } from "./stage-chart";
import { OverviewChart } from "./overview-chart";
import { DynamicBackground } from "./dynamic-background";
import z from "zod";
import { NumberParser } from "@internationalized/number";
import { useState } from "react";

const NumParser = new NumberParser("pt-BR", { style: "decimal" });
const Porcentagem = z
  .string()
  .transform((str) => NumParser.parse(str.replace("%", "")));

export const DadoEtapa = z.object({
  nome: z.string(),
  valor: z.int(),
  ordem: z.int(),
  progresso: Porcentagem,
});

export const Etapa = z.object({
  etapa: z.enum(["Pedido", "Picking", "Conferência", "Expedição"]),
  progressoGeralEtapa: Porcentagem,
  valorTotal: z.int(),
  ordem: z.int(),
  dados: z.array(DadoEtapa),
});

export const DashboardData = z.object({
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

const etapaColors: Record<string, { bg: string; chart: string }> = {
  Pedido: { bg: "bg-chart-2", chart: "hsl(var(--chart-2))" },
  Picking: { bg: "bg-chart-3", chart: "hsl(var(--chart-3))" },
  Conferência: { bg: "bg-chart-1", chart: "hsl(var(--chart-1))" },
  Expedição: { bg: "bg-primary", chart: "hsl(var(--primary))" },
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

function StatCard({
  label,
  value,
  icon,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4"
    >
      <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">
          <AnimatedCounter value={value} />
        </p>
      </div>
    </motion.div>
  );
}

function EtapaCard({
  etapa,
  index,
}: {
  etapa: z.infer<typeof Etapa>;
  index: number;
}) {
  const icon = etapaIcons[etapa.etapa] || <Package className="h-5 w-5" />;
  const colors = etapaColors[etapa.etapa] || {
    bg: "bg-primary",
    chart: "hsl(var(--primary))",
  };
  const progressValue = etapa.progressoGeralEtapa;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card className="h-full border-border backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5" variant="transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={`rounded-xl p-3 ${colors.bg} text-primary-foreground`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
              >
                {icon}
              </motion.div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  {etapa.etapa}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  <AnimatedCounter value={etapa.valorTotal} /> itens
                </p>
              </div>
            </div>
            <div className="text-right">
              <motion.p
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                {etapa.progressoGeralEtapa}
              </motion.p>
              <p className="text-xs text-muted-foreground">do total</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <StageChart data={etapa.dados} color={colors.chart} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-primary" />
        </motion.div>
        <motion.span
          className="text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Carregando dados...
        </motion.span>
      </motion.div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </motion.div>
        <p className="text-lg text-muted-foreground">Erro ao carregar dados</p>
        <motion.button
          onClick={onRetry}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Tentar novamente
        </motion.button>
      </motion.div>
    </div>
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
    refetchInterval: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState onRetry={handleRefresh} />;
  }

  const { geral } = data;
  const progressoGeralValue = geral.progressoGeral.porcentagem;

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic animated background based on etapa proportions */}
      <DynamicBackground etapas={geral.etapas} />

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.header
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            variants={itemVariants}
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="rounded-2xl bg-primary/10 p-3"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Activity className="h-8 w-8 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                  Dashboard Logistica
                </h1>
                <p className="text-sm text-muted-foreground">
                  Monitoramento de pedidos e expedicao
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                className="flex items-center gap-2 rounded-xl bg-card/80 px-4 py-2 backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDate(geral.atualizacao)}
                </span>
              </motion.div>
              <motion.button
                onClick={handleRefresh}
                disabled={isFetching}
                className="rounded-xl bg-card/80 p-3 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Atualizar dados"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </motion.button>
            </div>
          </motion.header>

          {/* Main Stats Row */}
          <motion.div variants={itemVariants}>
            <Card className="border-border backdrop-blur-sm" variant="transparent">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
                  {/* Circular Progress */}
                  <div className="flex flex-col items-center gap-4">
                    <CircularProgress
                      value={progressoGeralValue}
                      size={160}
                      strokeWidth={12}
                    >
                      <div className="text-center">
                        <motion.p
                          className="text-3xl font-bold text-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {geral.progressoGeral.porcentagem}
                        </motion.p>
                        <p className="text-xs text-muted-foreground">
                          concluido
                        </p>
                      </div>
                    </CircularProgress>
                    <div className="flex items-center gap-2 text-center">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        <AnimatedCounter value={geral.progressoGeral.valor} />{" "}
                        pedidos nos ultimos {geral.periodo} dias
                      </p>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="w-full max-w-xs">
                    <h3 className="mb-2 text-center text-sm font-medium text-muted-foreground">
                      Distribuicao por Etapa
                    </h3>
                    <OverviewChart data={geral.etapas} />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {geral.etapas.map((etapa, index) => (
                      <StatCard
                        key={etapa.etapa}
                        label={etapa.etapa}
                        value={etapa.valorTotal}
                        icon={etapaIcons[etapa.etapa]}
                        delay={index * 0.1}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Legend */}
          <motion.div
            className="flex flex-wrap justify-center gap-6"
            variants={itemVariants}
          >
            {geral.etapas.map((etapa, index) => {
              const colors = etapaColors[etapa.etapa] || { bg: "bg-primary" };
              return (
                <motion.div
                  key={etapa.etapa}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className={`h-3 w-3 rounded-full ${colors.bg}`} />
                  <span className="text-sm text-muted-foreground">
                    {etapa.etapa}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {etapa.progressoGeralEtapa}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Etapas Grid */}
          <motion.div
            className="grid gap-6 md:grid-cols-2"
            variants={containerVariants}
          >
            <AnimatePresence>
              {geral.etapas.map((etapa, index) => (
                <EtapaCard key={etapa.etapa} etapa={etapa} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.footer className="pt-4 text-center" variants={itemVariants}>
            <p className="text-xs text-muted-foreground">
              Atualizacao automatica a cada hora - Periodo: ultimos{" "}
              {geral.periodo} dias
            </p>
          </motion.footer>
        </motion.div>
      </div>
    </div>
  );
}
