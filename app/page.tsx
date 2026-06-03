"use client";
import {
  CalendarClockIcon,
  ChartAreaIcon,
  GitCompareArrowsIcon,
  LayoutDashboardIcon,
  MapIcon,
  RefreshCcwIcon,
  ScrollTextIcon,
  Undo2Icon,
} from "lucide-react";
import { Card, Chip, Link, Separator } from "@heroui/react";

export default function Default() {
  return (
    <div className="flex w-full h-screen items-center justify-center">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-row space-x-8">
          <Card className="w-100">
            <GitCompareArrowsIcon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>Comparador NFe{"<>"}Packlist</Card.Title>
              <Card.Description>
                Compare arquivos XLSX e XML para identificar divergências de
                produtos em propostas em faturamento
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link aria-label="Ver comparador" href="/comparar-nfe-packlist">
                Comparar arquivos
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>

          <Separator orientation="vertical" className="my-6" />

          <Card className="w-100">
            <ScrollTextIcon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>Verificador JEFFTRANSPORTE</Card.Title>
              <Card.Description>
                Compare a planilha de fechamento JEFFTRANSPORTE com os dados do
                ERP
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link aria-label="Ver relatório de picking" href="/jeferson">
                Comparar fechamento
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>
        </div>
        <div className="flex flex-row space-x-8">
          <Card className="w-100">
            <Undo2Icon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>Análise de devoluções</Card.Title>
              <Card.Description>Analise o histórico de devoluções de pedidos e suas divergências</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link aria-label="Ver relatório de devoluções" href="/devolucoes">
                Ver relatório
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>

          <Separator orientation="vertical" className="my-6" />

          <Card className="w-100">
            <RefreshCcwIcon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>
                Sincronizador de estoque{" "}
                <Chip variant="primary" className="w-fit">
                  Em desenvolvimento
                </Chip>
              </Card.Title>
              <Card.Description>
                Analise e sincronize produtos entre PDA e Titanium
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link aria-label="Sincronizar produtos" href="/sync" isDisabled>
                Sincronizar produtos
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>
        </div>
        <div className="flex flex-row space-x-8">
          <Card className="w-100">
            <ChartAreaIcon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>Relatório de produtividade</Card.Title>
              <Card.Description>
                Visualize a produtividade por hora ou dia da conferência/picking
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link
                aria-label="Ver relatório de produtividade"
                href="/produtividade"
              >
                Ver relatório
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>

          <Separator orientation="vertical" className="my-6" />

          <Card className="w-100">
            <MapIcon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>
                Mapa de calor{" "}
                <Chip variant="primary" className="w-fit">
                  Em desenvolvimento
                </Chip>
              </Card.Title>
              <Card.Description>
                Visualize um mapa da empresa com dados relacionados as posições
                individuais do armazém
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link aria-label="Ver mapa" href="/map" isDisabled>
                Ver mapa
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>
        </div>
        <div className="flex flex-row space-x-8">
          <Card className="w-100">
            <LayoutDashboardIcon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>Dashboard de Logística</Card.Title>
              <Card.Description>
                Monitore o fluxo, status e indicadores de performance dos
                pedidos em tempo real. Otimize a operação com dados
                estratégicos de ponta a ponta.
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link aria-label="Ver dashboard de logistica" href="/dashboard" target="_blank">
                Ver dashboard
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>

          <Separator orientation="vertical" className="my-6" />

          <Card className="w-100">
            <CalendarClockIcon
              aria-label="Dollar sign icon"
              className="text-primary size-6"
              role="img"
            />
            <Card.Header>
              <Card.Title>Armazenagens pendentes</Card.Title>
              <Card.Description>
                Lista de notas com pendencias/divergências na armazenagem
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link aria-label="Ver pendências" href="/armazenagem_pendentes">
                Ver pendências
                <Link.Icon aria-hidden="true" />
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
}
