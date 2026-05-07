import z from "zod";
import { uuidv7 } from "uuidv7";

export function getDisponivel(item: string) {
  const product = z.object({
    produto: z.string(),
    nome: z.string(),
    unidade: z.enum(["UNID"]),
    tipo: z.string(),
    nivel: z.number(),
    necessario: z.number(),
    estoque: z.number(),
    emCompra: z.number(),
    emProducao: z.number(),
    falta: z.number(),
    origem: z.string(),
    paiDireto: z.string(),
    estrutura: z.string(),
    status: z.string(),
  });
  const schema = z.object({
    data: z.array(product),
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
    `https://api-erp.rainhadassete.com.br/api/Mrp/planning-bom-paged?principalPartNumber=${item}&periodStart=${past_month.getFullYear()}-${past_month.getMonth()}-${past_month.getDay()}&periodEnd=${now.getFullYear()}-${now.getMonth()}-${now.getDay()}&pageNumber=1&pageSize=10`,
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

export function getPropostas() {
  const schema = z.array(
    z.object({
      codigoProposta: z.int(),
      numeroProposta: z.string(),
      nomeEmpresa: z.string(),
      nomeVendedor: z.string(),
      dataLiberacaoProposta: z.coerce.date().or(z.date()),
      liquidoProposta: z.number(),
      vinculos: z.int(),
      itensDiferentesTotalProposta: z.int(),
      itensDiferentesAlocadosProposta: z.int(),
      percentualItensAlocadosProposta: z.number(),
      percentualItensAlocadosPropostaNoGrupo: z.number(),
      statusProposta: z.number(),
      statusPda: z.number(),
      descricaoStatusPda: z.string(),
      ePrioridade: z.boolean(),
      critico: z.boolean(),
      programada: z.string(),
      pais: z.coerce.number(),
      estado: z.string(),
      pendenciaFinanceira: z.string(),
    }),
  );

  return fetch(
    "https://api-erp.rainhadassete.com.br/api/expedicao/propostas-status-pda",
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
    .then(schema.parseAsync);
}

export function getVendaPerdida() {
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
