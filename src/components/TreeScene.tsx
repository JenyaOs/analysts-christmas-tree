"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SummaryItem } from "@/lib/answers";
import { aliasEmoji, formatNumber } from "@/lib/format";
import { LikeButton } from "./LikeButton";
import { SummaryList } from "./SummaryList";
import { OrnamentGlyph, taskPalette, TASK_SHAPE_NAMES } from "./ornamentShapes";

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

const CX = 100;

/** Силуэт ёлки: половина ширины на заданной высоте (доли от viewBox). */
const TREE_TOP = 0.155;
const TREE_BOTTOM = 0.9;

function treeHalfWidth(yFrac: number): number {
  const clamped = Math.min(TREE_BOTTOM, Math.max(TREE_TOP, yFrac));
  const t = (clamped - TREE_TOP) / (TREE_BOTTOM - TREE_TOP);
  return 0.028 + Math.pow(t, 0.92) * 0.415;
}

type Tier = { top: number; bottom: number; hw: number; seed: number };

const TIERS: Tier[] = [
  { top: 34, bottom: 74, hw: 22, seed: 11 },
  { top: 56, bottom: 100, hw: 34, seed: 23 },
  { top: 78, bottom: 126, hw: 46, seed: 37 },
  { top: 100, bottom: 152, hw: 58, seed: 41 },
  { top: 122, bottom: 178, hw: 70, seed: 53 },
  { top: 144, bottom: 204, hw: 81, seed: 67 },
  { top: 166, bottom: 232, hw: 92, seed: 79 },
];

function makeRng(seed: number) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/** Ветка-«юбка» с неровным игольчатым краем. */
function tierSilhouette(tier: Tier, scale = 1, lift = 0): string {
  const rnd = makeRng(tier.seed);
  const bottom = tier.bottom - lift;
  const top = tier.top + lift * 0.4;
  const hw = tier.hw * scale;
  const sag = 7 * scale;
  const spikes = 17;

  let path = `M ${CX} ${top} C ${CX - hw * 0.5} ${top + (bottom - top) * 0.3}, ${CX - hw * 0.93} ${bottom - 16}, ${CX - hw} ${bottom - 5}`;

  for (let i = 1; i <= spikes; i += 1) {
    const t = i / spikes;
    const x = CX - hw + 2 * hw * t;
    const droop = Math.sin(Math.PI * t) * sag;
    const spike = i % 2 === 0 ? rnd() * 4.5 : -rnd() * 1.8;
    const y = bottom - 6 + droop + spike;
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  path += ` C ${CX + hw * 0.93} ${bottom - 16}, ${CX + hw * 0.5} ${top + (bottom - top) * 0.3}, ${CX} ${top} Z`;
  return path;
}

function needleStrokes(tier: Tier): string[] {
  const rnd = makeRng(tier.seed + 7);
  const lines: string[] = [];
  const count = Math.round(tier.hw / 3);
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = rnd();
    const y = tier.bottom - 14 - t * (tier.bottom - tier.top) * 0.4;
    const hw = tier.hw * (0.35 + rnd() * 0.5);
    const x = CX + side * hw;
    lines.push(`M ${x.toFixed(1)} ${y.toFixed(1)} l ${(side * -3.4).toFixed(1)} ${(1.8 + rnd() * 1.4).toFixed(1)}`);
  }
  return lines;
}

/** Точки нижней кромки яруса: на них «лежит» снег. */
function tierEdgePoints(tier: Tier): Array<{ x: number; y: number }> {
  const rnd = makeRng(tier.seed + 31);
  const spikes = 17;
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 1; i <= spikes; i += 1) {
    const t = i / spikes;
    const x = CX - tier.hw + 2 * tier.hw * t;
    const droop = Math.sin(Math.PI * t) * 7;
    const spike = i % 2 === 0 ? rnd() * 4.5 : -rnd() * 1.8;
    points.push({ x, y: tier.bottom - 6 + droop + spike });
  }
  return points;
}

const SNOWFLAKES = Array.from({ length: 26 }, (_, index) => ({
  left: (index * 37) % 97,
  size: 1.6 + (index % 3) * 1.1,
  delay: -((index * 1.7) % 12),
  duration: 7 + (index % 6) * 1.8,
  opacity: 0.35 + (index % 4) * 0.15,
}));

