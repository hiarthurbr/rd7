"use client";

import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import type { ComparisonResult } from "@/lib/types";
import { useState } from "react";

type ResultsListProps = {
  results: ComparisonResult;
};

function ProductDiffItem({
  name,
  values,
}: {
  name: string;
  values: [[number, number], [number, number]];
}) {
  const [expected, received] = values;
  const [qntdExpected, pesoExpected] = expected;
  const [qntdReceived, pesoReceived] = received;

  const qntdDiff = qntdReceived - qntdExpected;
  const pesoDiff = pesoReceived - pesoExpected;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <h4 className="font-medium text-balance">{name}</h4>
        </div>
        <Badge variant="destructive" className="shrink-0">
          Divergente
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Esperado
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded bg-muted px-2 py-1">
              <span className="text-muted-foreground">Qntd: </span>
              <span className="font-medium">{qntdExpected}</span>
            </div>
            <div className="rounded bg-muted px-2 py-1">
              <span className="text-muted-foreground">Peso: </span>
              <span className="font-medium">{pesoExpected.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recebido
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded bg-muted px-2 py-1">
              <span className="text-muted-foreground">Qntd: </span>
              <span className="font-medium">{qntdReceived}</span>
              {qntdDiff !== 0 && (
                <span
                  className={
                    qntdDiff > 0
                      ? "text-green-600 ml-1"
                      : "text-destructive ml-1"
                  }
                >
                  ({qntdDiff > 0 ? "+" : ""}
                  {qntdDiff})
                </span>
              )}
            </div>
            <div className="rounded bg-muted px-2 py-1">
              <span className="text-muted-foreground">Peso: </span>
              <span className="font-medium">{pesoReceived.toFixed(4)}</span>
              {pesoDiff !== 0 && (
                <span
                  className={
                    pesoDiff > 0
                      ? "text-green-600 ml-1"
                      : "text-destructive ml-1"
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
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <h4 className="font-medium text-balance">{name}</h4>
        </div>
        <Badge variant="destructive" className="shrink-0">
          Repetido
        </Badge>
      </div>

      {values.map((value) => (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded bg-muted px-2 py-1">
                <span className="text-muted-foreground">nItem: </span>
                <span className="font-medium">{value[0]}</span>
              </div>
              <div className="rounded bg-muted px-2 py-1">
                <span className="text-muted-foreground">Qntd: </span>
                <span className="font-medium">{value[1]}</span>
              </div>
              <div className="rounded bg-muted px-2 py-1">
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

  console.log({ results })

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total de Itens</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{same_sku}</p>
              <p className="text-sm text-muted-foreground">
                Itens repetidos na NFe
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">
                {diffEntries.length}
              </p>
              <p className="text-sm text-muted-foreground">Divergentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {eqEntries.length}
              </p>
              <p className="text-sm text-muted-foreground">Conferidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos repetidos */}
      {same_sku > 0 && (
        <Card>
          <Collapsible open={isSameOpen} onOpenChange={setIsSameOpen}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-destructive" />
                    Produtos repetidos na NFe
                  </CardTitle>
                  <CardDescription>
                    Nota apresenta {same_sku} itens repetidos
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown
                      className={`size-4 transition-transform ${isSameOpen ? "rotate-180" : ""}`}
                    />
                    {isSameOpen ? "Recolher" : "Expandir"}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {Object.entries(results.same_sku)
                  .filter((v) => v[1] != null && v[1].length > 1)
                  ?.map(([name, values]) => (
                    <ProductSameItem key={name} name={name} values={values} />
                  ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Divergences */}
      {diffEntries.length > 0 && (
        <Card>
          <Collapsible open={isDiffOpen} onOpenChange={setIsDiffOpen}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-destructive" />
                    Itens Divergentes
                  </CardTitle>
                  <CardDescription>
                    {diffEntries.length}{" "}
                    {diffEntries.length === 1
                      ? "item apresenta"
                      : "itens apresentam"}{" "}
                    diferença entre os arquivos
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown
                      className={`size-4 transition-transform ${isDiffOpen ? "rotate-180" : ""}`}
                    />
                    {isSameOpen ? "Recolher" : "Expandir"}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {diffEntries.map(([name, values]) => (
                  <ProductDiffItem key={name} name={name} values={values} />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Equal items (collapsible) */}
      {eqEntries.length > 0 && (
        <Card>
          <Collapsible open={isEqOpen} onOpenChange={setIsEqOpen}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-600" />
                    Itens Conferidos
                  </CardTitle>
                  <CardDescription>
                    {eqEntries.length}{" "}
                    {eqEntries.length === 1 ? "item está" : "itens estão"} em
                    conformidade
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown
                      className={`size-4 transition-transform ${isEqOpen ? "rotate-180" : ""}`}
                    />
                    {isEqOpen ? "Recolher" : "Expandir"}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-2">
                {eqEntries.map(([name, values]) => (
                  <ProductEqItem key={name} name={name} values={values} />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}
