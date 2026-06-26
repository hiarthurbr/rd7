"use client";

import {
  Button,
  ButtonGroup,
  Calendar,
  DateField,
  DatePicker,
  Description,
  Label,
  NumberField,
  ProgressBar,
  Spinner,
  Tabs,
  Tooltip,
} from "@heroui/react";
import { type DateValue, fromDate, getLocalTimeZone, now, today } from "@internationalized/date";
import { useNow } from "@shined/react-use";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Grid2x2XIcon,
  RefreshCwIcon,
} from "lucide-react";
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { z } from "zod";
import { Auth } from "@/components/auth";
import { montagem_caixa_schema, produtividade_conferencia_schema } from "@/lib/schemas";
import { relative_locale } from "@/lib/utils";
import data_cache from "./2026-06-15.json";
import { get_relatorio_conferencia } from "./get_data";
import skus_pre from "./skus.json";
import { UserComparison } from "./user-comparison";
import { UserDashboard } from "./user-dashboard";
import { UsersTable } from "./users-table";

const skus = z.record(z.string(), z.number().positive().catch(1)).parse(skus_pre);

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
    produtos: z.array(
      z.object({
        sku: z.string(),
        quantidade_pre: z.number(),
        multiplo: z.number().optional().nullable(),
      }),
    ),
    pedidos_por_hora: z.number(),
    caixas_por_hora: z.number(),
    embalagens_por_hora: z.number(),
    hora_inicio: z.date(),
    hora_fim: z.date(),
    duração: z.number(),
    meta: z.number(),
  }),
);