const ROWS = [
  { y: 0.3, cap: 2 },
  { y: 0.385, cap: 3 },
  { y: 0.47, cap: 4 },
  { y: 0.555, cap: 5 },
  { y: 0.64, cap: 6 },
  { y: 0.72, cap: 7 },
  { y: 0.8, cap: 7 },
];

type Placed = Ornament & { left: number; top: number; size: number };

function layoutOrnaments(ornaments: Ornament[]): Placed[] {
  const sorted = [...ornaments].sort((a, b) => b.likes - a.likes || b.id - a.id);
  const result: Placed[] = [];
  let cursor = 0;

  for (const row of ROWS) {
    if (cursor >= sorted.length) break;
    const count = Math.min(row.cap, sorted.length - cursor);
    const half = treeHalfWidth(row.y) * 0.86;
    for (let i = 0; i < count; i += 1) {
      const ornament = sorted[cursor];
      cursor += 1;
      const position = count === 1 ? 0.5 : i / (count - 1);
      const jitter = ((ornament.id * 37) % 11) / 100 - 0.05;
      const left = 0.5 - half + position * half * 2 + jitter * 0.06;
      const top = row.y + (((ornament.id * 17) % 9) / 100 - 0.04) * 0.55;
      const size = Math.min(58, 22 + Math.sqrt(ornament.likes + 1) * 6.8);
      result.push({
        ...ornament,
        left: Math.min(0.93, Math.max(0.07, left)),
        top,
        size,
      });
    }
  }

  return result;
}

