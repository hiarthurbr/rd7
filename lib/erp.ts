import z from "zod";
import { uuidv7 } from "uuidv7";
import { produto_titanium_schema, status_proposta_pda_schema } from "./schemas";
import { fmt_date } from "./utils";

export async function getDisponivel(item: string) {
  const schema = z.object({
    data: z.array(produto_titanium_schema),
    pageNumber: z.int(),
    pageSize: z.int(),
    totalRecords: z.int(),
    totalPages: z.int(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  });

  const now = new Date();
  const past_month = new Date(now.getTime() - 2592000000);
  return fetch(
    `https://api-erp.rainhadassete.com.br/api/Mrp/planning-bom-paged?principalPartNumber=${item}&periodStart=${fmt_date(past_month)}&periodEnd=${fmt_date(now)}&pageNumber=1&pageSize=10`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
      },
      referrer: "https://rainhaerp.rainhadassete.com.br/",
      body: null,
      method: "GET",
    },
  )
    .then((r) => r.json())
    .then(schema.parseAsync)
    .then((r) => r.data.find((i) => i.produto === item)?.estoque);
}

export async function getPropostas() {
  return fetch(
    "https://api-erp.rainhadassete.com.br/api/expedicao/propostas-status-pda",
    {
      headers: {
        accept: "application/json, text/plain, */*",
      },
      referrer: "https://rainhaerp.rainhadassete.com.br/",
      body: null,
      method: "GET",
    },
  )
    .then((r) => r.json())
    .then(status_proposta_pda_schema.array().parseAsync);
}

export async function getVendaPerdida() {
  const schema = z.array(
    z
      .object({
        codigoProduto: z.int(),
        partnumberProduto: z.string(),
        pcp: z.coerce.number(),
        quantidadeItemProposta: z.number(),
        numeroProposta: z.string(),
        nomeMotivo: z.string(),
        dataVendaPerdida: z.string(),
        descricaoHistorico: z.string(),
        horaVendaPerdida: z.string(),
        tipo: z.string(),
        valorUnitario: z.number(),
        valorTotal: z.number(),
      })
      .transform(({ dataVendaPerdida, horaVendaPerdida, ...v }) => ({
        momentoVendaPerdida: new Date(
          `${dataVendaPerdida.trim().split("/").reverse().join("-")}T${horaVendaPerdida.trim()}`,
        ),
        uuid: uuidv7(),
        ...v,
      })),
  );

  return fetch(
    "https://api-erp.rainhadassete.com.br/api/Propostas/vendas/vendas-perdidas?dataInicial=01%2F01%2F2026&dataFinal=31%2F12%2F2026",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
      },
      referrer: "https://rainhaerp.rainhadassete.com.br/",
      body: null,
      method: "GET",
    },
  ).then((r) => r.json()).then(schema.parseAsync);
}

