"use client";

import { Card, Chip, ListBox, Select } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type z from "zod";
import type { per_user_schema } from "./page";
import { duration } from "./users-table";

const EmbalagemPorHora = ({ user }: { user: z.infer<typeof per_user_schema>[string] }) => {
  const meta_percentage = ((user.embalagens_por_hora / user.meta) * 100) >> 0;
  return (
    <span className="w-full flex flex-row space-x-2 items-center justify-end">
      <Chip
        variant="soft"
        color={meta_percentage >= 100 ? "success" : meta_percentage >= 80 ? "warning" : "danger"}
      >
        {meta_percentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
      </Chip>
      <span>{user.embalagens_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
    </span>
  );
};

export function UserComparison({ data }: { data: z.infer<typeof per_user_schema> }) {
  const userNames = useMemo(() => Object.keys(data), [data]);
  const [user1, setUser1] = useState(userNames[0]);
  const [user2, setUser2] = useState(userNames[1]);

  const userData1 = data[user1];
  const userData2 = data[user2];

  // biome-ignore lint/correctness/useExhaustiveDependencies: só precisamos das informações das horas, não importa qual usuário está selecionado
  const hours = useMemo(() => Object.keys(data[user1].por_hora), [data]);
  const hourlyComparisonData = hours.map((hour) => ({
    hour: `${hour}h`,
    [user1]: userData1.por_hora[hour]?.total_embalagens || 0,
    [user2]: userData2.por_hora[hour]?.total_embalagens || 0,
  }));

  // Normalize data for radar chart (0-100 scale)
  const maxEmbalagens = Math.max(userData1.total_embalagens, userData2.total_embalagens);
  const maxEmbalagensHora = Math.max(userData1.embalagens_por_hora, userData2.embalagens_por_hora);
  const maxCaixasHora = Math.max(userData1.caixas_por_hora, userData2.caixas_por_hora);
  const maxPedidosHora = Math.max(userData1.pedidos_por_hora, userData2.pedidos_por_hora);

  const radarData = [
    {
      metric: "Total Embalagens",
      [user1]: (userData1.total_embalagens / maxEmbalagens) * 100,
      [user2]: (userData2.total_embalagens / maxEmbalagens) * 100,
    },
    {
      metric: "Embalagens/Hora",
      [user1]: (userData1.embalagens_por_hora / maxEmbalagensHora) * 100,
      [user2]: (userData2.embalagens_por_hora / maxEmbalagensHora) * 100,
    },
    {
      metric: "Caixas/Hora",
      [user1]: (userData1.caixas_por_hora / maxCaixasHora) * 100,
      [user2]: (userData2.caixas_por_hora / maxCaixasHora) * 100,
    },
    {
      metric: "Pedidos/Hora",
      [user1]: (userData1.pedidos_por_hora / maxPedidosHora) * 100,
      [user2]: (userData2.pedidos_por_hora / maxPedidosHora) * 100,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-center">
        <div className="flex items-center gap-2">
          <Select
            className="w-[256px]"
            placeholder="Select a state"
            value={user1}
            onChange={(value) => setUser1(value as string)}
          >
            <Label>Usuário 1</Label>
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
        <div className="flex items-center gap-2">
          <Select
            className="w-[256px]"
            placeholder="Select a state"
            value={user2}
            onChange={(value) => setUser2(value as string)}
          >
            <Label>Usuário 2</Label>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-teal-500 max-w-72 min-w-max w-full place-self-end">
          <Card.Header className="pb-2">
            <Card.Title className="text-lg">{user1}</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Embalagens:</span>
              <span className="font-medium">
                {userData1.total_embalagens.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Embalagens/Hora:</span>
              <EmbalagemPorHora user={userData1} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Caixas/Hora:</span>
              <span className="font-medium">{userData1.caixas_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedidos/Hora:</span>
              <span className="font-medium">{userData1.pedidos_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duracao:</span>
              <span className="font-medium">{duration(userData1.duração)}</span>
            </div>
          </Card.Content>
        </Card>

        <Card className="border-l-4 border-l-amber-500 max-w-72 min-w-max w-full place-self-start">
          <Card.Header className="pb-2">
            <Card.Title className="text-lg">{user2}</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Embalagens:</span>
              <span className="font-medium">
                {userData2.total_embalagens.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Embalagens/Hora:</span>
              <EmbalagemPorHora user={userData2} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Caixas/Hora:</span>
              <span className="font-medium">{userData2.caixas_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedidos/Hora:</span>
              <span className="font-medium">{userData2.pedidos_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duracao:</span>
              <span className="font-medium">{duration(userData2.duração)}</span>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Comparacao por Hora</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyComparisonData}>
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
                  <Legend />
                  <Bar dataKey={user1} fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={user2} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Comparacao de Metricas</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name={user1}
                    dataKey={user1}
                    stroke="#0d9488"
                    fill="#0d9488"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name={user2}
                    dataKey={user2}
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
