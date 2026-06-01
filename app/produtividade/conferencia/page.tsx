import { getToken } from "@/lib/pda";
import { relatorio_conferencia_schema } from "@/lib/schemas";
import { fmt_date } from "@/lib/utils";
import z from "zod";

async function get_relatorio_conferencia(date: Date = new Date()) {
  fetch("https://api.pdahub.com.br/api/Relatorio/Pedido/Conferencia", {
    headers: {
      accept: "application/json, text/plain, */*",
      authorization: await getToken(),
      "cache-control": "no-cache",
      "content-type": "application/json",
    },
    referrer: "https://wms.pdahub.com.br/",
    body: JSON.stringify({
      codigoCliente: 30,
      codigoPedido: null,
      produto: null,
      codigoTransportadora: null,
      tipoPedido: null,
      dataInicio: fmt_date(date),
      dataFim: fmt_date(date),
      codigoStatus: null,
    }),
    method: "PATCH",
  }).then(r => r.json()).then(z.array(relatorio_conferencia_schema).parseAsync);
}

export default function Page() {}
