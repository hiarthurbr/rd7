import { NumberParser } from "@internationalized/number"
import z from "zod"

export type ComparisonResult = {
  eq: { [key: string]: [[number, number], [number, number]] }
  diff: { [key: string]: [[number, number], [number, number]] }
  same_sku: { [sku: string]: Array<[number, number, number]>}
  raw: any
}

export type ProductData = {
  name: string
  quantity: number
  weight: number
}

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