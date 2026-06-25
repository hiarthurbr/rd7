"use client";

import { Button, EmptyState, Table } from "@heroui/react";
import { NumberParser } from "@internationalized/number";
import { BookDashedIcon, RefreshCcwDotIcon } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";
import { FileUploader } from "@/components/file-uploader";
import { getToken } from "@/lib/pda";
import { status_pedido_pda_enum } from "@/lib/schemas";

const status_pedido_schema = z.object({
  codigoPedido: z.string(),
  cliente: z.string(),
  quantidadePedido: z.number(),
  recebido: z.coerce.date().or(z.date()).optional(),
  planejamento: z.coerce.date().or(z.date()).optional(),
  descricaoStatus: status_pedido_pda_enum,
  tipoPedido: z.string(),
  progresso: z.number(),
  transportadora: z.string(),
  notaFiscal: z.string(),
  periodo: z.string(),
  pedidoEcom: z.string(),
  quantidadeSku: z.number(),
  volumes: z.number(),
  codigoStatus: z.number(),
  cubagem: z.number(),
  progressoTotal: z.number(),
  dataEntrega: z.coerce.date().or(z.date()).optional(),
  vendedor: z.string(),
  formaPagamento: z.string(),
  codigoPedidoExterno: z.string(),
  marketPlace: z.string(),
  dataFimSeparacao: z.coerce.date().or(z.date()).optional(),
});

const produto_pedido_schema = z.object({
  codigoPedido: z.string(),
  codigoTransportadora: z.string(),
  codigoEcCliente: z.number(),
  nomeCliente: z.string(),
  produto: z.string(),
  descricaoStatus: status_pedido_pda_enum,
  transportadora: z.string(),
  dataIntegracao: z.coerce.date().or(z.date()).optional(),
  cor: z.string(),
  tamanho: z.string(),
  grade: z.string(),
  descricaoEndereco: z.string(),
  quantidadePicking: z.number(),
  notaFiscal: z.string(),
  serie: z.string(),
  dataInicioSeparacao: z.coerce.date().or(z.date()).optional(),
  dataFimSeparacao: z.coerce.date().or(z.date()).optional(),
  tipoPedido: z.string(),
  quantidadePedido: z.number(),
  ean: z.string().transform((str) => str.split(",")),
  lote: z.string(),
  promocao: z.string(),
  usuario: z.string(),
});

const number_parser = new NumberParser("pt-BR", { style: "decimal" });

