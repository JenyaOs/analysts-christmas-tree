"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SummaryItem } from "@/lib/answers";
import { aliasEmoji, formatNumber } from "@/lib/format";
import { LikeButton } from "./LikeButton";
import { SummaryList } from "./SummaryList";

export type Ornament = {
  id: number;
  alias: string;
  likes: number;
  likedByMe: boolean;
  isMine: boolean;
  taskNumber: number;
  taskTitle: string;
  taskSlug: string;
  items: SummaryItem[];
};

const ROWS = [
  { y: 0.28, cap: 3 },
  { y: 0.39, cap: 4 },
  { y: 0.5, cap: 5 },
  { y: 0.61, cap: 6 },
  { y: 0.72, cap: 7 },
  { y: 0.83, cap: 8 },
];

const COLORS = ["#e2607a", "#f0c15a", "#a8e063", "#9ad8e8", "#f6d68a", "#c79ae0", "#7fc79b"];

const SNOWFLAKES = Array.from({ length: 24 }, (_, index) => ({
  left: (index * 37) % 97,
  size: 1.6 + (index % 3) * 1.1,
  delay: -((index * 1.7) % 12),
  duration: 7 + (index % 6) * 1.8,
  opacity: 0.35 + ((index % 4) * 0.15),
}));

type Placed = Ornament & { left: number; top: number; size: number; color: string };

function layoutOrnaments(ornaments: Ornament[]): Placed[] {
  const sorted = [...ornaments].sort((a, b) => b.likes - a.likes || b.id - a.id);
  const result: Placed[] = [];
  let cursor = 0;

  for (const [rowIndex, row] of ROWS.entries()) {
    if (cursor >= sorted.length) break;
    const count = Math.min(row.cap, sorted.length - cursor);
    const halfWidth = 0.05 + 0.3 * row.y;
    for (let i = 0; i < count; i += 1) {
      const ornament = sorted[cursor];
      cursor += 1;
      const position = count === 1 ? 0.5 : i / (count - 1);
      const jitter = ((ornament.id * 37) % 11) / 100 - 0.05;
      const left = 0.5 - halfWidth + position * halfWidth * 2 + jitter * 0.35;
      const top = row.y + (((ornament.id * 17) % 9) / 100 - 0.04) * 0.8;
      const size = Math.min(58, 20 + Math.sqrt(ornament.likes + 1) * 7.5);
      result.push({
        ...ornament,
        left: Math.min(0.94, Math.max(0.06, left)),
        top,
        size,
        color: COLORS[(rowIndex + i + ornament.id) % COLORS.length],
      });
    }
  }

  return result;
}

