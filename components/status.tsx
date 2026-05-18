"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, Chip, Button } from "@heroui/react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Loader2,
} from "lucide-react";

interface DomainStatus {
  url: string;
  name: string;
  status: "online" | "offline" | "error" | "checking" | "pending";
  currentDelay: number;
  lastChecked: Date | null;
  retryCount: number;
  error?: string;
}

const DOMAINS = [
  { url: "https://wms.pdahub.com.br/", name: "WMS PDA Hub" },
  { url: "https://admin.pdahub.com.br/", name: "Admin PDA Hub" },
  {
    url: "https://pdawmspickingfuncprd.azurewebsites.net/",
    name: "PDA WMS Picking (Azure)",
  },
  {
    url: "https://rainhaerp.rainhadassete.com.br/",
    name: "Rainha ERP",
  },
  { url: "http://192.168.80.5:3002/", name: "Servidor Local (192.168.80.5)" },
];

const CHECK_INTERVAL = 60000; // 1 minuto
const BASE_RETRY_DELAY = 5000; // 5 segundos

export function StatusMonitor() {
  const [domains, setDomains] = useState<DomainStatus[]>(
    DOMAINS.map((d) => ({
      ...d,
      status: "pending",
      currentDelay: 0,
      lastChecked: null,
      retryCount: 0,
    })),
  );
  const [isChecking, setIsChecking] = useState(false);
  const [nextCheck, setNextCheck] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const checkDomain = useCallback(
    async (domain: DomainStatus, isRetry = false): Promise<DomainStatus> => {
      // Atualiza status para "checking"
      setDomains((prev) =>
        prev.map((d) =>
          d.url === domain.url ? { ...d, status: "checking" as const } : d,
        ),
      );

      try {
        const result = await (async () => {
          try {
            await fetch(domain.url, {
              method: "HEAD",
              signal: AbortSignal.timeout(5000),
              cache: "no-store",
              mode: "no-cors",
            });

            return {
              url: domain.url,
              status: "online" as const,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            return {
              url: domain.url,
              status: "offline" as const,
              statusCode: null,
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            };
          }
        })();

        const newStatus: DomainStatus = {
          ...domain,
          status: result.status === "online" && domain.retryCount > 0 ? "error" : result.status,
          lastChecked: new Date(),
          retryCount: isRetry ? domain.retryCount + 1 : 0,
          error: result.error,
        };

        // Se falhou e ainda tem retries disponíveis, agenda retry
        if (result.status === "offline") {
          const delay = BASE_RETRY_DELAY * (Math.log(Math.pow(10, Math.max(3, newStatus.retryCount))) >> 0);

            newStatus.currentDelay = delay;

          // Limpa timeout anterior se existir
          const existingTimeout = retryTimeouts.current.get(domain.url);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeoutId = setTimeout(() => {
            checkDomain(newStatus, true).then((updatedDomain) => {
              setDomains((prev) =>
                prev.map((d) =>
                  d.url === updatedDomain.url ? updatedDomain : d,
                ),
              );
            });
          }, delay);

          retryTimeouts.current.set(domain.url, timeoutId);
        }

        return newStatus;
      } catch {
        return {
          ...domain,
          status: "error",
          lastChecked: new Date(),
          retryCount: isRetry ? domain.retryCount + 1 : 0,
          error: "Erro ao verificar",
        };
      }
    },
    [],
  );

  const checkAllDomains = useCallback(async () => {
    setIsChecking(true);

    // Limpa todos os timeouts de retry pendentes
    retryTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    retryTimeouts.current.clear();

    const results = await Promise.all(
      domains.map((domain) => checkDomain({ ...domain, retryCount: 0 }, false)),
    );

    setDomains(results);
    setIsChecking(false);
    setNextCheck(new Date(Date.now() + CHECK_INTERVAL));
  }, [domains, checkDomain]);

  // Verificação inicial e intervalo
  useEffect(() => {
    checkAllDomains();

    const interval = setInterval(() => {
      checkAllDomains();
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      retryTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!nextCheck) return;

    const updateCountdown = () => {
      const remaining = Math.max(0, nextCheck.getTime() - Date.now());
      setCountdown(Math.ceil(remaining / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextCheck]);

  const getStatusIcon = (domain: DomainStatus) => {
    switch (domain.status) {
      case "online":
        return domain.retryCount > 0 ? (
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        );
      case "offline":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "checking":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (domain: DomainStatus) => {
    const color: Record<
      DomainStatus["status"],
      "default" | "accent" | "danger" | "success" | "warning"
    > = {
      online: "success",
      offline: "danger",
      error: "warning",
      checking: "default",
      pending: "default",
    };

    const labels: Record<DomainStatus["status"], string> = {
      online: "Online",
      offline: "Offline",
      error: "Erro",
      checking: "Verificando...",
      pending: "Aguardando...",
    };

    return (
      <Chip
        variant="primary"
        color={color[domain.status]}
      >
        {labels[domain.status]}
      </Chip>
    );
  };

  const onlineCount = domains.filter((d) => d.status === "online").length;
  const offlineCount = domains.filter(
    (d) => d.status === "offline" || d.status === "error",
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <Card.Title className="text-2xl font-bold">
              Monitor de Status
            </Card.Title>
            <p className="text-sm text-muted-foreground mt-1">
              Verificando {domains.length} domínios • Próxima verificação em{" "}
              {countdown}s
            </p>
          </div>
          <Button
            onClick={checkAllDomains}
            isDisabled={isChecking}
            variant="outline"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar Agora
          </Button>
        </Card.Header>
        <Card.Content>
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-600">
                {onlineCount} Online
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-600">
                {offlineCount} Offline
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {domains.map((domain) => (
              <div
                key={domain.url}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(domain)}
                  <div>
                    <p className="font-medium">{domain.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {domain.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(domain)}
                  {domain.currentDelay}
                  {domain.lastChecked && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {domain.lastChecked.toLocaleTimeString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
