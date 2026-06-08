"use client";

import { /* Pagination, type SortDescriptor, */ Table } from "@heroui/react";
// import {
//   createColumnHelper,
//   flexRender,
//   getCoreRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   type SortingState,
//   useReactTable,
// } from "@tanstack/react-table";
import type z from "zod";
import type { per_user_schema } from "./page";

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// type a = z.infer<typeof per_user_schema>[string];

// const columnHelper = createColumnHelper<z.infer<typeof per_user_schema>[string]>();
// const columns = [
//   columnHelper.accessor("", {header: "Name"}),
//   columnHelper.accessor("role", {header: "Role"}),
//   columnHelper.accessor("status", {
//     cell: (info) => (
//       <Chip color={statusColorMap[info.getValue()]} size="sm" variant="soft">
//         {info.getValue()}
//       </Chip>
//     ),
//     header: "Status",
//   }),
//   columnHelper.accessor("email", {header: "Email"}),
// ];

export function UsersTable({ data }: { data: z.infer<typeof per_user_schema> }) {
  const users = Object.entries(data).map(([name, data]) => ({ name, ...data }));

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Team members" className="min-w-150">
            <Table.Header>
              <Table.Column className="font-semibold" isRowHeader>
                Nome
              </Table.Column>
              <Table.Column className="text-right font-semibold" isRowHeader>
                Total Embalagens
              </Table.Column>
              <Table.Column className="text-right font-semibold" isRowHeader>
                Pedidos/Hora
              </Table.Column>
              <Table.Column className="text-right font-semibold" isRowHeader>
                Caixas/Hora
              </Table.Column>
              <Table.Column className="text-right font-semibold" isRowHeader>
                Embalagens/Hora
              </Table.Column>
              <Table.Column className="font-semibold" isRowHeader>
                Hora Inicio
              </Table.Column>
              <Table.Column className="font-semibold" isRowHeader>
                Hora Fim
              </Table.Column>
              <Table.Column className="font-semibold" isRowHeader>
                Duracao
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {users.map(user => (
                <Table.Row key={user.name}>
                  <Table.Cell className="font-medium">{user.name}</Table.Cell>
                  <Table.Cell className="text-right">
                    {user.total_embalagens.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {user.pedidos_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {user.caixas_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {user.embalagens_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell>{formatTime(user.hora_inicio)}</Table.Cell>
                  <Table.Cell>{formatTime(user.hora_fim)}</Table.Cell>
                  <Table.Cell>{user.duração}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