function Garland({ activity }: { activity: number }) {
  const opacity = 0.28 + activity * 0.65;
  const glow = 3 + activity * 9;
  return (
    <g>
      {[0.36, 0.5, 0.64, 0.78].map((y, index) => {
        const halfWidth = (0.06 + 0.33 * y) * 100;
        const start = 50 - halfWidth;
        const end = 50 + halfWidth;
        const segments = 6;
        const points: Array<{ x: number; y: number }> = [];
        for (let i = 0; i <= segments; i += 1) {
          const t = i / segments;
          points.push({
            x: start + (end - start) * t,
            y: y * 100 + (i % 2 === 0 ? 1.6 : -1.6) + index * 0.1,
          });
        }
        return (
          <g key={y}>
            <polyline
              points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke="#c7ef8a"
              strokeWidth={0.9}
              strokeLinecap="round"
              opacity={opacity}
              className="garland-line"
              style={{ filter: `drop-shadow(0 0 ${glow}px rgba(199,239,138,0.75))` }}
            />
            {points.map((point, pointIndex) => (
              <circle
                key={`${point.x}-${pointIndex}`}
                cx={point.x}
                cy={point.y}
                r={pointIndex % 2 === 0 ? 0.85 : 0.6}
                fill={pointIndex % 3 === 0 ? "#f6d68a" : "#f0c15a"}
                opacity={0.5 + activity * 0.5}
                className="garland-dot"
                style={{
                  filter: `drop-shadow(0 0 ${glow}px rgba(240,193,90,0.8))`,
                  animationDelay: `${(pointIndex * 0.28 + index * 0.4).toFixed(2)}s`,
                  animationDuration: `${(1.8 + (pointIndex % 4) * 0.5).toFixed(2)}s`,
                }}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

const SIZE_CLASS: Record<string, string> = {
  compact: "max-w-[340px] aspect-[4/5]",
  regular: "max-w-[520px] aspect-[4/5]",
  large: "max-w-[680px] aspect-[4/5]",
  full: "w-[min(100%,calc((100svh-230px)*0.8))] min-w-[280px] aspect-[4/5]",
};

export function TreeScene({
  ornaments,
  activity = 0.5,
  compact = false,
  size,
  locked = false,
}: {
  ornaments: Ornament[];
  activity?: number;
  compact?: boolean;
  size?: "compact" | "regular" | "large" | "full";
  locked?: boolean;
}) {
  const [selected, setSelected] = useState<Ornament | null>(null);
  const [lockedHint, setLockedHint] = useState(false);
  const placed = useMemo(() => layoutOrnaments(ornaments), [ornaments]);
  const clipped = placed.length < ornaments.length;
  const sizeClass = SIZE_CLASS[size ?? (compact ? "compact" : "regular")];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
        setLockedHint(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="w-full">
      <div
        className={`relative mx-auto w-full ${sizeClass}`}
        aria-label="Общая виртуальная ёлка"
      >
        <div className="tree-aurora pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true" />
        <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_35%,rgba(168,224,99,0.16),transparent_62%)]" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
          {SNOWFLAKES.map((flake, index) => (
            <span
              key={index}
              className="snowflake"
              style={{
                left: `${flake.left}%`,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration}s`,
              }}
            />
          ))}
        </div>
        <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="tree-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#175c41" />
              <stop offset="60%" stopColor="#0d3d2c" />
              <stop offset="100%" stopColor="#082a20" />
            </linearGradient>
            <linearGradient id="tree-body-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c6b4c" />
              <stop offset="100%" stopColor="#0b3427" />
            </linearGradient>
            <radialGradient id="star-glow">
              <stop offset="0%" stopColor="#f6d68a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f6d68a" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="50" cy="119" rx="30" ry="4" fill="#04140f" opacity="0.7" />
          <circle
            cx="50"
            cy="11"
            r="13"
            className="tree-halo"
            fill="url(#star-glow)"
            opacity={0.4 + activity * 0.5}
          />
          <g className="tree-star" style={{ filter: `drop-shadow(0 0 ${6 + activity * 8}px rgba(246,214,138,0.9))` }}>
            <path d="M50 8 55 23H45Z" fill="#f0c15a" />
            <path d="M50 5.5 51.7 10 56 11 52 13.3 52.7 18 50 15.4 47.3 18 48 13.3 44 11 48.3 10Z" fill="#f6d68a" />
          </g>
          <g className="tree-sway">
            <path d="M50 20 26 52h14L16 84h20L20 104h60L64 84h20L60 52h14Z" fill="url(#tree-body)" stroke="#7fc79b" strokeOpacity="0.18" strokeWidth="0.5" />
            <path d="M50 26 32 52h36Z" fill="url(#tree-body-light)" opacity="0.7" />
            <path d="M50 62 28 84h44Z" fill="url(#tree-body-light)" opacity="0.45" />
            <rect x="46.8" y="102" width="6.4" height="13" rx="1.6" fill="#6b4b2a" />
          </g>
          <Garland activity={activity} />
          {Array.from({ length: 26 }).map((_, index) => {
            const x = (index * 37) % 96 + 2;
            const y = (index * 53) % 108 + 6;
            return <circle key={index} cx={x} cy={y} r={0.35} fill="#fbf7ec" opacity={0.18 + ((index * 7) % 5) / 20} />;
          })}
        </svg>

        {placed.map((ornament) => (
          <button
            key={ornament.id}
            type="button"
            onClick={() => (locked ? setLockedHint(true) : setSelected(ornament))}
            className="ornament-swing group absolute flex items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
            style={{
              left: `${ornament.left * 100}%`,
              top: `${ornament.top * 100}%`,
              width: ornament.size,
              height: ornament.size,
              animationDelay: `${-(ornament.id % 9) * 0.55}s`,
              animationDuration: `${5 + (ornament.id % 5)}s`,
            }}
            title={
              locked
                ? "Читать ответы могут только участники игры"
                : `${ornament.alias} · задание №${ornament.taskNumber} · ${ornament.likes} ♥`
            }
            aria-label={
              locked
                ? "Игрушка участника — читать ответы могут только участники игры"
                : `Ответ ${ornament.alias}, задание ${ornament.taskNumber}, ${ornament.likes} симпатий`
            }
          >
            <span
              className="absolute -top-2 left-1/2 h-2 w-px -translate-x-1/2 bg-gold-300/60"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 rounded-full border border-white/25 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.9)] transition group-hover:scale-110"
              style={{
                background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85), ${ornament.color} 42%, rgba(4,20,15,0.9) 100%)`,
              }}
              aria-hidden="true"
            />
            <span className="ornament-orb" aria-hidden="true" />
            <span className="relative z-10 text-[9px] font-bold text-pine-950/80 drop-shadow-sm">
              {ornament.likes > 0 ? ornament.likes : "♥"}
            </span>
          </button>
        ))}

        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
          {SNOWFLAKES.slice(0, 12).map((flake, index) => (
            <span
              key={`top-${index}`}
              className="snowflake"
              style={{
                left: `${(flake.left + 9) % 98}%`,
                width: flake.size * 0.9,
                height: flake.size * 0.9,
                opacity: 0.5,
                animationDelay: `${flake.delay - 3}s`,
                animationDuration: `${flake.duration + 2}s`,
              }}
            />
          ))}
        </div>

        {placed.length === 0 ? (
          <div className="absolute inset-x-6 bottom-8 rounded-2xl border border-dashed border-lime-300/30 bg-pine-950/70 p-4 text-center text-xs text-cream-100/60">
            Ёлка пока пустая. Отправь первый ответ — и на ней зажжётся первая игрушка!
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-cream-100/45">
        <span>{locked ? "🔒 Ответы открываются участникам игры" : "Размер игрушки — количество лайков"}</span>
        <span className="hidden sm:inline">·</span>
        <span>{formatNumber(ornaments.length)} принятых ответов</span>
        <span className="hidden sm:inline">·</span>
        <span>Гирлянды ярче с общей активностью</span>
        {clipped ? <span>· На ёлке самые любимые ответы</span> : null}
      </div>

      {lockedHint ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-pine-950/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setLockedHint(false)}
        >
          <div
            className="surface-glass animate-pop w-full max-w-sm p-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-4xl" aria-hidden="true">
              🔒🎁
            </p>
            <h3 className="mt-3 text-lg font-bold text-cream-100">Ответы доступны участникам</h3>
            <p className="mt-2 text-xs leading-relaxed text-cream-100/60">
              Ёлку видят все, а игрушки и анонимные ответы — только участники игры. Войди в игровой профиль, чтобы читать
              идеи коллег и ставить лайки.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/me" className="btn-primary !px-4 !py-2 !text-xs" onClick={() => setLockedHint(false)}>
                Войти в игру
              </Link>
              <button
                type="button"
                className="btn-ghost !px-4 !py-2 !text-xs"
                onClick={() => setLockedHint(false)}
              >
                Просто посмотреть
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-pine-950/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="surface animate-rise max-h-[85vh] w-full max-w-lg overflow-y-auto p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-lime-300/70">
                  Задание №{selected.taskNumber} · {selected.taskTitle}
                </p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-cream-100">
                  <span aria-hidden="true">{aliasEmoji(selected.alias)}</span>
                  {selected.alias}
                  {selected.isMine ? <span className="chip chip-gold">это ты</span> : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-cream-100/20 px-2.5 py-1 text-xs text-cream-100/70 hover:border-lime-300/60 hover:text-lime-300"
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <SummaryList items={selected.items} />
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-cream-100/10 pt-4">
              <Link href={`/tasks/${selected.taskSlug}`} className="text-xs text-lime-300 link-underline">
                Открыть задание →
              </Link>
              <LikeButton
                submissionId={selected.id}
                initialLikes={selected.likes}
                initialLiked={selected.likedByMe}
                isMine={selected.isMine}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
