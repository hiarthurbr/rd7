"use client";
import { getToken } from "@/lib/pda";
import { cn } from "@/lib/utils";
import {
  ProgressCircle,
  Tabs,
  Table,
  DatePicker,
  Label,
  DateField,
  Calendar,
  TimeField,
  TimeValue,
  EmptyState,
  ProgressBar,
  SortDescriptor,
  Pagination,
} from "@heroui/react";
import { fromDate } from "@internationalized/date";
import { useCountdown } from "@shined/react-use";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { useSpring, useTransform } from "framer-motion";
import { ChevronUpIcon, InboxIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import z from "zod";

const fmt_date = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toFixed(0).padStart(2, "0")}-${date.getDate().toFixed(0).padStart(2, "0")}`;

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

const columnHelper = createColumnHelper<z.infer<typeof recebimento_schema>>();
const columns = [
  columnHelper.accessor("notafiscal", { header: "Nota Fiscal" }),
  columnHelper.accessor("dataRecebimento", {
    cell: (info) => (
      <DatePicker
        aria-label="Horario do recebimento"
        className="w-64"
        value={fromDate(info.getValue(), "America/Sao_Paulo")}
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
                {(segment) => <DateField.Segment segment={segment} />}
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
              <div className="flex items-center justify-between">
                <Label>Horario do recebimento</Label>
                <TimeField
                  aria-label="Horario do recebimento"
                  granularity="minute"
                  hourCycle={24}
                  name="time"
                  value={state.timeValue}
                  onChange={(v) => state.setTimeValue(v as TimeValue)}
                  shouldForceLeadingZeros
                  hideTimeZone
                  isReadOnly
                >
                  <TimeField.Group variant="secondary">
                    <TimeField.Input>
                      {(segment) => <TimeField.Segment segment={segment} />}
                    </TimeField.Input>
                  </TimeField.Group>
                </TimeField>
              </div>
            </DatePicker.Popover>
          </>
        )}
      </DatePicker>
    ),
    header: "Data de Recebimento",
  }),
  columnHelper.accessor("produto", { header: "Produto" }),
  columnHelper.accessor("pendenteArmazenar", {
    header: "Armazenagem pendente",
  }),
  columnHelper.accessor(
    (row) => [row.quantidadeArmazenada, row.quantidadeRecebido],
    {
      cell: (info) => (
        <ProgressBar
          aria-label="Progresso"
          className="w-full"
          maxValue={info.getValue()[1]}
          minValue={0}
          value={info.getValue()[0]}
        >
          <Label>
            Progresso ({info.getValue()[0]} / {info.getValue()[1]})
          </Label>
          <ProgressBar.Output />
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      ),
      header: "Status",
    },
  ),
];

function toSortDescriptor(sorting: SortingState): SortDescriptor | undefined {
  const first = sorting[0];
  if (!first) return undefined;
  return {
    column: first.id,
    direction: first.desc ? "descending" : "ascending",
  };
}
// Convert React Aria SortDescriptor → TanStack SortingState
function toSortingState(descriptor: SortDescriptor): SortingState {
  return [
    {
      desc: descriptor.direction === "descending",
      id: descriptor.column as string,
    },
  ];
}

function SortableColumnHeader({
  children,
  sortDirection,
}: {
  children: React.ReactNode;
  sortDirection?: "ascending" | "descending";
}) {
  return (
    <span className="flex items-center justify-between">
      {children}
      {!!sortDirection && (
        <ChevronUpIcon
          className={cn(
            "size-3 transform transition-transform duration-100 ease-out",
            sortDirection === "descending" ? "rotate-180" : "",
          )}
        />
      )}
    </span>
  );
}

const PAGE_SIZE = 13;

export default function Page() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const [timeRange, setTimeRange] = useState<z.infer<typeof timeRangeEnum>>(
    timeRangeEnum.enum.Day,
  );

  const { data, isLoading, isFetching } = useQuery(
    {
      queryKey: [QUERY_KEY],
      queryFn: async () =>
        fetch("https://api.pdahub.com.br/api/Relatorio/RecebimentoAnalitico", {
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
        })
          .then((r) => r.json())
          .then(z.array(recebimento_schema).parseAsync)
          .then((r) =>
            r
              .filter((op) => op.pendenteArmazenar > 0)
              .map((nf) => ({ ...nf, id: Object.values(nf).sort().join("-") })),
          ),
      initialData: [],
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    queryClient,
  );

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [timeRange]);

  const [sorting, setSorting] = useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    onSortingChange: setSorting,
    state: { sorting },
  });

  const sortDescriptor = useMemo(() => toSortDescriptor(sorting), [sorting]);
  const { pageIndex } = table.getState().pagination;
  const pageCount = useMemo(() => table.getPageCount(), [table]);
  const pages = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <Pagination.Item key={p}>
          <Pagination.Link
            isActive={p === pageIndex + 1}
            onPress={() => table.setPageIndex(p - 1)}
            className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
          >
            {p}
          </Pagination.Link>
        </Pagination.Item>
      )),
    [pageCount, pageIndex, table],
  );
  const start = pageIndex * PAGE_SIZE + 1;
  const end = useMemo(
    () => Math.min((pageIndex + 1) * PAGE_SIZE, data.length),
    [pageIndex, data.length],
  );

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
      </div>
      <div className="container text-center mx-auto">
        <Table>
          <Table.ScrollContainer className="h-[75vh]">
            <Table.Content
              aria-label="Virtualized table with 1000 rows"
              className="h-full min-w-175 overflow-auto"
              sortDescriptor={sortDescriptor}
              onSortChange={(d) => setSorting(toSortingState(d))}
            >
              <Table.Header className="h-fit w-full">
                {table.getHeaderGroups()[0]!.headers.map((header) => (
                  <Table.Column
                    key={header.id}
                    className="h-fit"
                    allowsSorting={header.column.getCanSort()}
                    id={header.id}
                    isRowHeader
                  >
                    {({ sortDirection }) => (
                      <SortableColumnHeader sortDirection={sortDirection}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </SortableColumnHeader>
                    )}
                  </Table.Column>
                ))}
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
                {table.getRowModel().rows.map((row) => (
                  <Table.Row key={row.id} id={row.id} className="*:h-10 h-10">
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          <Table.Footer>
            <ProgressBar
              aria-label="Atualizando dados"
              className="w-32"
              value={0}
              isIndeterminate={isFetching || isLoading}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <Pagination size="sm">
              <Pagination.Summary>
                {start} to {end} of {data.length} results
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={!table.getCanPreviousPage()}
                    onPress={() => table.previousPage()}
                  >
                    <Pagination.PreviousIcon />
                    Prev
                  </Pagination.Previous>
                </Pagination.Item>
                {pages}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={!table.getCanNextPage()}
                    onPress={() => table.nextPage()}
                  >
                    Next
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        </Table>
      </div>
    </main>
  );
}
