"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  RefreshCw,
  Package,
  ClipboardList,
  CheckCircle2,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { AnimatedCounter } from "./animated-counter";
import { CircularProgress } from "./circular-progress";
import { StageChart } from "./stage-chart";
import { OverviewChart } from "./overview-chart";
import { DynamicBackground } from "./dynamic-background";
import z from "zod";
import { useState } from "react";
import { Etapa } from "@/lib/types";
import { get_dashboard_data } from "@/lib/pda";
import { Status } from "@/components/status";

const etapaIcons: Record<string, React.ReactNode> = {
  Pedido: <Package className="h-5 w-5" />,
  Picking: <ClipboardList className="h-5 w-5" />,
  Conferência: <CheckCircle2 className="h-5 w-5" />,
  Expedição: <Truck className="h-5 w-5" />,
};

const etapaColors: Record<string, { bg: string; chart: string }> = {
  Pedido: { bg: "bg-slate-400", chart: "slate-400" },
  Picking: { bg: "bg-purple-500", chart: "purple-500" },
  Conferência: { bg: "bg-yellow-500", chart: "yellow-500" },
  Expedição: { bg: "bg-lime-500", chart: "lime-500" },
};

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

function EtapaCard({
  etapa,
  index,
}: {
  etapa: z.infer<typeof Etapa>;
  index: number;
}) {
  const icon = etapaIcons[etapa.etapa] || <Package className="h-5 w-5" />;
  const colors = etapaColors[etapa.etapa]!;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card className="h-full border-border backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 bg-slate-600/25">
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
                  {etapa.etapa === "Pedido" ? "Planejamento" : etapa.etapa}
                </CardTitle>
              </div>
            </div>
            <div className="text-right">
              <motion.p
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <AnimatedCounter value={etapa.valorTotal} /> (
                <AnimatedCounter
                  value={etapa.progressoGeralEtapa >> 0}
                  suffix="%"
                />
                )
              </motion.p>
              <p className="text-xs text-muted">do total</p>
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
    queryFn: get_dashboard_data,
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
    <div className="min-h-screen bg-background dark">
      {/* Dynamic animated background based on etapa proportions */}
      <DynamicBackground etapas={geral.etapas} />

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Stats Row */}
          <motion.div variants={itemVariants}>
            <Card className="border-border backdrop-blur-sm bg-slate-600/25 text-foreground">
              <CardContent className="p-6">
                <div className="flex items-center gap-8 flex-row justify-evenly">
                  {/* Circular Progress */}
                  <div className="flex flex-col items-center gap-4">
                    <CircularProgress
                      value={progressoGeralValue}
                      size={160}
                      strokeWidth={12}
                      className="stroke-neutral-600"
                    >
                      <div className="text-center">
                        <motion.p
                          className="text-3xl font-bold text-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <AnimatedCounter value={geral.progressoGeral.valor} />
                          /
                          <AnimatedCounter
                            value={
                              ((1 / (geral.progressoGeral.porcentagem / 100)) *
                                geral.progressoGeral.valor) >>
                              0
                            }
                          />
                        </motion.p>
                        <p className="text-xs text-muted-foreground">
                          concluido
                        </p>
                      </div>
                    </CircularProgress>
                  </div>

                  {/* Pie Chart */}
                  <div className="w-full max-w-xs">
                    <h3 className="mb-2 text-center text-sm font-medium text-muted-foreground">
                      Distribuicao por Etapa
                    </h3>
                    <div className="flex">
                      <OverviewChart data={geral.etapas} />
                      {/* Legend */}
                      <motion.div
                        className="flex flex-col flex-wrap justify-center gap-6"
                        variants={itemVariants}
                      >
                        {geral.etapas.map((etapa, index) => {
                          const colors = etapaColors[etapa.etapa] || {
                            bg: "bg-primary",
                          };
                          return (
                            <motion.div
                              key={etapa.etapa}
                              className="flex items-center gap-2"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                            >
                              <div
                                className={`h-3 w-3 rounded-full ${colors.bg}`}
                              />
                              <span className="text-sm text-muted-foreground">
                                {etapa.etapa === "Pedido"
                                  ? "Planejamento"
                                  : etapa.etapa}
                              </span>
                              <span className="text-sm font-extrabold text-foreground">
                                {etapa.valorTotal}
                              </span>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        </motion.div>

        <div className="absolute bottom-0 left-8">
          <Status />
        </div>
      </div>
    </div>
  );
}
