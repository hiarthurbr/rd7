"use client";

import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  Select,
  Tabs,
  Tooltip as UITooltip,
} from "@heroui/react";
import { TriangleAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import type z from "zod";
import { duration } from "@/lib/utils";
import { NAME_KEYS, type per_user_schema } from "./page";

export function UserDashboard({ data }: { data: z.infer<typeof per_user_schema> }) {
  const [graphKey, setGraphKey] = useState("total_embalagens");
  const userNames = useMemo(() => Object.keys(data), [data]);
  const [selectedUser, setSelectedUser] = useState(userNames[0]);
  const userData = data[selectedUser];

  const meta_percentage = ((userData.embalagens_por_hora / userData.meta) * 100) >> 0;

  const hourlyData = Object.entries(userData.por_hora)
    .filter(
      ([hour]) =>
        Number(hour) >= userData.hora_inicio.getHours() &&
        Number(hour) <= userData.hora_fim.getHours(),
    )
    .map(([hour, data]) => ({
      hour: `${hour}h`,
      [NAME_KEYS.total_embalagens]: data.total_embalagens,
      [NAME_KEYS.caixas]: data.caixas.size,
      [NAME_KEYS.pedidos_conferidos]: data.pedidos_conferidos.size,
    }));

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
                      Esse usuário conferiu por menos de 1 hora; Como resultado disso, essa média é
                      uma previsão, baseada nos dados até o momento.
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

      <div className="flex flex-row space-x-4">
        <Card className="w-full">
          <Card.Header>
            <Card.Title>{NAME_KEYS[graphKey as keyof typeof NAME_KEYS]}</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="h-80">
              <AreaChart
                style={{ width: "100%", maxWidth: "2000px", maxHeight: "30vh", aspectRatio: 2 }}
                responsive
                data={hourlyData}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="color04e762" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#04e762" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#04e762" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorf5b700" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5b700" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f5b700" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="color00a1e4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a1e4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00a1e4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis width="auto" />
                <ChartTooltip />
                {
                  {
                    [NAME_KEYS.caixas]: (
                      <Area
                        type="monotone"
                        dataKey={NAME_KEYS.caixas}
                        stroke="#04e762"
                        fillOpacity={1}
                        fill="url(#color04e762)"
                        isAnimationActive
                      />
                    ),
                    [NAME_KEYS.pedidos_conferidos]: (
                      <Area
                        type="monotone"
                        dataKey={NAME_KEYS.pedidos_conferidos}
                        stroke="#f5b700"
                        fillOpacity={1}
                        fill="url(#colorf5b700)"
                        isAnimationActive
                      />
                    ),
                    [NAME_KEYS.total_embalagens]: (
                      <Area
                        type="monotone"
                        dataKey={NAME_KEYS.total_embalagens}
                        stroke="#00a1e4"
                        fillOpacity={1}
                        fill="url(#color00a1e4)"
                        isAnimationActive
                      />
                    ),
                  }[NAME_KEYS[graphKey as keyof typeof NAME_KEYS]]
                }
              </AreaChart>
            </div>
          </Card.Content>
        </Card>
        <Tabs
          className="w-56"
          orientation="vertical"
          variant="secondary"
          onSelectionChange={(key) => setGraphKey(key as string)}
          selectedKey={graphKey}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Vertical tabs" className="space-y-6">
              {Object.entries(NAME_KEYS).map(([key, value]) => (
                <Tabs.Tab key={key} id={key} className="py-4">
                  {value}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
    </div>
  );
}
