"use client";

import { Chip, Pagination, type SortDescriptor, Table } from "@heroui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownUpIcon, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import type z from "zod";
import { cn } from "@/lib/utils";
import type { per_user_schema } from "./page";

export function duration(minutes_raw: number) {
  const minutes = minutes_raw % 60;
  const hours = (minutes_raw - minutes) / 60;

  // console.log({ minutes_raw, minutes, hours });

  return duration_locale.format({
    hours,
    minutes,
  });
}

const columnHelper = createColumnHelper<
  z.infer<typeof per_user_schema>[string] & { name: string }
>();
const columns = [
  columnHelper.accessor("name", { header: "Nome", sortingFn: "text" }),
  columnHelper.accessor("total_embalagens", {
    header: "Total Embalagens",
    sortingFn: "basic",
    cell: (info) => info.getValue().toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
  }),
  columnHelper.accessor("pedidos_por_hora", {
    header: "Pedidos/Hora",
    sortingFn: "basic",
    cell: (info) => info.getValue().toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
  }),
  columnHelper.accessor("caixas_por_hora", {
    header: "Caixas/Hora",
    sortingFn: "basic",
    cell: (info) => info.getValue().toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
  }),
  columnHelper.accessor(({ embalagens_por_hora, meta }) => ({ embalagens_por_hora, meta }), {
    header: "Embalagens/Hora",
    sortingFn: "basic",
    cell: (info) => {
      const meta_percentage = ((info.getValue().embalagens_por_hora / info.getValue().meta) * 100) >> 0;
      return (
        <span className="w-full flex flex-row justify-between">
          {info
            .getValue()
            .embalagens_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          <Chip
            variant="soft"
            color={meta_percentage >= 100 ? "success" : meta_percentage >= 80 ? "warning" : "danger"}
          >
            {meta_percentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
          </Chip>
        </span>
      );
    },
  }),
  columnHelper.accessor("hora_inicio", {
    header: "Hora Inicio",
    sortingFn: "datetime",
    cell: (info) =>
      info.getValue().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
  }),
  columnHelper.accessor("hora_fim", {
    header: "Hora Fim",
    sortingFn: "datetime",
    cell: (info) =>
      info.getValue().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
  }),
  columnHelper.accessor("duração", {
    header: "Duração",
    sortingFn: "basic",
    cell: (info) => duration(info.getValue()),
    footer: "Teste",
  }),
];

const duration_locale = new Intl.DurationFormat("pt-BR", {
  style: "long",
});

function toSortDescriptor(sorting: SortingState): SortDescriptor | undefined {
  const first = sorting[0];
  if (!first) return undefined;
  return {
    column: first.id,
    direction: first.desc ? "descending" : "ascending",
  };
}

function toSortingState(descriptor: SortDescriptor): SortingState {
  return [{ desc: descriptor.direction === "descending", id: descriptor.column as string }];
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
      {sortDirection == null ? (
        <Chip size="sm" variant="secondary">
          <ArrowDownUpIcon className="stroke-neutral-400 size-3" />
        </Chip>
      ) : (
        <Chip size="sm" variant="primary" color="accent">
          <ChevronUp
            className={cn(
              "size-3 transform transition-transform duration-100 ease-out",
              sortDirection === "descending" ? "rotate-180" : "",
            )}
          />
        </Chip>
      )}
    </span>
  );
}

const PAGE_SIZE = 14;
export function UsersTable({ data }: { data: z.infer<typeof per_user_schema> }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const users = useMemo(
    () => Object.entries(data).map(([name, data]) => ({ ...data, name })),
    [data],
  );

  const table = useReactTable({
    columns,
    data: users,
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
    () => Math.min((pageIndex + 1) * PAGE_SIZE, users.length),
    [pageIndex, users.length],
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

  console.log(table.getRowModel().rows);

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Team members"
            className="min-w-150"
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
            <Table.Body items={table.getRowModel().rows}>
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
          <Table.Footer className="grid grid-flow-col grid-cols-8">
            {table.getFooterGroups()[0]?.headers.map((header) => (
              <div key={header.id} style={{ width: header.column.getSize() }}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))}
          </Table.Footer>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