export const horas_trabalhadas = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
export const marcadores: Array<{
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

const data_processing_schema = produtividade_conferencia_schema
  .omit({ avg: true, meta: true })
  .or(z.object({ per_user: z.null(), per_hour: z.null() }));

export const NAME_KEYS = {
  total_embalagens: "Média de embalagens por hora",
  caixas: "N° de caixas",
  pedidos_conferidos: "N° de pedidos conferidos",
} as const;

export const SelectedUserContext = createContext<
  [string | null, Dispatch<SetStateAction<string | null>>] | null
>(null);
export const SelectedSectionContext = createContext<
  [string, Dispatch<SetStateAction<string>>] | null
>(null);

function Page() {
  const BYPASS_DEV_CACHE = useMemo(
    () =>
      process.env.NODE_ENV !== "development" ||
      new URLSearchParams(globalThis?.location?.search ?? "").get("bypass_dev_cache") === "true",
    [],
  );

  const timezone = useMemo(() => getLocalTimeZone(), []);
  const [date, setDate] = useState<DateValue>(
    BYPASS_DEV_CACHE ? today(timezone) : fromDate(new Date("2026-06-15T00:00:00.000"), timezone),
  );
  const [meta, setMeta] = useState(800);

  const queryClient = useQueryClient();
  const hours_filter = useMemo(
    () =>
      horas_trabalhadas.map(
        (h) =>
          [
            h,
            new Date(date.toDate(timezone).getTime() + h * 1000 * 60 * 60),
            new Date(date.toDate(timezone).getTime() + (h + 1) * 1000 * 60 * 60),
          ] as const,
      ),
    [date, timezone],
  );
  const { data, isFetching, dataUpdatedAt, isPending } = useQuery({
    queryKey: ["relatorio_conferencia", date],
    queryFn: () =>
      BYPASS_DEV_CACHE
        ? get_relatorio_conferencia(date.toDate(timezone))
        : montagem_caixa_schema.array().parseAsync(data_cache),
    refetchInterval: 1000 * 60 * 60,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 15,
    placeholderData: (previousData, _) => previousData,
    throwOnError(error, query) {
      console.log({ error, query });
      return false;
    },
    // enabled: false,
  });
  const [isUpdated, setIsUpdated] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: precisamos atualizar o estado do botão de refresh toda vez que atualizamos os dados, por isso usamos o dataUpdatedAt
  useEffect(() => {
    setIsUpdated(true);
    setTimeout(() => setIsUpdated(false), 5000);
  }, [dataUpdatedAt]);

  const curr_now = useNow({ interval: 1000 });
  const now_ = now(timezone);
  // biome-ignore lint/correctness/useExhaustiveDependencies: usar o dataUpdatedAt é necessario, porque o data pode não atualizar no momento do refetch, se o resultado anterior for o mesmo
  const { per_user, per_hour }: z.infer<typeof data_processing_schema> = useMemo(() => {
    if (data == null) return { per_hour: null, per_user: null };

    return {
      per_user: Object.fromEntries(
        Array.from(new Set(data.map((e) => e.usuario)))
          .map((user) => data.filter((cx) => cx.usuario === user))
          .map((data) => {
            const produtos = Object.entries(
              data.reduce(
                (obj, prod) => {
                  if (prod.produto in obj) obj[prod.produto] += prod.quantidade;
                  else obj[prod.produto] = prod.quantidade;
                  return obj;
                },
                {} as Record<string, number>,
              ),
            ).map(([sku, quantidade_pre]) => ({
              sku,
              quantidade_pre,
              multiplo: skus[sku as keyof typeof skus],
            }));

            const total_embalagens = produtos
              .map(({ quantidade_pre, multiplo }) => quantidade_pre / (multiplo ?? 1))
              .reduce((a, b) => a + b, 0);

            const pedidos_conferidos = new Set(data.map((cx) => cx.codigoPedido));

            const hora_inicio = Math.min(...data.map((cx) => cx.montagem.getTime()));
            const hora_fim = Math.max(...data.map((cx) => cx.montagem.getTime()));

            const horas_conferidas = Math.abs(hora_fim - hora_inicio) / 3_600_000;

            const por_hora = hours_filter
              .filter(([, start]) => start <= now_.toDate())
              .map(
                ([hour, start, end]) =>
                  [
                    hour,
                    data.filter(
                      (cx) =>
                        fromDate(cx.montagem, timezone).compare(fromDate(start, timezone)) > 0 &&
                        fromDate(cx.montagem, timezone).compare(fromDate(end, timezone)) < 0,
                    ),
                  ] as const,
              )
              .map(
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
                duração: Math.floor(Math.abs(hora_inicio - hora_fim) / 60_000),
                produtos,
                meta,
              },
            ];
          }),
      ),
      per_hour: Object.fromEntries(
        hours_filter
          .filter(([, start]) => start <= now_.toDate())
          .map(
            ([hour, start, end]) =>
              [hour, data.filter((cx) => cx.montagem >= start && cx.montagem < end)] as const,
          )
          .map(
            ([hour, data]) =>
              (console.log({ hour }, new Set(data.map((cx) => cx.usuario)).size) as undefined) ||
              ([
                hour,
                {
                  total_embalagens: Math.round(
                    Object.entries(
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
                      .reduce((a, b) => a + b, 0) /
                      Math.max(1, new Set(data.map((cx) => cx.usuario)).size),
                  ),
                  pedidos_conferidos: new Set(data.map((cx) => cx.codigoPedido)),
                  caixas: new Set(data.map((cx) => cx.caixa)),
                },
              ] as const),
          ),
      ),
    };
  }, [data, hours_filter, meta, timezone]);

  console.log({ per_user, per_hour });

  const todays_average = useMemo(() => {
    const values = Object.values(per_user ?? {})
      .filter((v) => Number.isFinite(v.embalagens_por_hora))
      .map((x) => x.embalagens_por_hora);

    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    };
  }, [per_user]);

  console.log(per_user);
  const selectedUserState = useState<string | null>(null);
  const selectedSectionState = useState<string>("overview");

  const last_updated_seconds_raw = Math.floor((curr_now.getTime() - dataUpdatedAt) / 1000);
  const last_updated_seconds = last_updated_seconds_raw % 60;
  const last_updated_minutes = (last_updated_seconds_raw - last_updated_seconds) / 60;

  console.log({ last_updated_seconds, last_updated_minutes });

  return (
    <SelectedSectionContext value={selectedSectionState}>
      <SelectedUserContext value={selectedUserState}>
        <main className="min-h-screen bg-background p-6 flex flex-col items-center">
          <div className="space-y-6">
            <header className="space-x-8 container grid grid-flow-col grid-cols-6 place-items-center">
              <div className="flex flex-col justify-self-end place-self-start my-12 space-y-2">
                <Button
                  isPending={isFetching}
                  onPress={() =>
                    queryClient.invalidateQueries({ queryKey: ["relatorio_conferencia"] })
                  }
                  className={`w-48 ${isUpdated ? "bg-lime-600 text-white" : ""}`}
                  isDisabled={isUpdated}
                >
                  {({ isPending, isDisabled }) => (
                    <>
                      {isPending ? (
                        <Spinner color="current" size="sm" />
                      ) : isDisabled ? (
                        <CheckIcon />
                      ) : (
                        <RefreshCwIcon />
                      )}
                      {isPending
                        ? "Atualizando dados..."
                        : isDisabled
                          ? "Dados atualizados!"
                          : "Atualizar dados"}
                    </>
                  )}
                </Button>
                {!isPending && (
                  <Description className="text-center">
                    Atualizado{" "}
                    {last_updated_minutes > 0 &&
                      relative_locale.format(-last_updated_minutes, "minute")}
                    {last_updated_minutes > 0 && last_updated_seconds > 0 && " e "}
                    {last_updated_seconds > 0 &&
                      relative_locale
                        .format(-last_updated_seconds, "second")
                        .replace(last_updated_minutes > 0 ? "há " : "", "")}
                  </Description>
                )}
              </div>
              <div className="flex flex-col items-center mx-auto col-start-2 col-span-4 space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Painel de Produtividade
                </h1>
                <div className="flex flex-row space-x-4 justify-center">
                  <Tooltip delay={0}>
                    <Button
                      isIconOnly
                      variant="secondary"
                      onPress={() => setDate((curr_date) => curr_date.subtract({ weeks: 1 }))}
                    >
                      <ChevronsLeftIcon />
                    </Button>
                    <Tooltip.Content>
                      <p className="break-normal">Voltar 1 semana</p>
                    </Tooltip.Content>
                  </Tooltip>
                  <Tooltip delay={0}>
                    <Button
                      isIconOnly
                      variant="secondary"
                      onPress={() => setDate((curr_date) => curr_date.subtract({ days: 1 }))}
                    >
                      <ChevronLeftIcon />
                    </Button>
                    <Tooltip.Content>
                      <p className="break-normal">Voltar 1 dia</p>
                    </Tooltip.Content>
                  </Tooltip>
                  <DatePicker
                    name="date"
                    value={date}
                    granularity="day"
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
                      <Calendar aria-label="Event date" maxValue={today(timezone)}>
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
                          <Calendar.GridBody>
                            {(date) => <Calendar.Cell date={date} />}
                          </Calendar.GridBody>
                        </Calendar.Grid>
                        <Calendar.YearPickerGrid>
                          <Calendar.YearPickerGridBody>
                            {({ year }) => <Calendar.YearPickerCell year={year} />}
                          </Calendar.YearPickerGridBody>
                        </Calendar.YearPickerGrid>
                      </Calendar>
                    </DatePicker.Popover>
                    <Description className="capitalize text-center">
                      {date.toDate(timezone).toLocaleString("pt-BR", {
                        year: "numeric",
                        month: "long",
                        weekday: "long",
                        day: "numeric",
                      })}
                    </Description>
                  </DatePicker>

                  <Tooltip delay={0}>
                    <Button
                      isIconOnly
                      variant="secondary"
                      isDisabled={now_.compare(date.add({ days: 1 })) < 0}
                      onPress={() =>
                        setDate((curr_date) => {
                          const new_date = curr_date.add({ days: 1 });

                          if (now_.compare(new_date) >= 0) return new_date;
                          return curr_date;
                        })
                      }
                    >
                      <ChevronRightIcon />
                    </Button>
                    <Tooltip.Content>
                      <p className="break-normal">Avançar 1 dia</p>
                    </Tooltip.Content>
                  </Tooltip>

                  <Tooltip delay={0}>
                    <Button
                      isIconOnly
                      isDisabled={now_.compare(date.add({ weeks: 1 })) < 0}
                      variant="secondary"
                      onPress={() =>
                        setDate((curr_date) => {
                          const new_date = curr_date.add({ weeks: 1 });

                          if (now_.compare(new_date) >= 0) return new_date;
                          return curr_date;
                        })
                      }
                    >
                      <ChevronsRightIcon />
                    </Button>
                    <Tooltip.Content>
                      <p className="break-normal">Avançar 1 semana</p>
                    </Tooltip.Content>
                  </Tooltip>
                </div>
              </div>
              <div className="col-start-6 flex items-center flex-col space-y-2">
                <NumberField
                  className="w-full max-w-64"
                  defaultValue={800}
                  minValue={0}
                  value={meta}
                  onChange={setMeta}
                  step={50}
                  name="meta"
                  isDisabled={isFetching}
                >
                  <Label>Meta por Hora</Label>
                  <NumberField.Group>
                    <NumberField.DecrementButton />
                    <NumberField.Input className="w-30" />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </NumberField>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted">Definir para:</p>
                  <ButtonGroup variant="primary" isDisabled={isFetching} size="sm">
                    <Button onPress={() => setMeta(todays_average.mean)}>
                      Média
                      {isFetching
                        ? ""
                        : ` (${todays_average.mean.toLocaleString("pt-BR", { maximumFractionDigits: 0 })})`}
                    </Button>
                    <Button onPress={() => setMeta(todays_average.median)}>
                      <ButtonGroup.Separator />
                      Mediana
                      {isFetching
                        ? ""
                        : ` (${todays_average.median.toLocaleString("pt-BR", { maximumFractionDigits: 0 })})`}
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </header>

            {isPending ? (
              <div className="flex flex-col items-center pt-32">
                <ProgressBar size="lg" isIndeterminate aria-label="Loading" className="w-64">
                  <Label className="mb-3.5 mt-5">Carregando dados</Label>
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            ) : Object.keys(per_user ?? {}).length === 0 ? (
              <div className="flex flex-col items-center pt-32">
                <Grid2x2XIcon />
                <Label className="mb-3.5 mt-5">Nenhum dado encontrado</Label>
                <Description className="mb-8">Selecione outra data no seletor acima</Description>
              </div>
            ) : (
              <Tabs
                className="min-w-full"
                onSelectionChange={(key) => selectedSectionState[1](key as string)}
                selectedKey={selectedSectionState[0] ?? "overview"}
              >
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
                  <UsersTable
                    data={{ per_user, per_hour, meta, avg: todays_average }}
                    isFetching={isFetching}
                  />
                </Tabs.Panel>
                <Tabs.Panel className="pt-4" id="analytics">
                  <UserDashboard data={per_user ?? {}} />
                </Tabs.Panel>
                <Tabs.Panel className="pt-4" id="reports">
                  <UserComparison data={per_user ?? {}} />
                </Tabs.Panel>
              </Tabs>
            )}
          </div>
        </main>
      </SelectedUserContext>
    </SelectedSectionContext>
  );
}

const isDev = process.env.NODE_ENV === "development";
export default function Pre() {
  return isDev ? (
    <Page />
  ) : (
    // biome-ignore lint/style/noNonNullAssertion: o valor é hash é conferido no elemento Auth para verificar se é != de null
    <Auth Element={Page} hash={process.env.NEXT_PUBLIC_CONFERENCIA_HASH!} />
  );
}
