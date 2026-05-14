"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { motion } from "framer-motion"
import z from "zod"
import { Etapa } from "./page"

interface OverviewChartProps {
  data: Array<{
    etapa: string
    valorTotal: number
    progressoGeralEtapa: string
  }>
}

const COLORS = [
  "oklch(0.65 0.18 250)",
  "oklch(0.75 0.15 80)",
  "oklch(0.65 0.18 165)",
  "oklch(0.55 0.22 25)",
]

export function OverviewChart({ data }: { data: Array<z.infer<typeof Etapa>>}) {
  const chartData = data.map((item, index) => ({
    name: item.etapa,
    value: item.valorTotal,
    progress: item.progressoGeralEtapa,
    color: COLORS[index % COLORS.length],
  }))

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
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{data.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.value} itens ({data.progress})
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
