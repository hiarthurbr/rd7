import Dexie, { type Table } from "dexie";
import type z from "zod";
import { getToken } from "@/lib/pda";
import { montagem_caixa_schema } from "@/lib/schemas";
import { fmt_date } from "@/lib/utils";

// --- CLASSE DO BANCO DE DADOS ---
export class ProdutividadeConferencia extends Dexie {
  caixas!: Table<z.infer<typeof montagem_caixa_schema> & { id?: number }>;

  constructor() {
    super("ProdutividadeConferenciaDB");

    this.version(1).stores({
      // O primeiro campo é a chave primária (++ significa autoincremento)
      // Os campos seguintes são os índices para busca
      caixas:
        "++id, endereco, codigoCaixa, caixa, produto, descricaoProduto, quantidade, usuario, montagem, codigoPedido, descTipoCaixa",
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
      new Date(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}T00:00:00.000`,
      ),
      new Date(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}T23:59:59.999`,
      ),
      true,
      true,
    );

  const has_data = (await db_query.count()) > 0;

  if (is_today || !has_data) {
    const res = await fetch(
      "https://api.pdahub.com.br/api/Armazenagem/MontagemCaixa",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: await getToken(),
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
      },
    )
      .then((r) => r.json())
      .then(montagem_caixa_schema.array().parseAsync);

    if (!has_data) {
      await db.caixas.bulkAdd(res);
    }

    return res;
  }

  return db_query.toArray();
}
