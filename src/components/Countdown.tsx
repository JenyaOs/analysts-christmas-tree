"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/format";

type Props = {
  target: string;
  label?: string;
  compact?: boolean;
  className?: string;
};

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function split(remaining: number): Parts {
  const total = Math.max(0, Math.floor(remaining / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function Countdown({ target, label, compact = false, className = "" }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const refreshed = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const next = Math.max(0, targetMs - Date.now());
      setRemaining(next);
      if (next === 0 && !refreshed.current) {
        refreshed.current = true;
        // 00:00 МСК — задание открывается на сервере, обновляем страницу.
        window.setTimeout(() => router.refresh(), 1200);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target, router]);

  if (remaining === null) {
    return (
      <span className={`text-[11px] text-cream-100/50 ${className}`} suppressHydrationWarning>
        {label ? `${label}: ` : ""}…
      </span>
    );
  }

  if (remaining === 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-2.5 py-1 text-[11px] font-semibold text-lime-300 ${className}`}>
        🔓 Открыто — обновляем страницу…
      </span>
    );
  }

  const parts = split(remaining);

  if (compact) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-x-1 text-[11px] text-cream-100/60 ${className}`}>
        {label ? <span className="text-cream-100/45">{label}:</span> : null}
        <span className="font-semibold text-lime-300">
          {parts.days > 0
            ? `${parts.days} ${plural(parts.days, "день", "дня", "дней")} ${String(parts.hours).padStart(2, "0")} ч`
            : `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}:${String(parts.seconds).padStart(2, "0")}`}
        </span>
      </span>
    );
  }

  const cells = [
    { value: parts.days, label: plural(parts.days, "день", "дня", "дней") },
    { value: parts.hours, label: plural(parts.hours, "час", "часа", "часов") },
    { value: parts.minutes, label: plural(parts.minutes, "минута", "минуты", "минут") },
    { value: parts.seconds, label: plural(parts.seconds, "секунда", "секунды", "секунд") },
  ];

  return (
    <div className={className}>
      {label ? (
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-300">{label}</p>
      ) : null}
      <div className="flex flex-wrap gap-1.5" suppressHydrationWarning>
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="min-w-[3.4rem] rounded-xl border border-cream-100/15 bg-pine-950/60 px-2 py-1.5 text-center"
          >
            <p className="font-display text-lg font-bold leading-none text-cream-100">
              {String(cell.value).padStart(2, "0")}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.06em] text-cream-100/40">{cell.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
