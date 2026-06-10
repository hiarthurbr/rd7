"use client";

import { Button, Card, Chip, Label, ListBox, Select, Tooltip as UITooltip } from "@heroui/react";
import { TriangleAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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

const COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4"];

export function UserDashboard({ data }: { data: z.infer<typeof per_user_schema> }) {
  const userNames = useMemo(() => Object.keys(data), [data]);
  const [selectedUser, setSelectedUser] = useState(userNames[0]);
  const userData = data[selectedUser];

  const meta_percentage = ((userData.embalagens_por_hora / userData.meta) * 100) >> 0;

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

  console.log(
    Object.values(data)
      .filter((x) => Number.isFinite(x.caixas_por_hora))
      .reduce(
        ([min, max], curr) => [
          Math.min(min, curr.caixas_por_hora),
          Math.max(max, curr.caixas_por_hora),
        ],
        [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
      ),
  );

  const radarData = useMemo(
    () => [
      {
        name: "Caixas/Hora",
        value: userData.caixas_por_hora,
        range: Object.values(data)
          .filter((x) => Number.isFinite(x.caixas_por_hora))
          .reduce(
            ([min, max], curr) => [
              Math.min(min, curr.caixas_por_hora),
              Math.max(max, curr.caixas_por_hora),
            ],
            [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
          ),
      },
      {
        name: "Pedidos/Hora",
        value: userData.pedidos_por_hora,
        range: Object.values(data)
          .filter((x) => Number.isFinite(x.pedidos_por_hora))
          .reduce(
            ([min, max], curr) => [
              Math.min(min, curr.pedidos_por_hora),
              Math.max(max, curr.pedidos_por_hora),
            ],
            [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
          ),
      },
      {
        name: "Embalagens/Hora",
        value: userData.embalagens_por_hora,
        range: Object.values(data)
          .filter((x) => Number.isFinite(x.embalagens_por_hora))
          .reduce(
            ([min, max], curr) => [
              Math.min(min, curr.embalagens_por_hora),
              Math.max(max, curr.embalagens_por_hora),
            ],
            [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
          ),
      },
    ],
    [userData, data],
  );

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
            <div className="text-2xl font-bold text-teal-600 flex flex-row items-center space-x-2">
              <span className="-translate-y-0.5">
                {userData.embalagens_por_hora.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              </span>
              {userData.duração < 60 && (
                <UITooltip delay={0}>
                  <Button isIconOnly variant="tertiary" size="sm" className="scale-80">
                    <TriangleAlertIcon />
                  </Button>
                  <UITooltip.Content>
                    <p className="break-normal">
                      Esse usuário está conferindo a menos de 1 hora; Como resultado disso, essa
                      média é uma previsão, baseada nos dados até o momento.
                    </p>
                  </UITooltip.Content>
                </UITooltip>
              )}
              <Chip
                size="lg"
                variant="soft"
                color={
                  meta_percentage >= 100 ? "success" : meta_percentage >= 80 ? "warning" : "danger"
                }
              >
                {meta_percentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% da meta
              </Chip>
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
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name={selectedUser}
                    dataKey="value"
                    stroke="#0d9488"
                    fill="#0d9488"
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