function Garland({ activity }: { activity: number }) {
  const opacity = 0.3 + activity * 0.6;
  const glow = 3 + activity * 9;

  // Высота гирлянды по всей ёлке
  const levels = [0.16, 0.27, 0.38, 0.49, 0.60, 0.71, 0.82, 0.88];

  return (
    <g>
      {levels.map((y, index) => {
        // Ширина ёлки: viewBox имеет ширину 200
        const hw = treeHalfWidth(y) * 0.95 * 200;
        const start = CX - hw;
        const end = CX + hw;
        const segments = 12;

        const points: Array<{ x: number; y: number }> = [];

        for (let i = 0; i <= segments; i += 1) {
          const t = i / segments;

          points.push({
            x: start + (end - start) * t,
            // Высота SVG — 262, а не 100
            y:
              y * 262 +
              Math.sin(Math.PI * t) * 5 -
              (i % 2 === 0 ? 1 : 0),
          });
        }

        return (
          <g key={y}>
            <polyline
              points={points
                .map(
                  (point) =>
                    `${point.x.toFixed(2)},${point.y.toFixed(2)}`
                )
                .join(" ")}
              fill="none"
              stroke="#d5ffa1"
              strokeWidth={1.2}
              strokeLinecap="round"
              opacity={opacity}
              className="garland-line"
              style={{
                filter: `drop-shadow(0 0 ${glow}px rgba(213,255,161,0.8))`,
              }}
            />

            {points.map((point, pointIndex) => (
              <circle
                key={`${point.x}-${pointIndex}`}
                cx={point.x}
                cy={point.y + 0.6}
                r={pointIndex % 2 === 0 ? 1.1 : 0.8}
                fill={
                  pointIndex % 3 === 0
                    ? "#ffe3a6"
                    : "#ffcb6b"
                }
                opacity={0.55 + activity * 0.45}
                className="garland-dot"
                style={{
                  filter: `drop-shadow(0 0 ${glow}px rgba(255,203,107,0.85))`,
                  animationDelay: `${(
                    pointIndex * 0.28 +
                    index * 0.4
                  ).toFixed(2)}s`,
                  animationDuration: `${(
                    1.8 +
                    (pointIndex % 4) * 0.5
                  ).toFixed(2)}s`,
                }}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}


function RealisticFir({ activity }: { activity: number }) {
  return (
    <svg viewBox="0 0 200 262" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="fir-body" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#1d6b4b" />
          <stop offset="45%" stopColor="#12492f" />
          <stop offset="100%" stopColor="#07281b" />
        </linearGradient>
        <linearGradient id="fir-inner" x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#2c8a5f" />
          <stop offset="100%" stopColor="#165b3d" />
        </linearGradient>
        <linearGradient id="fir-trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6b4526" />
          <stop offset="50%" stopColor="#8a5c33" />
          <stop offset="100%" stopColor="#4c2f18" />
        </linearGradient>
        <linearGradient id="fir-stand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9484f" />
          <stop offset="100%" stopColor="#7d2129" />
        </linearGradient>
        <radialGradient id="fir-ground">
          <stop offset="0%" stopColor="#04120c" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#04120c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="star-glow">
          <stop offset="0%" stopColor="#ffe3a6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffe3a6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fir-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f8f1" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f5f8f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fir-rim" x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="#d5ffa1" stopOpacity="0.32" />
          <stop offset="34%" stopColor="#7fe3b0" stopOpacity="0.12" />
          <stop offset="62%" stopColor="#03100b" stopOpacity="0" />
          <stop offset="100%" stopColor="#03100b" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Тень на полу */}
      <ellipse cx="100" cy="256" rx="72" ry="10" fill="url(#fir-ground)" />

      {/* Подставка-кадка */}
      <path d="M78 240h44l-5 18a6 6 0 0 1-6 5H89a6 6 0 0 1-6-5Z" fill="url(#fir-stand)" />
      <rect x="75" y="236" width="50" height="7" rx="3.5" fill="#e2607a" />
      <rect x="75" y="236" width="50" height="2.4" rx="1.2" fill="#ffe3a6" opacity="0.55" />
      <path d="M84 246c9 2 23 2 32 0" stroke="#ffe3a6" strokeWidth="1.2" opacity="0.35" fill="none" />

      {/* Ствол */}
      <path d="M94 214h12v30h-12Z" fill="url(#fir-trunk)" />
      <path d="M90 236c4-4 6-6 10-7v9Zm20 0c-4-4-6-6-10-7v9Z" fill="#6b4526" opacity="0.8" />

      {/* Ярусы веток: снизу вверх, с тенью и снегом на лапах */}
      {[...TIERS].reverse().map((tier) => (
        <g key={tier.seed}>
          <path d={tierSilhouette(tier, 1.005, -2)} fill="#03100b" opacity="0.45" />
          <path d={tierSilhouette(tier)} fill="url(#fir-body)" />
          <path d={tierSilhouette(tier, 0.82, 8)} fill="url(#fir-inner)" opacity="0.9" />
          <path d={tierSilhouette(tier, 0.55, 18)} fill="url(#fir-inner)" opacity="0.5" />
          <path d={tierSilhouette(tier, 1, 0)} fill="url(#fir-rim)" opacity="0.85" />
          {needleStrokes(tier).map((d, index) => (
            <path key={index} d={d} stroke="#4fae7f" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
          ))}
          {needleStrokes(tier).slice(0, 8).map((d, index) => (
            <path key={`light-${index}`} d={d} stroke="#a9e7c4" strokeWidth="0.55" strokeLinecap="round" opacity="0.26" />
          ))}
          <path d={tierSilhouette(tier, 1, 0)} fill="url(#fir-snow)" opacity="0.32" />
          {tierEdgePoints(tier).map((point, index) =>
            index % 2 === 0 ? (
              <ellipse
                key={`tip-${index}`}
                cx={point.x}
                cy={point.y + 0.2}
                rx={2.1}
                ry={0.8}
                fill="#f5f8f1"
                opacity={0.6}
                transform={`rotate(-12 ${point.x} ${point.y + 0.2})`}
              />
            ) : null,
          )}
        </g>
      ))}

      {/* Блики иголок */}
      {Array.from({ length: 34 }).map((_, index) => {
        const y = 0.2 + ((index * 53) % 74) / 100;
        const hw = treeHalfWidth(y) * 100;
        const side = index % 2 === 0 ? -1 : 1;
        const x = CX + side * hw * (0.3 + ((index * 17) % 60) / 100);
        return (
          <circle key={index} cx={x} cy={y * 100} r={0.45} fill="#d5ffa1" opacity={0.2 + ((index * 7) % 5) / 16} />
        );
      })}

      <Garland activity={activity} />

      {/* Звезда на вершине */}
      <circle cx="100" cy="27" r="17" fill="url(#star-glow)" opacity={0.45 + activity * 0.45} className="tree-halo" />
      <g className="tree-star" style={{ filter: `drop-shadow(0 0 ${7 + activity * 9}px rgba(255,227,166,0.95))` }}>
        <path d="M100 12 104.4 22.6 116 23.5 107 31.2 109.7 42.6 100 36.6 90.3 42.6 93 31.2 84 23.5 95.6 22.6Z" fill="#ffcb6b" />
        <path d="M100 12 104.4 22.6 100 27.4 95.6 22.6Z" fill="#fff6dd" opacity="0.8" />
        <circle cx="100" cy="26" r="2.2" fill="#fff6dd" />
      </g>
    </svg>
  );
}

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

  const sizeClass =
    size === "full"
      ? "w-[min(100%,calc((100svh-230px)*0.8))] min-w-[280px] aspect-[4/5]"
      : size === "large"
        ? "max-w-[680px] aspect-[4/5]"
        : compact || size === "compact"
          ? "max-w-[340px] aspect-[4/5]"
          : "max-w-[520px] aspect-[4/5]";

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
      <div className={`relative mx-auto w-full ${sizeClass}`} aria-label="Общая виртуальная ёлка">
        <div
          className="tree-aurora pointer-events-none absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
          {SNOWFLAKES.slice(0, 14).map((flake, index) => (
            <span
              key={index}
              className="snowflake"
              style={{
                left: `${flake.left}%`,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity * 0.8,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration + 2}s`,
              }}
            />
          ))}
        </div>

        <RealisticFir activity={activity} />

        {/* Игрушки — по форме на каждое задание */}
        {placed.map((ornament) => (
          <button
            key={ornament.id}
            type="button"
            onClick={() => (locked ? setLockedHint(true) : setSelected(ornament))}
            className="ornament-swing group absolute flex items-start justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
            style={{
              left: `${ornament.left * 100}%`,
              top: `${ornament.top * 100}%`,
              width: ornament.size,
              height: ornament.size * 1.15,
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
                : `Ответ ${ornament.alias}, задание ${ornament.taskNumber} (${TASK_SHAPE_NAMES[ornament.taskNumber] ?? "игрушка"}), ${ornament.likes} симпатий`
            }
          >
            <span className="block transition-transform duration-300 group-hover:scale-110">
              <OrnamentGlyph
                taskNumber={ornament.taskNumber}
                id={ornament.id}
                size={ornament.size}
                likes={ornament.likes}
              />
            </span>
            {ornament.likes > 0 ? (
              <span
                className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-pine-950/80 px-1 text-[8px] font-bold leading-none text-cream-100/85 backdrop-blur"
                style={{ minWidth: 12, paddingTop: 1.5, paddingBottom: 1.5 }}
              >
                {ornament.likes}
              </span>
            ) : null}
          </button>
        ))}

        {placed.length === 0 ? (
          <div className="absolute inset-x-6 bottom-8 rounded-2xl border border-dashed border-lime-300/30 bg-pine-950/70 p-4 text-center text-xs text-cream-100/60">
            Ёлка пока пустая. Отправь первый ответ — и на ней зажжётся первая игрушка!
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-cream-100/45">
        <span>{locked ? "🔒 Ответы открываются участникам игры" : "12 форм игрушек — по одной на задание"}</span>
        <span className="hidden sm:inline">·</span>
        <span>Размер зависит от симпатий</span>
        <span className="hidden sm:inline">·</span>
        <span>{formatNumber(ornaments.length)} принятых ответов</span>
        {clipped ? (
          <>
            <span className="hidden sm:inline">·</span>
            <span>На ёлке самые любимые ответы</span>
          </>
        ) : null}
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
              <button type="button" className="btn-ghost !px-4 !py-2 !text-xs" onClick={() => setLockedHint(false)}>
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
              <div className="flex items-start gap-3">
                <span className="shrink-0">
                  <OrnamentGlyph
                    taskNumber={selected.taskNumber}
                    id={selected.id}
                    size={44}
                    likes={selected.likes}
                  />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-lime-300/70">
                    Задание №{selected.taskNumber} · игрушка «{TASK_SHAPE_NAMES[selected.taskNumber] ?? "ёлочная"}»
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-cream-100">
                    <span aria-hidden="true">{aliasEmoji(selected.alias)}</span>
                    {selected.alias}
                    {selected.isMine ? <span className="chip chip-gold">это ты</span> : null}
                  </p>
                  <p className="mt-0.5 text-[11px] text-cream-100/45">{selected.taskTitle}</p>
                </div>
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
