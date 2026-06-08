"use client";

import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type z from "zod";
import type { etapa_schema } from "@/lib/schemas";

const COLORS = [
  "oklch(.704 .04 256.788)",
  "oklch(.627 .265 303.9)",
  "oklch(.795 .184 86.047)",
  "oklch(.768 .233 130.85)",
];

export function OverviewChart({ data }: { data: Array<z.infer<typeof etapa_schema>> }) {
  const chartData = data.map((item, index) => ({
    name: item.etapa,
    value: item.valorTotal,
    progress: item.progressoGeralEtapa,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="h-55 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: as outras informaçoes do entry podem se repetir, o index é o unico valor unico
                  index
                }`}
                fill={entry.color}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{data.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.value} itens ({data.progress})
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
