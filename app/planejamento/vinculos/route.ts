import z from "zod";
import skus from "../../produtividade/conferencia/skus.json";

const PropostasStatusPDASchema = z.object({
  codigoProposta: z.int().positive(),
  numeroProposta: z.string(),
  nomeEmpresa: z.string(),
  nomeVendedor: z.string(),
  dataLiberacaoProposta: z.date().or(z.coerce.date()).optional(),
  liquidoProposta: z.number(),
  vinculos: z.int().gte(0),
  itensDiferentesTotalProposta: z.int().gte(0),
  itensDiferentesAlocadosProposta: z.int().gte(0),
  percentualItensAlocadosProposta: z.number().gte(0).lte(100),
  percentualItensAlocadosPropostaNoGrupo: z.number().gte(0).lte(100),
  statusProposta: z.int().positive(),
  statusPda: z.int().positive().optional(),
  descricaoStatusPda: z.string().catch(() => "Sem Status PDA"),
  ePrioridade: z.boolean(),
  critico: z.boolean(),
  dataProgramada: z.date().or(z.coerce.date()).optional(),
  programada: z.stringbool({
    truthy: ["sim"],
    falsy: ["nao", "não"],
  }),
  pais: z.string(),
  estado: z.string(),
  pendenciaFinanceira: z.string(),
  liberada: z.boolean(),
  industria: z.boolean(),
});

const ItensPropostaSchema = z.strictObject({
  codigoItemProposta: z.int(),
  nomeProduto: z.string(),
  partNumberProduto: z.string(),
  quantidadeItemProposta: z.number(),
  liquidoUnitario: z.number(),
  liquidoTotal: z.number(),
  statusItemProposta: z.int(),
  itemVendaPerdida: z.int().optional(),
});

const considerar_status = [
  "Andamento",
  "Aguardando Conferência",
  "Finalizado c/divergência",
  "Aguardando Faturamento",
];

const map_status = {
  Andamento: "A",
  Criado: "N",
  "Estoque Insuficiente": "I",
  Ressuprimento: "R",
  Planejado: "P",
  "Aguardando Conferência": "C",
  "Finalizado c/divergência": "C",
  "Aguardando Faturamento": "F",
};

export async function GET() {
  const propostas = await fetch(
    "https://api-erp.rainhadassete.com.br/api/expedicao/propostas-status-pda",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "pt-BR,pt;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=1, i",
      },
      referrer: "https://rainhaerp.rainhadassete.com.br/",
      body: null,
      method: "GET",
    },
  )
    .then((r) => r.json())
    .then(PropostasStatusPDASchema.array().parseAsync)
    .then((r) =>
      Promise.all(
        r.map((p) =>
          fetch(
            `https://api-erp.rainhadassete.com.br/api/expedicao/itens-proposta/${p.codigoProposta}`,
            {
              headers: {
                accept: "application/json, text/plain, */*",
                "accept-language": "pt-BR,pt;q=0.9",
                "cache-control": "no-cache",
                pragma: "no-cache",
                priority: "u=1, i",
              },
              referrer: "https://rainhaerp.rainhadassete.com.br/",
              body: null,
              method: "GET",
            },
          )
            .then((r) => r.json())
            .then(ItensPropostaSchema.array().parseAsync)
            .then((rr) => ({
              ...p,
              n_embalagens: rr
                .filter((i) => i.itemVendaPerdida == null)
                .reduce(
                  (i_cum, i) =>
                    i_cum +
                    Math.ceil(i.quantidadeItemProposta) /
                      Math.max(1, skus[i.partNumberProduto as keyof typeof skus] ?? 1),
                  0,
                ),
            })),
        ),
      ),
    );

  const propostas_principais = Object.fromEntries(
    Array.from(new Set(propostas.map((proposta) => proposta.numeroProposta.split("-")[0]))).map(
      (a) => [a, propostas.filter((proposta) => proposta.numeroProposta.startsWith(a))],
    ),
  );

  for (const pedido in propostas_principais) {
    if (
      !propostas_principais[pedido].some((proposta) =>
        considerar_status.includes(proposta.descricaoStatusPda),
      ) ||
      propostas_principais[pedido].every((proposta) =>
        considerar_status.includes(proposta.descricaoStatusPda),
      )
    ) {
      delete propostas_principais[pedido];
      continue;
    }

    const liquidoPedido = propostas_principais[pedido].reduce(
      (a, proposta) => a + proposta.liquidoProposta,
      0,
    );
    const propostasFinalizadas = new Set(
      propostas_principais[pedido]
        .filter((proposta) => considerar_status.includes(proposta.descricaoStatusPda))
        .map(
          (proposta) =>
            `${proposta.codigoProposta} (${proposta.numeroProposta.split("-")[1]}) (${map_status[proposta.descricaoStatusPda as keyof typeof map_status]})`,
        ),
    );
    const aguardandoPropostas = new Set(
      propostas_principais[pedido].map(
        (proposta) =>
          `${proposta.codigoProposta} (${proposta.numeroProposta.split("-")[1]}) (${map_status[proposta.descricaoStatusPda as keyof typeof map_status]})`,
      ),
    ).symmetricDifference(propostasFinalizadas);

    propostas_principais[pedido] = propostas_principais[pedido].map((proposta) => ({
      ...proposta,
      liquidoPedido,
      propostasFinalizadas: Array.from(propostasFinalizadas).join(", "),
      aguardandoPropostas: Array.from(aguardandoPropostas).join(", "),
    }));
  }

  return Response.json(
    Object.values(propostas_principais)
      .flat()
      .filter((proposta) => !considerar_status.includes(proposta.descricaoStatusPda)),
  );
}
