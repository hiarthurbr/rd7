"use client";
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  EmptyState,
  Label,
  Modal,
  Pagination,
  ProgressBar,
  Spinner,
  Table,
  Tabs,
  TimeField,
  type TimeValue,
} from "@heroui/react";
import { fromDate } from "@internationalized/date";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { InboxIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import z from "zod";
import { getToken } from "@/lib/pda";
import { recebimento_schema } from "@/lib/schemas";
import { fmt_date, SortableColumnHeader, toSortDescriptor, toSortingState } from "@/lib/utils";

const timeRangeEnum = z.enum({
  Day: 1,
  Week: 7,
  Month: 30,
});

const QUERY_KEY = "armazenagens_pendentes";

const log_armazenagens_schema = z.object({
  codigoEndereco: z.number(),
  endereco: z.string(),
  tipoEndereco: z.string(),
  quantidadePalete: z.number(),
  quantidadeCaixa: z.number(),
  quantidade: z.number(),
  lote: z.string(),
  codigoCliente: z.literal(30),
});

const columnHelperProducts = createColumnHelper<z.infer<typeof log_armazenagens_schema>>();

const columnsProducts = [
  columnHelperProducts.accessor("endereco", { header: "Endereço", sortingFn: "alphanumeric" }),
  columnHelperProducts.accessor("tipoEndereco", {
    header: "Tipo",
    sortingFn: "alphanumeric",
  }),
  columnHelperProducts.accessor("quantidade", {
    cell: (info) => info.getValue()?.toLocaleString("pt-BR") ?? "N/D",
    header: "Quantidade",
    sortDescFirst: true,
    sortingFn: "basic",
  }),
];

async function get_log_armazenagem(date: Date, produto: string) {
  return fetch("https://api.pdahub.com.br/api/Armazenagem/LogArmazenagem", {
    headers: {
      accept: "application/json, text/plain, */*",
      authorization: await getToken(),
      "cache-control": "no-cache",
      "content-type": "application/json",
      pragma: "no-cache",
      priority: "u=1, i",
    },
    referrer: "https://wms.pdahub.com.br/",
    body: JSON.stringify({
      CodigoCliente: 30,
      user: 1297,
      palete: null,
      caixa: null,
      produto,
      endereco: null,
      CodigoTipoEndereco: null,
      CodigoCodigoNivel1: null,
      CodigoCodigoNivel2: null,
      CodigoCodigoNivel3: null,
      CodigoCodigoNivel4: null,
      CodigoCodigoNivel5: null,
      dataInicio: fmt_date(date),
      dataFim: fmt_date(date),
    }),
    method: "PATCH",
  })
    .then((r) => r.json())
    .then(log_armazenagens_schema.array().parseAsync);
}

function LogArmazenagem({
  data_armazenagem,
  produto,
}: {
  data_armazenagem: Date;
  produto: string;
}) {
  const { data, isFetching } = useQuery({
    queryKey: ["LOG_ARMAZENAGEM", produto, data_armazenagem],
    queryFn: () => get_log_armazenagem(data_armazenagem, produto),
    staleTime: 5 * 60 * 1000
  });

  const PAGE_SIZE = useMemo(() => 15, []);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns: columnsProducts,
    data: data ?? [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    onSortingChange: setSorting,
    state: { sorting },
  });

  const sortDescriptor = useMemo(() => toSortDescriptor(sorting), [sorting]);
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const start = pageIndex * PAGE_SIZE + 1;
  const end = useMemo(
    () => Math.min((pageIndex + 1) * PAGE_SIZE, data?.length ?? 0),
    [pageIndex, data?.length, PAGE_SIZE],
  );
  const pageNumbers = useMemo(() => {
    const neighbors = 1; // Number of pages to show on each side of current page
    const items: (number | "ellipsis")[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const isFirstPage = i === 1;
      const isLastPage = i === pageCount;
      const isWithinRange = i >= pageIndex - neighbors && i <= pageIndex + neighbors;

      if (isFirstPage || isLastPage || isWithinRange) {
        items.push(i);
      } else if (
        (i === pageIndex - neighbors - 1 || i === pageIndex + neighbors + 1) &&
        items[items.length - 1] !== "ellipsis"
      ) {
        items.push("ellipsis");
      }
    }

    return items;
  }, [pageCount, pageIndex]);
  const pages = useMemo(
    () =>
      pageNumbers.map((p, i) =>
        p === "ellipsis" ? (
          <Pagination.Item
            key={`ellipsis-${
              // biome-ignore lint/suspicious/noArrayIndexKey: usar o index aqui não é um problema, já que a unica informação aparente é justamente o index
              i
            }`}
          >
            <Pagination.Ellipsis />
          </Pagination.Item>
        ) : (
          <Pagination.Item key={p}>
            <Pagination.Link
              isActive={p === pageIndex + 1}
              onPress={() => table.setPageIndex(p - 1)}
              className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
            >
              {p}
            </Pagination.Link>
          </Pagination.Item>
        ),
      ),
    [pageIndex, table, pageNumbers],
  );

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Team members"
          className="min-w-fit"
          sortDescriptor={sortDescriptor}
          onSortChange={(d) => setSorting(toSortingState(d))}
        >
          <Table.Header>
            {table.getHeaderGroups()[0]?.headers.map((header) => (
              <Table.Column
                key={header.id}
                allowsSorting={header.column.getCanSort()}
                id={header.id}
                isRowHeader
              >
                {({ sortDirection }) => (
                  <SortableColumnHeader sortDirection={sortDirection}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </SortableColumnHeader>
                )}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            items={table.getRowModel().rows}
            renderEmptyState={() => (
              <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                <InboxIcon className="size-6 stroke-muted" />
                <span className="text-sm text-muted">Nenhum resultado encontrado</span>
              </EmptyState>
            )}
          >
            {(row) => (
              <Table.Row key={row.id} id={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <Table.Footer className="flex items-center justify-between px-4 space-x-8">
        <ProgressBar
          aria-label="Atualizando dados"
          className="w-32"
          value={0}
          isIndeterminate={isFetching}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <Pagination size="sm">
          <Pagination.Summary>
            {start} to {end} of {data?.length ?? 0} results
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
  );
}

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
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
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
    sortingFn: "datetime",
  }),
  columnHelper.accessor("produto", { header: "Produto" }),
  columnHelper.accessor("pendenteArmazenar", {
    header: "Armazenagem pendente",
    cell: (info) => {
      return (
        <Modal>
          <div className="flex flex-row items-center space-x-2">
            <span>{info.getValue().toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
            {info.row.original.dataArmazenagem != null && (
              <Button variant="secondary" size="sm" className="scale-80" isIconOnly>
                <SearchIcon />
              </Button>
            )}
          </div>
          <Modal.Backdrop>
            <Modal.Container placement="center" size="lg">
              <Modal.Dialog className="max-w-2xl">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Armazenagens do produto {info.row.original.produto}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <LogArmazenagem
                    // biome-ignore lint/style/noNonNullAssertion: a variavel só será acessada se não for nula
                    data_armazenagem={info.row.original.dataArmazenagem!}
                    produto={info.row.original.produto}
                  />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      );
    },
    sortingFn: "basic",
  }),
  columnHelper.accessor((row) => [row.quantidadeArmazenada, row.quantidadeRecebido] as const, {
    cell: (info) => (
      <ProgressBar
        aria-label="Progresso"
        className="w-full"
        maxValue={info.getValue()[1]}
        minValue={0}
        lang="pt-BR"
        formatOptions={{
          maximumFractionDigits: 2,
          roundingMode: "floor",
          style: "percent",
        }}
        color={
          info.getValue()[0] / info.getValue()[1] > 0.85 || info.getValue()[0] < 20
            ? "danger"
            : "warning"
        }
        value={info.getValue()[0]}
      >
        <Label>
          Progresso ({info.getValue()[0].toLocaleString("pt-BR")} /{" "}
          {info.getValue()[1].toLocaleString("pt-BR")})
        </Label>
        <ProgressBar.Output />
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    ),
    header: "Status",
    sortingFn: (a, b, id) =>
      (a.getValue(id) as [number, number])[0] / (a.getValue(id) as [number, number])[1] -
      (b.getValue(id) as [number, number])[0] / (b.getValue(id) as [number, number])[1],
  }),
];

const PAGE_SIZE = 13;

export default function Page() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const [timeRange, setTimeRange] = useState<z.infer<typeof timeRangeEnum>>(timeRangeEnum.enum.Day);

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
            dataInicio: fmt_date(new Date(Date.now() - 1000 * 60 * 60 * 24 * timeRange)),
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

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Atualizar query quando mudarmos o `timeRange`
  useEffect(() => {
    refresh();
  }, [timeRange, refresh]);

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
  const pageCount = table.getPageCount();
  const start = pageIndex * PAGE_SIZE + 1;
  const end = useMemo(
    () => Math.min((pageIndex + 1) * PAGE_SIZE, data.length),
    [pageIndex, data.length],
  );
  const pageNumbers = useMemo(() => {
    const neighbors = 3; // Number of pages to show on each side of current page
    const items: (number | "ellipsis")[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const isFirstPage = i === 1;
      const isLastPage = i === pageCount;
      const isWithinRange = i >= pageIndex - neighbors && i <= pageIndex + neighbors;

      if (isFirstPage || isLastPage || isWithinRange) {
        items.push(i);
      } else if (
        (i === pageIndex - neighbors - 1 || i === pageIndex + neighbors + 1) &&
        items[items.length - 1] !== "ellipsis"
      ) {
        items.push("ellipsis");
      }
    }

    return items;
  }, [pageCount, pageIndex]);
  const pages = useMemo(
    () =>
      pageNumbers.map((p, i) =>
        p === "ellipsis" ? (
          <Pagination.Item
            key={`ellipsis-${
              // biome-ignore lint/suspicious/noArrayIndexKey: usar o index aqui não é um problema, já que a unica informação aparente é justamente o index
              i
            }`}
          >
            <Pagination.Ellipsis />
          </Pagination.Item>
        ) : (
          <Pagination.Item key={p}>
            <Pagination.Link
              isActive={p === pageIndex + 1}
              onPress={() => table.setPageIndex(p - 1)}
              className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
            >
              {p}
            </Pagination.Link>
          </Pagination.Item>
        ),
      ),
    [pageIndex, table, pageNumbers],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-background">
        <div className="mx-auto container px-4 py-8 grid grid-flow-col grid-cols-3 items-center">
          {/* Header */}
          <Tabs
            className="w-md justify-self-start place-self-start pt-4"
            selectedKey={timeRange === 1 ? "Day" : timeRange === 7 ? "Week" : "Month"}
            onSelectionChange={(key) =>
              setTimeRange(
                timeRangeEnum.parse(
                  timeRangeEnum.enum[key as unknown as keyof typeof timeRangeEnum.enum],
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
          <Button
            isPending={isLoading || isFetching}
            onPress={() => refresh()}
            className="justify-self-end place-self-start mt-4"
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <RefreshCwIcon />}
                {isPending ? "Atualizando..." : "Atualizar"}
              </>
            )}
          </Button>
        </div>
        <div className="container mx-auto">
          <Table>
            <Table.ScrollContainer className="h-[75vh]">
              <Table.Content
                aria-label="Virtualized table with 1000 rows"
                className="h-full min-w-175 overflow-auto"
                sortDescriptor={sortDescriptor}
                onSortChange={(d) => setSorting(toSortingState(d))}
              >
                <Table.Header className="h-fit w-full">
                  {table.getHeaderGroups()[0]?.headers.map((header) => (
                    <Table.Column
                      key={header.id}
                      className="h-fit"
                      allowsSorting={header.column.getCanSort()}
                      id={header.id}
                      isRowHeader
                    >
                      {({ sortDirection }) => (
                        <SortableColumnHeader sortDirection={sortDirection}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
                      <span className="text-sm text-muted">Nenhum resultado encontrado</span>
                    </EmptyState>
                  )}
                >
                  {table.getRowModel().rows.map((row) => (
                    <Table.Row key={row.id} id={row.id} className="*:h-10 h-10">
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
            <Table.Footer className="flex items-center justify-between px-4 space-x-8">
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
    </QueryClientProvider>
  );
}
