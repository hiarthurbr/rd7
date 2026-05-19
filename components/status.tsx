import { token_schema } from "@/lib/types";
import { Button, ColorSwatch, Label, ProgressCircle } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { HeartPulseIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useCountdown, useSafeState } from "@shined/react-use";
import z from "zod";
import { useSpring, useTransform, motion } from "framer-motion";

const COLORS = {
  "0": "#a1a1a1",
  "1": "#e7000b",
  "2": "#ff6900",
  "3": "#ffb900",
  "4": "#ffdf20",
  "5": "#9ae600",
};

type Domain = {
  check: () => Promise<"online" | "offline" | "error">;
  name: string;
  delay: number;
  key: string;
};

const DOMAINS: Array<Domain> = [
  {
    check: () =>
      fetch("https://admin.pdahub.com.br/", {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
        mode: "no-cors",
      })
        .then(() => "online" as const)
        .catch(() => "offline"),
    name: "Admin PDA Hub",
    delay: 1,
    key: "admin_pda_hub",
  },
  {
    check: () =>
      fetch("https://api.pdahub.com.br/api/Autenticacao", {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
        },
        body: JSON.stringify({ Login: "arthur.bufalo" }),
        signal: AbortSignal.timeout(5000),
        method: "POST",
      })
        .then((r) => r.json())
        .then(token_schema.safeParseAsync)
        .then((token) => (token.success ? "online" : "error"))
        .catch(() => "offline"),
    name: "PDA API",
    delay: 5,
    key: "pda_api",
  },
  {
    check: () =>
      fetch(
        "https://pdawmspickingfuncprd.azurewebsites.net/api/Picking/Conferencia",
        {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
          cache: "no-store",
          mode: "no-cors",
        },
      )
        .then(() => "online" as const)
        .catch(() => "offline"),
    name: "PDA Picking API",
    delay: 1,
    key: "pda_pickin_api",
  },
  {
    check: () =>
      fetch("https://api-erp.rainhadassete.com.br/api/Usuarios/login", {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
        },
        referrer: "https://rainhaerp.rainhadassete.com.br/",
        body: atob(
          "eyJVc3VhcmlvIjoiYXJ0aHVyLnJvZHJpZ3VleiIsIlNlbmhhIjoiJCRSUjc3aGgifQ==",
        ),
        method: "POST",
      })
        .then((r) => r.json())
        .then((r) => ("token" in r ? "online" : "error"))
        .catch(() => "offline"),
    name: "Rainha ERP API",
    delay: 5,
    key: "rainha_erp_api",
  },
  {
    check: () =>
      fetch("https://rainhaerp.rainhadassete.com.br/", {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
        mode: "no-cors",
      })
        .then(() => "online" as const)
        .catch(() => "offline"),
    name: "Rainha ERP",
    delay: 1,
    key: "rainha_erp",
  },
  {
    check: () =>
      fetch("http://192.168.80.5:3002/", {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
        mode: "no-cors",
      })
        .then(() => "online" as const)
        .catch(() => "offline"),
    name: "Rainha ERP (Local)",
    delay: 1,
    key: "rainha_erp_local",
  },
];

const history_schema = z
  .array(z.enum(["online", "offline", "error", "pending"]))
  .default(() => new Array());

function Domain({
  domain,
  expanded,
}: {
  domain: Domain;
  expanded: boolean;
  shouldExpand: Dispatch<SetStateAction<boolean>>;
}) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [domain.key],
    queryFn: domain.check,
    refetchInterval: 1000 * 60 * domain.delay,
    staleTime: 1000 * 60 * domain.delay,
    refetchOnWindowFocus: false,
  });

  const [date, setDate] = useSafeState(() => Date.now());
  const countdown = useCountdown(date, {
    controls: true,
    interval: 500,
  });
  const [history, setHistory] = useState<z.infer<typeof history_schema>>(
    Array.from<z.infer<typeof history_schema>[number]>({ length: 60 }).fill(
      "pending",
    ),
  );

  useEffect(() => {
    const date = new Date();
    if (data != null) setHistory((h) => [...h.slice(-59), data]);
    console.log({ data, domain: domain.name, date });
  }, [data, domain.name]);

  const spring = useSpring(0, { duration: 500, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isFetching) {
      setDate(Date.now() + domain.delay * 60_000);
    }
  }, [isFetching]);

  useEffect(() => {
    spring.set(countdown.ms / 1000);
  }, [spring, countdown]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [display]);

  const uptime = useMemo(
    () => (
      <div className="flex flex-row items-center justify-center space-x-0.5 col-span-2">
        {...Array.from({ length: 12 }).map((_, i) => {
          const slice = history.slice(i * 5, i * 5 + 5);

          return (
            <ColorSwatch
              key={`COLOR-SWATCH-${i}`}
              color={
                slice.every((s) => s === "pending")
                  ? COLORS["0"]
                  : COLORS[
                      5 - (slice.filter((s) => s === "error" || s === "offline").length >>
                        0) as unknown as keyof typeof COLORS
                    ]
              }
              className="w-1 h-5"
            />
          );
        })}
      </div>
    ),
    [history],
  );

  const status = useMemo(
    () => (
      <ColorSwatch
        color={
          COLORS[
            (((history.filter((s) => s === "online").length / history.length) *
              5) >>
              0) as unknown as keyof typeof COLORS
          ]
        }
        className={`size-2.5 ${isLoading || isFetching ? "animate-pulse" : ""}`}
      />
    ),
    [isLoading, isFetching],
  );

  return (
    <div className="grid grid-flow-row grid-cols-6 px-2 justify-items-start items-center space-x-2">
      {expanded ? uptime : status}
      <div className={expanded ? "col-span-3 w-full" : "col-span-4 w-full"}>
        <Label className="text-left">{domain.name}</Label>
      </div>
      <ProgressCircle
        aria-label="Default"
        color="success"
        size="sm"
        value={displayValue}
        maxValue={domain.delay * 60}
        isIndeterminate={isFetching || isLoading}
        className="place-self-end"
      >
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
    </div>
  );
}

export function Status() {
  const [expand, setExpand] = useState(false);

  return (
    <div>
      <motion.div
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        animate={{ width: expand ? 280 : 40 }}
        className="pl-2 p-3 rounded-xl bg-slate-900/25 overflow-hidden backdrop-blur-sm"
      >
        <motion.div className="">
          <motion.div className="flex flex-col w-max space-y-3">
            <motion.div className="grid grid-flow-row grid-cols-6 justify-items-start items-center h-7 px-1 space-x-2">
              <HeartPulseIcon
                className={expand ? "size-5 col-span-2" : "size-5"}
              />
              <Label className="col-span-4">Serviço</Label>
            </motion.div>
            {...DOMAINS.map((domain) => (
              <Domain
                domain={domain}
                expanded={expand}
                shouldExpand={setExpand}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
      <Button onPress={() => setExpand((v) => !v)}>+</Button>
    </div>
  );
}
