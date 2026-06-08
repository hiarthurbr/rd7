"use client";

import {
  Calendar,
  DateField,
  DatePicker,
  Description,
  Label,
  ProgressBar,
  Tabs,
} from "@heroui/react";
import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Grid2x2XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Auth } from "@/components/auth";
import { getToken } from "@/lib/pda";
import { montagem_caixa_schema } from "@/lib/schemas";
import { fmt_date } from "@/lib/utils";
import skus from "./skus.json";
import { UserComparison } from "./user-comparison";
import { UserDashboard } from "./user-dashboard";
import { UsersTable } from "./users-table";

export const per_user_schema = z.record(
  z.string(),
  z.object({
    total_embalagens: z.number(),
    pedidos_conferidos: z.set(z.string()),
    caixas: z.set(z.string()),
    por_hora: z.record(
      z.string(),
      z.object({
        total_embalagens: z.number(),
        pedidos_conferidos: z.set(z.string()),
        caixas: z.set(z.string()),
      }),
    ),
    pedidos_por_hora: z.number(),
    caixas_por_hora: z.number(),
    embalagens_por_hora: z.number(),
    hora_inicio: z.date(),
    hora_fim: z.date(),
    duração: z.string(),
  }),
);

async function get_relatorio_conferencia(date: Date) {
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

const horas_trabalhadas = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const marcadores: Array<{
  label: string;
  momento: { hh: number; mm: number };
}> = [
  { label: "Entrada 2° turno", momento: { hh: 12, mm: 0 } },
  { label: "Saída almoço", momento: { hh: 12, mm: 15 } },
  { label: "Volta do almoço", momento: { hh: 13, mm: 15 } },
  { label: "Saída 1° turno", momento: { hh: 17, mm: 0 } },
  { label: "Saída jantar", momento: { hh: 17, mm: 30 } },
  { label: "Volta do jantar", momento: { hh: 18, mm: 30 } },
];
const duration_locale = new Intl.DurationFormat("pt-BR", {
  style: "long",
});

function duration(start: Date, end: Date) {
  const seconds = Math.abs(start.getTime() - end.getTime()) / 1000;

  return duration_locale.format({
    hours: Math.floor(seconds / 3600),
    minutes: Math.ceil(seconds % 60),
  });
}

function Page() {
  const now = useMemo(() => today(getLocalTimeZone()), []);
  const [date, setDate] = useState<DateValue>(now);

  const [queryClient, hours_filter] = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return [
      new QueryClient(),
      horas_trabalhadas.map(
        (h) =>
          [
            h,
            new Date(today.getTime() + h * 1000 * 60 * 60),
            new Date(today.getTime() + (h + 1) * 1000 * 60 * 60),
          ] as const,
      ),
    ];
  }, []);
  const { data, isFetching, dataUpdatedAt } = useQuery(
    {
      queryKey: ["relatorio_conferencia", date],
      queryFn: () => get_relatorio_conferencia(date.toDate(getLocalTimeZone())),
      refetchInterval: 1000 * 60 * 60,
      staleTime: 1000 * 60 * 15,
      // enabled: false,
    },
    queryClient,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: usar o dataUpdatedAt é necessario, porque o data pode não atualizar no momento do refetch, se o resultado anterior for o mesmo
  const per_user: z.infer<typeof per_user_schema> = useMemo(
    () =>
      data == null
        ? {}
        : Object.fromEntries(
            Array.from(new Set(data.map((e) => e.usuario)))
              .map((user) => data.filter((cx) => cx.usuario === user))
              .map((data) => {
                const now = new Date();
                const per_hour: [number, typeof data][] = hours_filter
                  .filter(([, start]) => start <= now)
                  .map(([hour, start, end]) => [
                    hour,
                    data.filter((cx) => cx.montagem >= start && cx.montagem < end),
                  ]);

                const total_embalagens = Object.entries(
                  data.reduce(
                    (obj, prod) => {
                      if (prod.produto in obj) obj[prod.produto] += prod.quantidade;
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
                  .reduce((a, b) => a + b, 0);

                const pedidos_conferidos = new Set(data.map((cx) => cx.codigoPedido));

                const hora_inicio = Math.min(...data.map((cx) => cx.montagem.getTime()));
                const hora_fim = Math.max(...data.map((cx) => cx.montagem.getTime()));

                const horas_conferidas = Math.abs(hora_fim - hora_inicio) / 3600000;

                const por_hora = per_hour.map(
                  ([hour, data]) =>
                    [
                      hour,
                      {
                        total_embalagens: Object.entries(
                          data.reduce(
                            (obj, prod) => {
                              if (prod.produto in obj) obj[prod.produto] += prod.quantidade;
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
                        pedidos_conferidos: new Set(data.map((cx) => cx.codigoPedido)),
                        caixas: new Set(data.map((cx) => cx.caixa)),
                      },
                    ] as const,
                );

                const pedidos_por_hora = pedidos_conferidos.size / horas_conferidas;

                const caixas = new Set(data.map((cx) => cx.caixa));

                const caixas_por_hora = caixas.size / horas_conferidas;

                return [
                  data[0].usuario,
                  {
                    total_embalagens,
                    pedidos_conferidos,
                    caixas,
                    por_hora: Object.fromEntries(por_hora),
                    pedidos_por_hora,
                    caixas_por_hora,
                    embalagens_por_hora: total_embalagens / horas_conferidas,
                    hora_inicio: new Date(hora_inicio),
                    hora_fim: new Date(hora_fim),
                    duração: duration(new Date(hora_inicio), new Date(hora_fim)),
                  },
                ];
              }),
          ),
    [data, dataUpdatedAt, hours_filter],
  );

  console.log(per_user);

  return (
    <main className="min-h-screen bg-background p-6 flex flex-col items-center">
      <div className="space-y-6">
        <header className="space-y-2 container flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Painel de Produtividade
          </h1>
          <p className="text-muted-foreground">Visualize e compare o desempenho dos usuarios</p>
          <DatePicker
            name="date"
            value={date}
            onChange={(date) => date != null && setDate(date)}
            className="w-64"
          >
            <Label>Produtividade do dia</Label>
            <DateField.Group fullWidth>
              <DateField.Input>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateField.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator />
                </DatePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DatePicker.Popover>
              <Calendar aria-label="Event date" maxValue={now}>
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
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
                <Calendar.YearPickerGrid>
                  <Calendar.YearPickerGridBody>
                    {({ year }) => <Calendar.YearPickerCell year={year} />}
                  </Calendar.YearPickerGridBody>
                </Calendar.YearPickerGrid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
        </header>

        {isFetching ? (
          <div className="flex flex-col items-center pt-32">
            <ProgressBar size="lg" isIndeterminate aria-label="Loading" className="w-64">
              <Label className="mb-3.5 mt-5">Carregando dados</Label>
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
        ) : Object.keys(per_user).length === 0 ? (
          <div className="flex flex-col items-center pt-32">
            <Grid2x2XIcon />
            <Label className="mb-3.5 mt-5">Nenhum dado encontrado</Label>
            <Description className="mb-8">Selecione outra data no seletor acima</Description>
          </div>
        ) : (
          <Tabs className="min-w-full">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Options">
                <Tabs.Tab id="overview">
                  Tabela Geral
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="analytics">
                  Metricas do usuário
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="reports">
                  Comparação
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel className="pt-4" id="overview">
              <UsersTable data={per_user} />
            </Tabs.Panel>
            <Tabs.Panel className="pt-4" id="analytics">
              <UserDashboard data={per_user} />
            </Tabs.Panel>
            <Tabs.Panel className="pt-4" id="reports">
              <UserComparison data={per_user} />
            </Tabs.Panel>
          </Tabs>
        )}
      </div>
    </main>
  );
}

export default () =>
  process.env.NODE_ENV === "development" ? (
    Page
  ) : (
    // biome-ignore lint/style/noNonNullAssertion: o valor é hash é conferido no elemento Auth para verificar se é != de null
<Auth Element={Page} hash={process.env.NEXT_PUBLIC_CONFERENCIA_HASH!} />
  );
