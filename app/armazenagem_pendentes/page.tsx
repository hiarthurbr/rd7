"use client";
import { getToken } from "@/lib/pda";
import {
  ProgressCircle,
  TableLayout,
  Tabs,
  Virtualizer,
  Table,
  DatePicker,
  Label,
  DateField,
  Calendar,
  TimeField,
  TimeValue,
  EmptyState,
  ProgressBar,
} from "@heroui/react";
import { fromDate } from "@internationalized/date";
import { useCountdown } from "@shined/react-use";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { useSpring, useTransform } from "framer-motion";
import { InboxIcon } from "lucide-react";
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
          .then((r) =>
            r
              .filter((op) => op.pendenteArmazenar > 0)
              .map((nf) => ({ ...nf, id: Object.values(nf).sort().join("-") })),
          );
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
          selectedKey={
            timeRange === 1 ? "Day" : timeRange === 7 ? "Week" : "Month"
          }
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
      <div className="container text-center mx-auto">
        <Virtualizer
          layout={TableLayout}
          layoutOptions={{
            headingHeight: 42,
            rowHeight: 50,
          }}
        >
          <Table>
            <Table.ScrollContainer className="h-[75vh]">
              <Table.Content
                aria-label="Virtualized table with 1000 rows"
                className="h-full min-w-175 overflow-auto"
              >
                <Table.Header className="h-full w-full">
                  <Table.Column isRowHeader id="nfe" maxWidth={200}>
                    Nota Fiscal
                  </Table.Column>
                  <Table.Column id="data" maxWidth={300}>
                    Data recebimento
                  </Table.Column>
                  <Table.Column id="sku" maxWidth={384}>Produto</Table.Column>
                  <Table.Column id="pendente" maxWidth={200}>Pendente</Table.Column>
                  <Table.Column id="progresso">Progresso</Table.Column>
                </Table.Header>
                <Table.Body
                  items={data}
                  renderEmptyState={() => (
                    <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                      <InboxIcon className="size-6 stroke-muted" />
                      <span className="text-sm text-muted">
                        Nenhum resultado encontrado
                      </span>
                    </EmptyState>
                  )}
                >
                  {(row) => (
                    <Table.Row>
                      <Table.Cell className="text-left">{row.notafiscal}</Table.Cell>
                      <Table.Cell className="p-0 flex items-center justify-center">
                        <DatePicker
                          aria-label="Horario do recebimento"
                          className="w-64"
                          value={fromDate(
                            row.dataRecebimento,
                            "America/Sao_Paulo",
                          )}
                          granularity="minute"
                          hourCycle={24}
                          name="date"
                          shouldForceLeadingZeros
                          hideTimeZone
                        >
                          {({ state }) => (
                            <>
                              <DateField.Group fullWidth>
                                <DateField.Input>
                                  {(segment) => (
                                    <DateField.Segment segment={segment} />
                                  )}
                                </DateField.Input>
                                <DateField.Suffix>
                                  <DatePicker.Trigger>
                                    <DatePicker.TriggerIndicator />
                                  </DatePicker.Trigger>
                                </DateField.Suffix>
                              </DateField.Group>
                              <DatePicker.Popover className="flex flex-col gap-3">
                                <Calendar aria-label="Horario do recebimento">
                                  <Calendar.Header>
                                    <Calendar.YearPickerTrigger>
                                      <Calendar.YearPickerTriggerHeading />
                                      <Calendar.YearPickerTriggerIndicator />
                                    </Calendar.YearPickerTrigger>
                                    <Calendar.NavButton slot="previous" />
                                    <Calendar.NavButton slot="next" />
                                  </Calendar.Header>
                                  <Calendar.Grid>
                                    <Calendar.GridHeader>
                                      {(day) => (
                                        <Calendar.HeaderCell>
                                          {day}
                                        </Calendar.HeaderCell>
                                      )}
                                    </Calendar.GridHeader>
                                    <Calendar.GridBody>
                                      {(date) => <Calendar.Cell date={date} />}
                                    </Calendar.GridBody>
                                  </Calendar.Grid>
                                  <Calendar.YearPickerGrid>
                                    <Calendar.YearPickerGridBody>
                                      {({ year }) => (
                                        <Calendar.YearPickerCell year={year} />
                                      )}
                                    </Calendar.YearPickerGridBody>
                                  </Calendar.YearPickerGrid>
                                </Calendar>
                                <div className="flex items-center justify-between">
                                  <Label>Horario do recebimento</Label>
                                  <TimeField
                                    aria-label="Horario do recebimento"
                                    granularity="minute"
                                    hourCycle={24}
                                    name="time"
                                    value={state.timeValue}
                                    onChange={(v) =>
                                      state.setTimeValue(v as TimeValue)
                                    }
                                    shouldForceLeadingZeros
                                    hideTimeZone
                                    isReadOnly
                                  >
                                    <TimeField.Group variant="secondary">
                                      <TimeField.Input>
                                        {(segment) => (
                                          <TimeField.Segment
                                            segment={segment}
                                          />
                                        )}
                                      </TimeField.Input>
                                    </TimeField.Group>
                                  </TimeField>
                                </div>
                              </DatePicker.Popover>
                            </>
                          )}
                        </DatePicker>
                      </Table.Cell>
                      <Table.Cell>{row.produto}</Table.Cell>
                      <Table.Cell>{row.pendenteArmazenar}</Table.Cell>
                      <Table.Cell className="py-2 px-8">
                        <ProgressBar
                          aria-label="Revenue"
                          className="w-full"
                          maxValue={row.quantidadeRecebido}
                          minValue={0}
                          value={row.quantidadeArmazenada}
                        >
                          <Label>Progresso ({row.quantidadeArmazenada} / {row.quantidadeRecebido})</Label>
                          <ProgressBar.Output />
                          <ProgressBar.Track>
                            <ProgressBar.Fill />
                          </ProgressBar.Track>
                        </ProgressBar>
                      </Table.Cell>
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
