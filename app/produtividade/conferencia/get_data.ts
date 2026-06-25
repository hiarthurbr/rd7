import Dexie, { type Table } from "dexie";
import type z from "zod";
import { getToken } from "@/lib/pda";
import { montagem_caixa_schema } from "@/lib/schemas";
import { fmt_date } from "@/lib/utils";

// --- CLASSE DO BANCO DE DADOS ---
export class ProdutividadeConferencia extends Dexie {
  caixas!: Table<z.infer<typeof montagem_caixa_schema>>;

  constructor() {
    super("ProdutividadeConferenciaDB");

    this.version(1).stores({
      // O primeiro campo é a chave primária (++ significa autoincremento)
      // Os campos seguintes são os índices para busca
      caixas:
        "id, endereco, codigoCaixa, caixa, produto, descricaoProduto, quantidade, usuario, montagem, codigoPedido, descTipoCaixa",
    });
  }
}

const db = new ProdutividadeConferencia();

export async function get_relatorio_conferencia(date: Date) {
  const today = new Date();
  const is_today =
    date.getUTCDay() === today.getUTCDay() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCFullYear() === today.getUTCFullYear();

  const db_query = db.caixas
    .where("montagem")
    .between(
      new Date(`${fmt_date(date)}T00:00:00.000`),
      new Date(`${fmt_date(date)}T23:59:59.999`),
      true,
      true,
    );

  return db_query.count().then((count) => {
    const has_data = count > 0;

    console.log({ is_today, has_data });

    if (is_today || !has_data) {
      const res = getToken()
        .then((authorization) =>
          fetch("https://api.pdahub.com.br/api/Armazenagem/MontagemCaixa", {
            headers: {
              accept: "application/json, text/plain, */*",
              authorization,
              "content-type": "application/json",
            },
            referrer: "https://wms.pdahub.com.br/",
            body: JSON.stringify({
              CodigoCliente: 30,
              User: 1297,
              Caixa: null,
              Produto: null,
              Ean: null,
              Usuario: null,
              TipoCaixa: null,
              codigoPedido: null,
              dataInicio: fmt_date(date),
              dataFim: fmt_date(date),
            }),
            method: "PATCH",
          }),
        )
        .then((r) => r.json())
        .then(montagem_caixa_schema.array().parseAsync)
        .then(
          (res) =>
            new Promise<typeof res>((resolve) =>
              !has_data && !is_today
                ? db.caixas.bulkAdd(res).then(() => resolve(res))
                : resolve(res),
            ),
        );

      return res;
    }
    return db_query.toArray();
  });
}
