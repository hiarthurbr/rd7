"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type z from "zod";
import type { dado_etapa_schema } from "@/lib/schemas";

interface StageChartProps {
  data: Array<z.infer<typeof dado_etapa_schema>>;
  color: string;
}

const colorMap: Record<string, string> = {
  "slate-400": "oklch(.704 .04 256.788)",
  "purple-500": "oklch(.627 .265 303.9)",
  "yellow-500": "oklch(.795 .184 86.047)",
  "lime-500": "oklch(.768 .233 130.85)",
};

export function StageChart({ data, color }: StageChartProps) {
  const chartColor = colorMap[color] || "oklch(.708 0 0)";

  const chartData = data.map((item) => ({
    name: item.nome.length > 12 ? item.nome.substring(0, 12) + "..." : item.nome,
    fullName: item.nome,
    value: item.valor,
    progress: item.progresso,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-45 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "oklch(0.22 0.01 240 / 0.5)" }}
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{data.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.value} itens ({data.progress})
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((cell) => (
              <Cell key={`cell-${cell.name}`} fill={chartColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
