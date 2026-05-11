"use client";

import {
  AlertCircle,
  ArrowUpRightFromSquareIcon,
  CheckCircle2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Chip,
  Disclosure,
  Modal,
  Separator,
} from "@heroui/react";
import type { ComparisonResult } from "@/lib/types";
import { useState } from "react";

type ResultsListProps = {
  results: ComparisonResult;
};

function ProductDiffItem({
  name,
  values,
  raw,
}: {
  name: string;
  values: [[number, number], [number, number]];
  raw: any;
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
        <Modal>
          <Button size="sm" variant="ghost" onClick={() => console.log()}>
            Abrir NF
            <ArrowUpRightFromSquareIcon />
          </Button>
          <Modal.Backdrop>
            <Modal.Container size="cover">
              <Modal.Dialog className="max-w-165">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Welcome to HeroUI</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="space-y-3">
                  {raw
                    // @ts-expect-error
                    .map((nfeData, i) => ({ nItem: i + 1, ...nfeData }))
                    // @ts-expect-error
                    .filter((prod) => prod.prod.cProd === name)
                    // @ts-expect-error
                    .map((nfeData, i) => (
                      <Card key={i} variant="secondary">
                        <Card.Content>
                          {/* Produto */}
                          <section>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                              nItem #{nfeData.nItem}
                            </h3>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex justify-between">
                                  <pre className="text-sm text-muted-foreground">
                                    cProd
                                  </pre>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.cProd}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <pre className="text-sm text-muted-foreground">
                                    cEANTrib
                                  </pre>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.cEANTrib}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <pre className="text-sm text-muted-foreground">
                                  xProd
                                </pre>
                                <p className="text-sm font-medium mt-1">
                                  {nfeData.prod.xProd}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    NCM
                                  </span>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.NCM}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    CFOP
                                  </span>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.CFOP}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </section>

                          <Separator className="mx-12" />

                          {/* Quantidades e Valores */}
                          <section>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                              Quantidades e Valores
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  nItemPed
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.nItemPed}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  uCom
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.uCom}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  vUnCom
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.vUnCom.toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  qTrib
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.qTrib}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  uTrib
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.uTrib}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  vProd
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.vProd.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </section>
                        </Card.Content>
                      </Card>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                  <Button className="w-full" slot="close">
                    Continue
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

        <Chip
          variant={Math.abs(pesoDiff) < 0.001 ? "soft" : "primary"}
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
  raw
}: {
  name: string;
  values: [number, number, number][];
  raw: any;
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 text-accent shrink-0" />
          <h4 className="font-medium text-balance">{name}</h4>
        </div>
        
        <Modal>
          <Button size="sm" variant="ghost" onClick={() => console.log()}>
            Abrir NF
            <ArrowUpRightFromSquareIcon />
          </Button>
          <Modal.Backdrop>
            <Modal.Container size="cover">
              <Modal.Dialog className="max-w-165">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Welcome to HeroUI</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="space-y-3">
                  {raw
                    // @ts-expect-error
                    .map((nfeData, i) => ({ nItem: i + 1, ...nfeData }))
                    // @ts-expect-error
                    .filter((prod) => prod.prod.cProd === name)
                    // @ts-expect-error
                    .map((nfeData, i) => (
                      <Card key={i} variant="secondary">
                        <Card.Content>
                          {/* Produto */}
                          <section>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                              nItem #{nfeData.nItem}
                            </h3>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex justify-between">
                                  <pre className="text-sm text-muted-foreground">
                                    cProd
                                  </pre>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.cProd}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <pre className="text-sm text-muted-foreground">
                                    cEANTrib
                                  </pre>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.cEANTrib}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <pre className="text-sm text-muted-foreground">
                                  xProd
                                </pre>
                                <p className="text-sm font-medium mt-1">
                                  {nfeData.prod.xProd}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    NCM
                                  </span>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.NCM}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    CFOP
                                  </span>
                                  <span className="text-sm font-medium">
                                    {nfeData.prod.CFOP}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </section>

                          <Separator className="mx-12" />

                          {/* Quantidades e Valores */}
                          <section>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                              Quantidades e Valores
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  nItemPed
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.nItemPed}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  uCom
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.uCom}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  vUnCom
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.vUnCom.toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  qTrib
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.qTrib}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  uTrib
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.uTrib}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <pre className="text-sm text-muted-foreground">
                                  vProd
                                </pre>
                                <span className="text-sm font-medium">
                                  {nfeData.prod.vProd.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </section>
                        </Card.Content>
                      </Card>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                  <Button className="w-full" slot="close">
                    Continue
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
        <Badge.Anchor className="mx-2">
          <Badge color="accent" className="shrink-0 px-1">
            Repetido
          </Badge>
        </Badge.Anchor>
      </div>

      {values.map((value) => (
        <div className="mt-4 grid grid-cols-1 gap-4" key={value.toString()}>
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
                      raw={results.raw}
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
