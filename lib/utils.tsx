import { Chip, SortDescriptor } from "@heroui/react";
import { SortingState } from "@tanstack/react-table";
import { type ClassValue, clsx } from "clsx";
import { ArrowDownUpIcon, ChevronUpIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt_date = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toFixed(0).padStart(2, "0")}-${date.getDate().toFixed(0).padStart(2, "0")}`;


const duration_locale = new Intl.DurationFormat("pt-BR", {
  style: "long",
});

export function duration(minutes_raw: number) {
  if (minutes_raw < 1) return "<1 minuto";
  const minutes = minutes_raw % 60;
  const hours = (minutes_raw - minutes) / 60;

  // console.log({ minutes_raw, minutes, hours });

  return duration_locale.format({
    hours,
    minutes,
  });
}

export function toSortDescriptor(sorting: SortingState): SortDescriptor | undefined {
  const first = sorting[0];
  if (!first) return undefined;
  return {
    column: first.id,
    direction: first.desc ? "descending" : "ascending",
  };
}

export function toSortingState(descriptor: SortDescriptor): SortingState {
  return [{ desc: descriptor.direction === "descending", id: descriptor.column as string }];
}

export function SortableColumnHeader({
  children,
  sortDirection,
}: {
  children: React.ReactNode;
  sortDirection?: "ascending" | "descending";
}) {
  return (
    <span className="flex items-center justify-between">
      <span>{children}</span>
      {sortDirection == null ? (
        <Chip size="sm" variant="secondary">
          <ArrowDownUpIcon className="stroke-neutral-400 size-3" />
        </Chip>
      ) : (
        <Chip size="sm" variant="primary" color="accent">
          <ChevronUpIcon
            className={cn(
              "size-3 transform transition-transform duration-100 ease-out",
              sortDirection === "descending" ? "rotate-180" : "",
            )}
          />
        </Chip>
      )}
    </span>
  );
}