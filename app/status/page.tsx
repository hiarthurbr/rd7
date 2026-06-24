"use client";

import z from "zod";
import type { montagem_caixa_schema } from "@/lib/schemas";
import skus_pre from "../produtividade/conferencia/skus.json";
import maio from "./fabio.json";

const skus = z.record(z.string(), z.number().positive().catch(1)).parse(skus_pre);

const month = maio as Array<Array<z.infer<typeof montagem_caixa_schema>>>;

export default function Page() {
  const data = month.map((data) => {
    const produtos = Object.entries(
      data.reduce(
        (obj, prod) => {
          if (prod.produto in obj) obj[prod.produto] += prod.quantidade;
          else obj[prod.produto] = prod.quantidade;
          return obj;
        },
        {} as Record<string, number>,
      ),
    )
      .map(([sku, quantidade_pre]) =>
        skus[sku as keyof typeof skus] == null
          ? null
          : quantidade_pre / (skus[sku as keyof typeof skus] ?? 1),
      )
      .filter((n) => n != null)
      .reduce((a, b) => a + b, 0);

    const pedidos_conferidos = new Set(data.map((cx) => cx.codigoPedido));
    const caixas = new Set(data.map((cx) => cx.caixa));

    return { produtos, pedidos_conferidos, caixas };
  });

  const values_raw = {
    produtos: data.map((x) => x.produtos),
    caixas: data.map((x) => x.caixas.size),
    pedidos_conferidos: data.map((x) => x.pedidos_conferidos.size),
  };

  console.log(
    Object.entries(values_raw).map(([key, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);

      const avg = {
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
      };
      const mad = values.reduce((sum, val) => sum + Math.abs(val - avg.median), 0) / data.length;

      return { key, ...avg, mad };
    }),
  );

  console.log(data);

  return null;
}
