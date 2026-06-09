"use client";

import { Card, Label, ListBox, Select } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type z from "zod";
import type { per_user_schema } from "./page";
import { duration } from "./users-table";

const COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"];

export function UserDashboard({ data }: { data: z.infer<typeof per_user_schema> }) {
  const userNames = useMemo(() => Object.keys(data), [data]);
  const [selectedUser, setSelectedUser] = useState(userNames[0]);
  const userData = data[selectedUser];

  const hourlyData = Object.entries(userData.por_hora)
    .map(([hour, data]) => ({
      hour: `${hour}h`,
      embalagens: data.total_embalagens,
    }))
    .filter((item) => item.embalagens > 0);

  const metricsData = [
    { name: "Pedidos/Hora", value: userData.pedidos_por_hora },
    { name: "Caixas/Hora", value: userData.caixas_por_hora },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        <Select
          className="w-[256px]"
          placeholder="Selecionar Usuario:"
          value={selectedUser}
          onChange={(value) => setSelectedUser(value as string)}
        >
          <Label>Usuário</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {userNames.map((name) => (
                <ListBox.Item key={name} id={name} textValue={name}>
                  {name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <Card.Header className="pb-2">
            <Card.Title className="text-sm font-medium text-muted-foreground">
              Total Embalagens
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-2xl font-bold text-teal-600">
              {userData.total_embalagens.toLocaleString("pt-BR")}
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header className="pb-2">
            <Card.Title className="text-sm font-medium text-muted-foreground">
              Embalagens/Hora
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-2xl font-bold text-teal-600">
              {userData.embalagens_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header className="pb-2">
            <Card.Title className="text-sm font-medium text-muted-foreground">Duração</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-2xl font-bold text-teal-600">{duration(userData.duração)}</div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Embalagens por Hora</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="embalagens" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Metricas de Produtividade</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metricsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metricsData.map((_, index) => (
                      <Cell
                        key={`cell-${
                          // biome-ignore lint/suspicious/noArrayIndexKey: usar o index não é um problema, já que é a única informação que temos
                          index
                        }`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
