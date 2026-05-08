"use client";

import { AlertCircle, ArrowUpRightFromSquareIcon, CheckCircle2 } from "lucide-react";
import { Badge, Button, Card, Chip, Disclosure } from "@heroui/react";
import type { ComparisonResult } from "@/lib/types";
import { useState } from "react";

type ResultsListProps = {
  results: ComparisonResult;
};

function ProductDiffItem({
  name,
  values,
  raw
}: {
  name: string;
  values: [[number, number], [number, number]];
  raw: any
}) {
  const [expected, received] = values;
  const [qntdExpected, pesoExpected] = expected;
  const [qntdReceived, pesoReceived] = received;

  const qntdDiff = qntdReceived - qntdExpected;
  const pesoDiff = pesoReceived - pesoExpected;

  return (
    <div
      className={`rounded-lg border ${Math.abs(pesoDiff) < 0.001 ? "border-warning/30 bg-warning/5" : "border-danger/30 bg-danger/5"} p-4`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle
            className={`size-5 ${Math.abs(pesoDiff) < 0.001 ? "text-warning" : "text-danger"} shrink-0`}
          />
          <h4 className="font-medium text-balance">{name}</h4>
        </div>
        <Button
          size="sm"
          variant="ghost"
        >
          Abrir NF
          <ArrowUpRightFromSquareIcon />
        </Button>
        <Chip
          color={Math.abs(pesoDiff) < 0.001 ? "warning" : "danger"}
          className="shrink-0 px-1"
        >
          Divergente
        </Chip>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Planilha
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded bg-muted/25 px-2 py-1">
              <span className="text-muted-foreground">Qntd: </span>
              <span className="font-medium">{qntdExpected}</span>
            </div>
            <div className="rounded bg-muted/25 px-2 py-1">
              <span className="text-muted-foreground">Peso: </span>
              <span className="font-medium">{pesoExpected.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            NFe
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded bg-muted/25 px-2 py-1">
              <span className="text-muted-foreground">Qntd: </span>
              <span className="font-medium">{qntdReceived}</span>
              {qntdDiff !== 0 && (
                <span
                  className={
                    qntdDiff > 0 ? "text-green-600 ml-1" : "text-danger ml-1"
                  }
                >
                  ({qntdDiff > 0 ? "+" : ""}
                  {qntdDiff})
                </span>
              )}
            </div>
            <div className="rounded bg-muted/25 px-2 py-1">
              <span className="text-muted-foreground">Peso: </span>
              <span className="font-medium">{pesoReceived.toFixed(4)}</span>
              {pesoDiff !== 0 && (
                <span
                  className={
                    pesoDiff > 0 ? "text-green-600 ml-1" : "text-danger ml-1"
                  }
                >
                  ({pesoDiff > 0 ? "+" : ""}
                  {pesoDiff.toFixed(4)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductSameItem({
  name,
  values,
}: {
  name: string;
  values: [number, number, number][];
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 text-accent shrink-0" />
          <h4 className="font-medium text-balance">{name}</h4>
        </div>
        <Badge.Anchor className="mx-2">
          <Badge color="accent" className="shrink-0 px-1">
            Repetido
          </Badge>
        </Badge.Anchor>
      </div>

      {values.map((value) => (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded bg-muted/25 px-2 py-1">
                <span className="text-muted-foreground">nItem: </span>
                <span className="font-medium">{value[0]}</span>
              </div>
              <div className="rounded bg-muted/25 px-2 py-1">
                <span className="text-muted-foreground">Qntd: </span>
                <span className="font-medium">{value[1]}</span>
              </div>
              <div className="rounded bg-muted/25 px-2 py-1">
                <span className="text-muted-foreground">Peso: </span>
                <span className="font-medium">{value[2]}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductEqItem({
  name,
  values,
}: {
  name: string;
  values: [[number, number], [number, number]];
}) {
  const [expected] = values;
  const [qntd, peso] = expected;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Qntd: {qntd}</span>
        <span>Peso: {peso.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function ResultsList({ results }: ResultsListProps) {
  const same_sku = Object.values(results.same_sku).filter(
    (v) => v?.length > 1,
  ).length;
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(same_sku === 0);
  const [isSameOpen, setIsSameOpen] = useState(same_sku > 0);

  const diffEntries = Object.entries(results.diff);
  const eqEntries = Object.entries(results.eq);

  const totalItems = diffEntries.length + eqEntries.length;

  console.log({ results });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <Card.Content className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total de Itens</p>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-danger">
                {diffEntries.length}
              </p>
              <p className="text-sm text-muted-foreground">Divergentes</p>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {eqEntries.length}
              </p>
              <p className="text-sm text-muted-foreground">Iguais</p>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{same_sku}</p>
              <p className="text-sm text-muted-foreground">
                Itens repetidos na NFe
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Produtos repetidos */}
      {same_sku > 0 && (
        <Card>
          <Disclosure isExpanded={isSameOpen} onExpandedChange={setIsSameOpen}>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-accent" />
                    Produtos repetidos na NFe
                  </Card.Title>
                  <Card.Description>
                    Nota apresenta {same_sku} itens repetidos
                  </Card.Description>
                </div>
                <Disclosure.Heading>
                  <Button slot="trigger" variant="ghost" size="sm">
                    <Disclosure.Indicator />
                    {isSameOpen ? "Recolher" : "Expandir"}
                  </Button>
                </Disclosure.Heading>
              </div>
            </Card.Header>
            <Disclosure.Content>
              <Card.Content className="space-y-3">
                {Object.entries(results.same_sku)
                  .filter((v) => v[1] != null && v[1].length > 1)
                  ?.map(([name, values]) => (
                    <ProductSameItem
                      key={`${name}/${values.toString()}`}
                      name={name}
                      values={values}
                    />
                  ))}
              </Card.Content>
            </Disclosure.Content>
          </Disclosure>
        </Card>
      )}

      {/* Divergences */}
      {diffEntries.length > 0 && (
        <Card>
          <Disclosure isExpanded={isDiffOpen} onExpandedChange={setIsDiffOpen}>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-danger" />
                    Itens Divergentes
                  </Card.Title>
                  <Card.Description>
                    {diffEntries.length}{" "}
                    {diffEntries.length === 1
                      ? "item apresenta"
                      : "itens apresentam"}{" "}
                    diferença entre os arquivos
                  </Card.Description>
                </div>
                <Disclosure.Heading>
                  <Button slot="trigger" variant="ghost" size="sm">
                    <Disclosure.Indicator />
                    {isSameOpen ? "Recolher" : "Expandir"}
                  </Button>
                </Disclosure.Heading>
              </div>
            </Card.Header>
            <Disclosure.Content>
              <Card.Content className="space-y-3">
                {diffEntries.map(([name, values]) => (
                  <ProductDiffItem
                    key={`${name}/${values.toString()}`}
                    name={name}
                    values={values}
                    raw={results.raw}
                  />
                ))}
              </Card.Content>
            </Disclosure.Content>
          </Disclosure>
        </Card>
      )}

      {/* Equal items (Disclosure) */}
      {eqEntries.length > 0 && (
        <Card>
          <Disclosure isExpanded={isEqOpen} onExpandedChange={setIsEqOpen}>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-600" />
                    Itens iguais
                  </Card.Title>
                  <Card.Description>
                    {eqEntries.length}{" "}
                    {eqEntries.length === 1 ? "item está" : "itens estão"} em
                    conformidade
                  </Card.Description>
                </div>
                <Disclosure.Heading>
                  <Button slot="trigger" variant="ghost" size="sm">
                    <Disclosure.Indicator />
                    {isEqOpen ? "Recolher" : "Expandir"}
                  </Button>
                </Disclosure.Heading>
              </div>
            </Card.Header>
            <Disclosure.Content>
              <Card.Content className="space-y-2">
                {eqEntries.map(([name, values]) => (
                  <ProductEqItem
                    key={`${name}/${values.toString()}`}
                    name={name}
                    values={values}
                  />
                ))}
              </Card.Content>
            </Disclosure.Content>
          </Disclosure>
        </Card>
      )}
    </div>
  );
}
