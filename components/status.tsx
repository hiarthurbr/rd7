import { token_schema } from "@/lib/types";
import { Button, ColorSwatch, Label, ProgressCircle } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { HeartPulseIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCountdown } from "@shined/react-use";
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

const history_schema = z.object({
  status: z.enum(["online", "offline", "error", "pending"]),
  date: z.coerce.date().or(z.date()),
});

function Domain({
  domain,
  expanded,
  shouldExpand
}: {
  domain: Domain;
  expanded: boolean;
  shouldExpand: (yes: boolean) => void;
}) {
  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: [domain.key],
    queryFn: domain.check,
    refetchInterval: 1000 * 60 * domain.delay,
    staleTime: 1000 * 60 * domain.delay,
    refetchOnWindowFocus: "always",
    refetchIntervalInBackground: true,
    refetchOnReconnect: "always",
  })

  useEffect(
    () =>
      console.log({
        date: new Date(dataUpdatedAt + domain.delay * 60_000),
        domain: domain.name,
      }),
    [dataUpdatedAt],
  );
  const date = useMemo(
    () => new Date(dataUpdatedAt + domain.delay * 60_000),
    [dataUpdatedAt],
  );
  const countdown = useCountdown(date, {
    controls: true,
    interval: 250,
  });
  const [history, setHistory] = useState<Array<z.infer<typeof history_schema>>>(
    [],
  );

  const spring = useSpring(0, { duration: 500, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (data != null)
      setHistory((h) => {
        const now = Date.now();

        console.log({
          h,
          cache: z
            .array(history_schema)
            .safeParse(JSON.parse(localStorage.getItem(domain.key) ?? "[]"))
            ?.data,
          filtered: z
            .array(history_schema)
            .safeParse(JSON.parse(localStorage.getItem(domain.key) ?? "[]"))
            ?.data?.filter((h) => h.date < new Date(now - 1000 * 60 * 60)),
          start: new Date(now - 1000 * 60 * 60),
          domain: domain.key,
        });

        const history = [
          ...(h.length
            ? h
            : (z
                .array(history_schema)
                .safeParse(JSON.parse(localStorage.getItem(domain.key) ?? "[]"))
                ?.data ?? [])
          ).filter((h) => h.date >= new Date(now - 1000 * 60 * 60)),
          { status: data, date: new Date(now) },
        ];

        localStorage.setItem(domain.key, JSON.stringify(history));

        shouldExpand(history.find(h => h.status !== "online") != null)

        return history;
      });
  }, [dataUpdatedAt]);

  useEffect(() => {
    spring.set(countdown.ms / 1000);
  }, [spring, countdown]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [display]);

  const timeline_score = useMemo(() => {
    const now = Date.now() - 1000 * 60 * 60;

    return Array.from({ length: 12 }).map((_, i) => {
      const start = new Date(now + 1000 * 60 * 5 * i);
      const end = new Date(now + 1000 * 60 * 5 * (i + 1));

      const slice = history.filter((h) => h.date >= start && h.date <= end);

      if (slice.length === 0) return 0;

      const res = Math.floor(
        slice.reduce((prev, curr) => {
          switch (curr.status) {
            case "offline":
              return prev + 1;
            case "error":
              return prev + 2;
            case "online":
              return prev + 5;
            default:
              return prev;
          }
        }, 0) / slice.length,
      );

      // console.log({slice, domain: domain.name, res})

      return res;
    });
  }, [history]);

  return (
    <div className="grid grid-flow-row grid-cols-6 px-2 justify-items-start items-center space-x-2">
      {expanded ? (
        <div className="flex flex-row items-center justify-center space-x-0.5 col-span-2">
          {timeline_score.map((score, i) => (
            <ColorSwatch
              key={`COLOR-SWATCH-${domain.key}-${i}`}
              color={COLORS[score.toFixed(0) as keyof typeof COLORS]}
              className="w-1 h-5"
            />
          ))}
        </div>
      ) : (
        <ColorSwatch
          color={COLORS[timeline_score[11].toFixed(0) as keyof typeof COLORS]}
          className={`size-2.5 ${isLoading || isFetching || new Date() > date ? "animate-pulse" : ""}`}
        />
      )}
      <div className={expanded ? "col-span-3 w-full" : "col-span-4 w-full"}>
        <Label className="text-left">{domain.name}</Label>
      </div>
      <ProgressCircle
        aria-label="Default"
        color="success"
        size="sm"
        value={displayValue}
        maxValue={domain.delay * 60}
        isIndeterminate={isFetching || isLoading || new Date() > date}
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
  const [expand, setExpand] = useState<{ [key: string]: boolean }>({ force_expand: false });

  const expanded = useMemo(() => !Object.values(expand).every(e => e === false), [expand])

  console.log({ expand, expanded })

  return (
    <div>
      <motion.div
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        animate={{ width: expanded ? 280 : 40 }}
        className="pl-2 p-3 rounded-xl bg-slate-900/40 overflow-hidden backdrop-blur-sm"
      >
        <motion.div className="">
          <motion.div className="flex flex-col w-max space-y-3">
            <motion.div className="grid grid-flow-row grid-cols-6 justify-items-start items-center h-7 px-1 space-x-2">
              <HeartPulseIcon
                className={expanded ? "size-5 stroke-white col-span-2" : "size-5 stroke-white"}
              />
              <Label className="col-span-4">Serviço</Label>
            </motion.div>
            {...DOMAINS.map((domain) => (
              <Domain
                domain={domain}
                expanded={expanded}
                shouldExpand={(yes) => setExpand(v => ({ ...v, [domain.key]: yes }))}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
      {/* <Button onPress={() => setExpand(v => ({ ...v, force_expand: !v.force_expand }))}>+</Button> */}
    </div>
  );
}
