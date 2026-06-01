"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"
import z from "zod"
import { etapa_schema } from "@/lib/schemas"


interface DynamicBackgroundProps {
  etapas: z.infer<typeof etapa_schema>[]
}

const etapaColorValues: Record<string, { r: number; g: number; b: number }> = {
  Pedido: { r: 139, g: 92, b: 246 },
  Picking: { r: 234, g: 179, b: 8 },
  Conferência: { r: 16, g: 185, b: 129 },
  Expedição: { r: 20, g: 184, b: 166 },
}

function parsePercentage(value: string): number {
  return parseFloat(value.replace(",", ".").replace("%", "")) || 0
}

export function DynamicBackground({ etapas }: DynamicBackgroundProps) {
  const blobData = useMemo(() => {
    return etapas.map((etapa, index) => {
      const percentage = etapa.progressoGeralEtapa
      const color = etapaColorValues[etapa.etapa] || { r: 100, g: 100, b: 100 }
      
      // Scale size based on percentage (min 200px, max 500px)
      const size = Math.max(200, Math.min(500, 200 + percentage * 3))
      
      // Fixed positions in viewport - corners and edges
      const positions = [
        { left: "5%", top: "5%" },
        { right: "5%", top: "10%" },
        { left: "10%", bottom: "10%" },
        { right: "10%", bottom: "5%" },
      ]
      
      return {
        etapa: etapa.etapa,
        percentage,
        color,
        size,
        position: positions[index % 4],
        duration: 20 + index * 5,
        delay: index * 0.3,
      }
    })
  }, [etapas])

  return (
    <div 
      className="pointer-events-none fixed inset-0" 
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Base dark gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, hsl(240 10% 10%) 0%, hsl(240 10% 6%) 50%, hsl(240 10% 8%) 100%)",
        }}
      />

      {/* Animated blobs for each etapa */}
      {blobData.map((blob) => (
        <motion.div
          key={blob.etapa}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            ...blob.position,
            background: `radial-gradient(circle at 40% 40%, 
              rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.4) 0%, 
              rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.2) 40%, 
              rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.05) 70%, 
              transparent 100%)`,
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.2, 0.95, 1.1, 1],
            x: [0, 40, -30, 20, 0],
            y: [0, -35, 25, -15, 0],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: blob.delay,
          }}
        />
      ))}

      {/* Center glow that pulses */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, 
            rgba(${etapaColorValues.Conferência.r}, ${etapaColorValues.Conferência.g}, ${etapaColorValues.Conferência.b}, 0.15) 0%, 
            transparent 70%)`,
          filter: "blur(100px)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating orbs */}
      {[...Array(6)].map((_, i) => {
        const colors = Object.values(etapaColorValues)
        const color = colors[i % colors.length]
        return (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full"
            style={{
              width: 8 + (i * 4),
              height: 8 + (i * 4),
              left: `${15 + (i * 14)}%`,
              top: `${20 + (i * 10) % 60}%`,
              background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`,
              boxShadow: `0 0 20px rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, 20, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          />
        )
      })}

      {/* Moving gradient waves */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(45deg, 
              rgba(${etapaColorValues.Pedido.r}, ${etapaColorValues.Pedido.g}, ${etapaColorValues.Pedido.b}, 0.05) 0%, 
              transparent 50%),
            linear-gradient(135deg, 
              rgba(${etapaColorValues.Picking.r}, ${etapaColorValues.Picking.g}, ${etapaColorValues.Picking.b}, 0.05) 0%, 
              transparent 50%),
            linear-gradient(225deg, 
              rgba(${etapaColorValues.Conferência.r}, ${etapaColorValues.Conferência.g}, ${etapaColorValues.Conferência.b}, 0.05) 0%, 
              transparent 50%),
            linear-gradient(315deg, 
              rgba(${etapaColorValues.Expedição.r}, ${etapaColorValues.Expedição.g}, ${etapaColorValues.Expedição.b}, 0.05) 0%, 
              transparent 50%)
          `,
          backgroundSize: "200% 200%",
        }}
        animate={{
          backgroundPosition: [
            "0% 0%",
            "100% 100%",
            "0% 0%",
          ],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  )
}
