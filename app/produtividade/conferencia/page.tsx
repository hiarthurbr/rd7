"use client";

import { getToken } from "@/lib/pda";
import { montagem_caixa_schema } from "@/lib/schemas";
import { fmt_date } from "@/lib/utils";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import skus from "./skus.json";

async function get_relatorio_conferencia(date: Date = new Date()) {
  return fetch("https://api.pdahub.com.br/api/Armazenagem/MontagemCaixa", {
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
  })
    .then((r) => r.json())
    .then(montagem_caixa_schema.array().parseAsync);
}

export default function Page() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const { data, isLoading, isFetching } = useQuery(
    {
      queryKey: ["relatorio_conferencia"],
      queryFn: () => get_relatorio_conferencia(),
      refetchInterval: 1000 * 60 * 60,
      staleTime: 1000 * 60 * 15,
    },
    queryClient,
  );

  const per_user = useMemo(
    () =>
      data == null
        ? {}
        : Object.fromEntries(
            Array.from(new Set(data.map((e) => e.usuario))).map((user) => [
              user,
              Object.entries(
                data
                  .filter((cx) => cx.usuario === user)
                  .reduce(
                    (obj, prod) => {
                      if (prod.produto in obj)
                        obj[prod.produto] += prod.quantidade;
                      else obj[prod.produto] = prod.quantidade;
                      return obj;
                    },
                    {} as Record<string, number>,
                  ),
              )
                .map(
                  ([produto, quantidade]) =>
                    quantidade / (skus[produto as keyof typeof skus] ?? 1),
                )
                .reduce((a, b) => a + b, 0),
            ]),
          ),
    [data],
  );

  console.log(per_user);

  return <div></div>;
}
