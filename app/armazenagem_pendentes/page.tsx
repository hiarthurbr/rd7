"use client";
import { getToken } from "@/lib/pda";
import { ProgressCircle, TableLayout, Tabs, Virtualizer, Table } from "@heroui/react";
import { useCountdown } from "@shined/react-use";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import z from "zod";

const fmt_date = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth().toFixed(0).padStart(2, "0")}-${date.getDate().toFixed(0).padStart(2, "0")}`;

const timeRangeEnum = z.enum({
  Day: 1,
  Week: 7,
  Month: 30,
});

const recebimento_schema = z.object({
  codigoRecebimento: z.number(),
  notafiscal: z.string(),
  codigoPedido: z.string(),
  lote: z.string(),
  numeroSerie: z.string(),
  produto: z.string(),
  cor: z.string(),
  tamanho: z.string(),
  grade: z.string(),
  descricao: z.string(),
  quantidadePedido: z.number(),
  quantidadeRecebido: z.number(),
  quantidadeArmazenada: z.number(),
  pendenteArmazenar: z.number(),
  usuarioRecebimento: z.string(),
  dataRecebimento: z.coerce.date().or(z.date()),
  tipoPedido: z.string(),
});

const QUERY_KEY = "armazenagens_pendentes";

export default function Page() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const [timeRange, setTimeRange] = useState<z.infer<typeof timeRangeEnum>>(
    timeRangeEnum.enum.Day,
  );

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery(
    {
      queryKey: [QUERY_KEY],
      queryFn: async () => {
        return fetch(
          "https://api.pdahub.com.br/api/Relatorio/RecebimentoAnalitico",
          {
            headers: {
              accept: "application/json, text/plain, */*",
              "content-type": "application/json",
              authorization: await getToken(),
            },
            referrer: "https://wms.pdahub.com.br/",
            body: JSON.stringify({
              notafiscal: null,
              codigoPedido: null,
              palete: null,
              caixa: null,
              lote: null,
              produto: null,
              tipoPedido: null,
              usuarioRecebimento: null,
              usuarioArmazenagem: null,
              dataInicio: fmt_date(
                new Date(Date.now() - 1000 * 60 * 60 * 24 * timeRange),
              ),
              dataFim: fmt_date(new Date()),
            }),
            method: "PATCH",
          },
        )
          .then((r) => r.json())
          .then(z.array(recebimento_schema).parseAsync)
          .then((r) => r.filter((op) => op.pendenteArmazenar > 0).map(nf => ({ ...nf, id: `${nf.notafiscal}-${nf.codigoPedido}-${nf.produto}-${nf.quantidadeArmazenada}-${nf.quantidadePedido}-${nf.quantidadeRecebido}-${nf.pendenteArmazenar}-${nf.usuarioRecebimento}` })));
      },
      refetchInterval: 1000 * 60 * 10,
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: true,
      refetchOnReconnect: true,
    },
    queryClient,
  );

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [timeRange]);

  const date = useMemo(
    () => new Date(dataUpdatedAt + 600_000),
    [dataUpdatedAt],
  );

  const countdown = useCountdown(date, {
    controls: true,
    interval: 1000,
  });

  const spring = useSpring(0, { duration: 500, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(countdown.ms / 1000);
  }, [spring, countdown]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [display]);

  return (
    <main className="min-h-screen bg-background">
      <div className="w-full px-4 py-8 grid grid-flow-col grid-cols-3 items-center">
        {/* Header */}
        <Tabs
          className="w-md justify-self-start place-self-start pt-4"
          onSelectionChange={(key) =>
            setTimeRange(
              timeRangeEnum.parse(
                timeRangeEnum.enum[
                  key as unknown as keyof typeof timeRangeEnum.enum
                ],
              ),
            )
          }
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Options">
              <Tabs.Tab id="Day">
                1 dia
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="Week">
                1 semana
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="Month">
                1 mes
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <div className="mb-8 text-center flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Armazenagens pendentes
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Lista de notas com pendencias/divergências na armazenagem
          </p>
        </div>

        <ProgressCircle
          aria-label="Default"
          color="accent"
          value={displayValue}
          maxValue={600}
          isIndeterminate={isFetching || isLoading || new Date() > date}
          className="justify-self-end place-self-start pt-4"
        >
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
      </div>
      <div className="w-full text-center">
        <Virtualizer
          layout={TableLayout}
          layoutOptions={{
            headingHeight: 42,
            rowHeight: 42,
          }}
        >
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Virtualized table with 1000 rows"
                className="h-full min-w-175 overflow-auto"
              >
                <Table.Header className="h-full w-full">
                  <Table.Column isRowHeader id="nfe" minWidth={160}>
                    Nota Fiscal
                  </Table.Column>
                  <Table.Column id="data" minWidth={220}>
                    Data recebimento
                  </Table.Column>
                  <Table.Column id="sku" minWidth={240}>
                    Produto
                  </Table.Column>
                  <Table.Column id="pendente" minWidth={240}>
                    Pendente
                  </Table.Column>
                  <Table.Column id="progresso" minWidth={240}>
                    Progresso
                  </Table.Column>
                </Table.Header>
                <Table.Body items={data}>
                  {(row) => (
                    <Table.Row>
                      <Table.Cell>{row.notafiscal}</Table.Cell>
                      <Table.Cell>{row.dataRecebimento.toDateString()}</Table.Cell>
                      <Table.Cell>{row.produto}</Table.Cell>
                      <Table.Cell>{row.pendenteArmazenar}</Table.Cell>
                      <Table.Cell>{row.quantidadeArmazenada}/{row.quantidadeRecebido}</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Virtualizer>
      </div>
    </main>
  );
}
