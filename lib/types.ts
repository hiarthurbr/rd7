import { NumberParser } from "@internationalized/number";
import z from "zod";

export type ComparisonResult = {
  eq: { [key: string]: [[number, number], [number, number]] };
  diff: { [key: string]: [[number, number], [number, number]] };
  same_sku: { [sku: string]: Array<[number, number, number]> };
  raw: any;
};

export type ProductData = {
  name: string;
  quantity: number;
  weight: number;
};

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

export const token_schema = z.object({
  authenticated: z.boolean(),
  created: z.coerce.date(),
  expiration: z.coerce.date(),
  accessToken: z.string(),
  refreshToken: z.uuidv4(),
});

export const status_pedido_schema = z.enum(["Andamento"]);

export const relatorio_separacao_schema = z.object({
  codigoPedido: z.string(),
  codigoTransportadora: z.string(),
  codigoEcCliente: z.number(),
  nomeCliente: z.string(),
  produto: z.string(),
  descricaoStatus: status_pedido_schema,
  transportadora: z.string(),
  dataIntegracao: z.coerce.date().or(z.date()),
  cor: z.string(),
  tamanho: z.date(),
  grade: z.date(),
  descricaoEndereco: z.string(),
  quantidadePicking: z.number(),
  notaFiscal: z.date(),
  serie: z.date(),
  dataInicioSeparacao: z.coerce.date().or(z.date()),
  tipoPedido: z.enum(["Vinculo", "Pedido"]),
  quantidadePedido: z.number(),
  ean: z.date(),
  lote: z.date(),
  promocao: z.date(),
});