export default function Page() {
  const [reservasFile, setReservasFile] = useState<File | null>(null);
  const [reservas, setReservas] = useState<Array<{
    quantidade: number;
    tipo: string;
    produto: string;
    documento: string | null;
  }> | null | null>(null);

  useEffect(() => {
    reservasFile
      ?.arrayBuffer()
      .then((str) => {
        const text = Buffer.from(str).toString("latin1");

        console.log({ text });

        return text
          .split("\n")
          .filter((str) => !!str.trim())
          .slice(1)
          .map((str) => str.split("|"))
          .map((tuple) =>
            z
              .tuple([
                z.string(),
                z.string(),
                z.coerce
                  .number()
                  .or(
                    z.preprocess(
                      (str) => (typeof str === "string" ? number_parser.parse(str) : null),
                      z.number(),
                    ),
                  ),
                z.string(),
                z.string(),
                z.string(),
              ])
              .transform(([, , quantidade, tipo, produto, documento]) => ({
                quantidade,
                tipo,
                produto,
                documento:
                  tipo === "Venda" ? (documento.match(/proposta N\S (\d+)/)?.[1] ?? null) : null,
              }))
              .parse(tuple),
          );
      })
      .then(setReservas);
  }, [reservasFile]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 flex flex-col items-center space-y-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Calcular divergência sistematica
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Compare a divergência entre PDA e Titanium
          </p>
        </div>

        <div className="w-full max-w-md text-center">
          <FileUploader
            label="Arquivo de reservas"
            accept=".txt"
            file={reservasFile}
            onFileChange={setReservasFile}
            icon="xml"
          />
          {reservasFile != null && (
            <Button
              className="mt-8"
              onPress={async () => {
                const a = await reservasFile.text().then((str) =>
                  str
                    .split("\n")
                    .filter((str) => !!str.trim())
                    .slice(1)
                    .map((str) => str.split("|"))
                    .map(([, , quantidade, tipo, produto, documento]) => ({
                      quantidade: Number(quantidade),
                      tipo,
                      produto,
                      documento:
                        tipo === "Venda"
                          ? (documento.match(/roposta N\S (\d+)/)?.[1] ?? null)
                          : null,
                    })),
                );
                console.log(a);
                console.log(
                  await Promise.all(
                    a.map(async (reserva) =>
                      reserva.documento
                        ? fetch("https://api.pdahub.com.br/api/Relatorio/Pedido", {
                            headers: {
                              accept: "application/json, text/plain, */*",
                              authorization: await getToken(),
                              "cache-control": "no-cache",
                              "content-type": "application/json",
                              pragma: "no-cache",
                            },
                            referrer: "https://wms.pdahub.com.br/",
                            body: JSON.stringify({
                              CodigoStatus: null,
                              CodigoCliente: 30,
                              codigoEcCliente: null,
                              CodigoPedido: reserva.documento,
                              codigoTransportadora: null,
                              notaFiscal: null,
                              tipoPedido: null,
                              inicio: null,
                              fim: null,
                              periodo: null,
                              user: 1297,
                              filial: null,
                              pedidoEcom: null,
                              marketplace: null,
                              dataEntrega: null,
                              codigoMarca: null,
                            }),
                            method: "PATCH",
                          })
                            .then((res) => res.json())
                            .then(status_pedido_schema.array().parseAsync)
                            .then(async (pedido) =>
                              pedido.length === 0
                                ? { status: "Não liberado", quantidade: 0 }
                                : [
                                      "Aguardando Faturamento",
                                      "Aguardando Embarque",
                                      "Aguardando Conferência",
                                      "Aguardando Integração",
                                    ].includes(pedido[0].descricaoStatus)
                                  ? {
                                      status: pedido[0].descricaoStatus,
                                      quantidade: reserva.quantidade,
                                    }
                                  : [
                                        "Aguardando Faturamento",
                                        "Andamento",
                                        "Finalizado c/divergência",
                                      ].includes(pedido[0].descricaoStatus)
                                    ? fetch(
                                        "https://api.pdahub.com.br/api/Relatorio/Pedido/Separacao",
                                        {
                                          headers: {
                                            accept: "application/json, text/plain, */*",
                                            authorization: await getToken(),
                                            "cache-control": "no-cache",
                                            "content-type": "application/json",
                                            pragma: "no-cache",
                                            priority: "u=1, i",
                                          },
                                          referrer: "https://wms.pdahub.com.br/",
                                          body: JSON.stringify({
                                            codigoCliente: 30,
                                            codigoPedido: "42209",
                                            produto: "7848",
                                            codigoTransportadora: null,
                                            tipoPedido: null,
                                            dataInicio: null,
                                            dataFim: null,
                                            codigoStatus: null,
                                            dataEntrega: null,
                                            marketplace: null,
                                            codigoMarca: null,
                                          }),
                                          method: "PATCH",
                                        },
                                      )
                                        .then((r) => r.json())
                                        .then(produto_pedido_schema.array().parseAsync)
                                        .then((res) => ({
                                          status: pedido[0].descricaoStatus,
                                          quantidade: res[0]?.quantidadePicking ?? 0,
                                        }))
                                    : { status: pedido[0].descricaoStatus, quantidade: 0 },
                            )
                        : { status: null, quantidade: reserva.quantidade },
                    ),
                  ),
                );
              }}
            >
              <RefreshCcwDotIcon />
              Calcular divergência
            </Button>
          )}
        </div>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Table with custom cells" className="min-w-200">
              <Table.Header>
                <Table.Column allowsSorting isRowHeader className="after:hidden" id="id">
                  Documento
                </Table.Column>
                <Table.Column allowsSorting id="name">
                  Tipo
                </Table.Column>
                <Table.Column allowsSorting id="role">
                  Quantidade
                </Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                    <BookDashedIcon className="size-6 text-muted" />
                    <span className="text-sm text-muted">Nenhuma entrada para listar</span>
                  </EmptyState>
                )}
              >
                {reservas?.map((reserva, i) => (
                  <Table.Row key={i}>
                    <Table.Cell className="font-medium">
                      <div className="flex items-center gap-2">{reserva.documento}</div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-3">{reserva.tipo}</div>
                    </Table.Cell>
                    <Table.Cell className="min-w-52">{reserva.quantidade}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </main>
  );
}
