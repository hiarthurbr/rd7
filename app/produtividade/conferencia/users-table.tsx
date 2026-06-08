"use client";

import { Table } from "@heroui/react";
import type z from "zod";
import type { per_user_schema } from "./page";

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsersTable({ data }: { data: z.infer<typeof per_user_schema> }) {
  const users = Object.entries(data);

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
              {users.map(([name, data]) => (
                <Table.Row key={name}>
                  <Table.Cell className="font-medium">{name}</Table.Cell>
                  <Table.Cell className="text-right">
                    {data.total_embalagens.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {data.pedidos_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {data.caixas_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {data.embalagens_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </Table.Cell>
                  <Table.Cell>{formatTime(data.hora_inicio)}</Table.Cell>
                  <Table.Cell>{formatTime(data.hora_fim)}</Table.Cell>
                  <Table.Cell>{data.duração}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
