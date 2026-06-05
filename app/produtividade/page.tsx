"use client";

import { ArchiveRestoreIcon, ScanBarcodeIcon } from "lucide-react";
import { Card, Chip, Link, Separator } from "@heroui/react";

export default function Default() {
  return (
    <div className="flex w-full h-screen items-center justify-center">
      <div className="flex flex-row space-x-8">
        <Card className="w-100">
          <ScanBarcodeIcon
            aria-label="Dollar sign icon"
            className="text-primary size-6"
            role="img"
          />
          <Card.Header>
            <Card.Title>Produtividade Conferência</Card.Title>
            <Card.Description></Card.Description>
          </Card.Header>
          <Card.Footer>
            <Link
              aria-label="Ver relatório de conferência"
              href="/produtividade/conferencia"
            >
              Ver relatório
              <Link.Icon aria-hidden="true" />
            </Link>
          </Card.Footer>
        </Card>

        <Separator orientation="vertical" className="my-6" />

        <Card className="w-100">
          <ArchiveRestoreIcon
            aria-label="Dollar sign icon"
            className="text-primary size-6"
            role="img"
          />
          <Card.Header>
            <Card.Title>
              Produtividade Picking{" "}
              <Chip variant="primary" className="w-fit">
                Em desenvolvimento
              </Chip>
            </Card.Title>
            <Card.Description></Card.Description>
          </Card.Header>
          <Card.Footer>
            <Link
              aria-label="Ver relatório de picking"
              href="/produtividade/picking"
              isDisabled
            >
              Ver relatório
              <Link.Icon aria-hidden="true" />
            </Link>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
