import type { ReactNode } from "react";

export type Palette = { light: string; main: string; dark: string; accent: string };

/** Форма игрушки закреплена за номером задания: 12 заданий — 12 форм. */
const PALETTES: Record<number, Palette> = {
  1: { light: "#ffe9b8", main: "#f2c268", dark: "#a97b2a", accent: "#fff6dd" }, // письмо
  2: { light: "#ffb3c8", main: "#e7597f", dark: "#94223f", accent: "#ffe3ea" }, // кольца
  3: { light: "#ffe6a8", main: "#f0c04b", dark: "#9b6e17", accent: "#fff8e0" }, // колокольчик
  4: { light: "#e2ffb0", main: "#a8e063", dark: "#4d7a24", accent: "#f4ffe2" }, // звезда
  5: { light: "#c3e3f5", main: "#6aa9c9", dark: "#2c5a72", accent: "#eaf7ff" }, // шестерёнка
  6: { light: "#e2c7ff", main: "#a97ce8", dark: "#5a2f8f", accent: "#f5eaff" }, // кристалл
  7: { light: "#ffb3a7", main: "#e2553f", dark: "#8a2318", accent: "#ffe3dd" }, // баг
  8: { light: "#a9f0d5", main: "#43b98d", dark: "#155e45", accent: "#e2fff3" }, // подарок
  9: { light: "#bcd6ff", main: "#5b86d6", dark: "#233f78", accent: "#eaf1ff" }, // книга
  10: { light: "#ffd0a3", main: "#ea8a3c", dark: "#91470f", accent: "#fff0e0" }, // флажок
  11: { light: "#ffc2da", main: "#f0538c", dark: "#8f1746", accent: "#ffe6f0" }, // сердце
  12: { light: "#d3f4ff", main: "#7fd3ef", dark: "#2b7288", accent: "#f0fcff" }, // снежинка
};

export function taskPalette(taskNumber: number): Palette {
  return PALETTES[((taskNumber - 1) % 12) + 1] ?? PALETTES[1];
}

export const TASK_SHAPE_NAMES: Record<number, string> = {
  1: "письмо",
  2: "кольца",
  3: "колокольчик",
  4: "звезда",
  5: "шестерёнка",
  6: "кристалл",
  7: "баг",
  8: "подарок",
  9: "книга",
  10: "флажок",
  11: "сердце",
  12: "снежинка",
};

function Star({ fill, accent }: { fill: string; accent: string }) {
  return (
    <>
      <path
        d="M20 7.5 23.4 16.2 32.8 16.8 25.7 22.8 28 31.9 20 27 12 31.9 14.3 22.8 7.2 16.8 16.6 16.2Z"
        fill={fill}
      />
      <path d="M20 7.5 23.4 16.2 20 20 16.6 16.2Z" fill={accent} opacity="0.55" />
      <path d="M20 20 25.7 22.8 20 27 14.3 22.8Z" fill="#000" opacity="0.12" />
    </>
  );
}

export function OrnamentGlyph({
  taskNumber,
  id,
  size,
  likes,
}: {
  taskNumber: number;
  id: number;
  size: number;
  likes: number;
}): ReactNode {
  const p = taskPalette(taskNumber);
  const gradId = `orn-grad-${id}`;
  const glow = 6 + Math.min(14, Math.sqrt(likes + 1) * 2.4);

  const glyph = (() => {
    switch (taskNumber) {
      case 1:
        return (
          <>
            <rect x="5" y="10" width="30" height="22" rx="3.5" fill={`url(#${gradId})`} />
            <path d="M6 12 20 22 34 12" fill="none" stroke={p.dark} strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 31 15.5 21M34 31 24.5 21" stroke={p.dark} strokeWidth="1.2" opacity="0.7" />
            <circle cx="20" cy="25.5" r="3" fill={p.accent} />
            <circle cx="20" cy="25.5" r="1.2" fill={p.dark} opacity="0.45" />
          </>
        );
      case 2:
        return (
          <>
            <circle cx="20" cy="21" r="14" fill={`url(#${gradId})`} />
            <circle cx="20" cy="21" r="14" fill="none" stroke={p.dark} strokeWidth="1" opacity="0.5" />
            <circle cx="20" cy="21" r="9" fill="none" stroke={p.accent} strokeWidth="1.6" opacity="0.85" />
            <circle cx="20" cy="21" r="4.2" fill={p.accent} opacity="0.9" />
            <path d="M10 14a12 12 0 0 1 7-4" stroke="#fff" strokeWidth="1.6" opacity="0.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 3:
        return (
          <>
            <rect x="17.6" y="4.5" width="4.8" height="5" rx="2.4" fill={p.dark} />
            <path d="M20 8c-6.6 0-9 5.6-9.4 11.4-.1 1.9-.6 3.4-1.6 4.8h22c-1-1.4-1.5-2.9-1.6-4.8C29 13.6 26.6 8 20 8Z" fill={`url(#${gradId})`} />
            <rect x="7.6" y="24.2" width="24.8" height="3.2" rx="1.6" fill={p.accent} opacity="0.9" />
            <path d="M13 12.5c1.3-2.4 3.4-3.6 5.6-3.9" stroke="#fff" strokeWidth="1.5" opacity="0.45" fill="none" strokeLinecap="round" />
            <circle cx="20" cy="31.6" r="3.4" fill={p.dark} />
          </>
        );
      case 4:
        return <Star fill={`url(#${gradId})`} accent={p.accent} />;
      case 5:
        return (
          <>
            <g fill={`url(#${gradId})`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <rect
                  key={index}
                  x="17.4"
                  y="2.5"
                  width="5.2"
                  height="7"
                  rx="1.6"
                  transform={`rotate(${index * 45} 20 21)`}
                />
              ))}
              <circle cx="20" cy="21" r="11.6" />
            </g>
            <circle cx="20" cy="21" r="5.2" fill={p.dark} opacity="0.55" />
            <circle cx="20" cy="21" r="2.4" fill={p.accent} opacity="0.8" />
            <path d="M12 16a9 9 0 0 1 5-4" stroke="#fff" strokeWidth="1.4" opacity="0.45" fill="none" strokeLinecap="round" />
          </>
        );
      case 6:
        return (
          <>
            <path d="M20 5.5 32.5 13v16L20 36.5 7.5 29V13Z" fill={`url(#${gradId})`} />
            <path d="M20 5.5 20 36.5M7.5 13 20 21l12.5-8" stroke={p.accent} strokeWidth="1.1" opacity="0.55" fill="none" />
            <path d="M20 5.5 32.5 13 20 21 7.5 13Z" fill="#fff" opacity="0.18" />
            <path d="M7.5 29 20 21l12.5 8L20 36.5Z" fill={p.dark} opacity="0.28" />
          </>
        );
      case 7:
        return (
          <>
            <ellipse cx="20" cy="23" rx="12.5" ry="13.5" fill={`url(#${gradId})`} />
            <path d="M20 10v26" stroke={p.dark} strokeWidth="1.4" opacity="0.8" />
            <path d="M8 23h24" stroke={p.dark} strokeWidth="1" opacity="0.35" />
            <circle cx="20" cy="8.5" r="4.6" fill={p.dark} />
            <path d="M16.4 5.2 14 2.2M23.6 5.2 26 2.2" stroke={p.dark} strokeWidth="1.4" strokeLinecap="round" />
            <g fill={p.accent} opacity="0.9">
              <circle cx="14" cy="18" r="2.1" />
              <circle cx="26" cy="18" r="2.1" />
              <circle cx="14.5" cy="27" r="1.8" />
              <circle cx="25.5" cy="27" r="1.8" />
            </g>
          </>
        );
      case 8:
        return (
          <>
            <rect x="6" y="15" width="28" height="20" rx="2.5" fill={`url(#${gradId})`} />
            <rect x="4.5" y="10.5" width="31" height="6.5" rx="2" fill={p.light} />
            <rect x="17" y="10.5" width="6" height="24.5" fill={p.accent} opacity="0.9" />
            <path d="M20 11c-3.4-4.4-8-5.2-8-1.6 0 2.1 4.4 2.6 8 1.6Zm0 0c3.4-4.4 8-5.2 8-1.6 0 2.1-4.4 2.6-8 1.6Z" fill={p.accent} />
            <path d="M20 11c-3.4-4.4-8-5.2-8-1.6" stroke={p.dark} strokeWidth="0.9" fill="none" opacity="0.45" />
            <path d="M8 17v16" stroke="#fff" strokeWidth="1.6" opacity="0.22" strokeLinecap="round" />
          </>
        );
      case 9:
        return (
          <>
            <path d="M20 11c-3.2-2.6-7.4-3.4-12-3v22c4.6-.4 8.8.4 12 3Z" fill={`url(#${gradId})`} />
            <path d="M20 11c3.2-2.6 7.4-3.4 12-3v22c-4.6-.4-8.8.4-12 3Z" fill={p.light} opacity="0.92" />
            <path d="M20 11v21" stroke={p.dark} strokeWidth="1.4" opacity="0.8" />
            <g stroke={p.dark} strokeWidth="1" opacity="0.45" strokeLinecap="round">
              <path d="M11 14.5h6M11 18.5h6M11 22.5h6" />
              <path d="M23 14.5h6M23 18.5h6M23 22.5h6" />
            </g>
            <path d="M8 30c4-.3 7.6.2 10.5 2" stroke={p.accent} strokeWidth="1.2" fill="none" opacity="0.6" />
          </>
        );
      case 10:
        return (
          <>
            <path d="M9 6v30" stroke={p.dark} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M9 8h23l-5.5 7 5.5 7H9Z" fill={`url(#${gradId})`} />
            <path d="M9 8h23l-5.5 7 5.5 7H9Z" fill="none" stroke={p.dark} strokeWidth="0.8" opacity="0.4" />
            <circle cx="9" cy="6" r="2.4" fill={p.accent} />
            <path d="M13 11h11l-2.6 3.4H13Z" fill="#fff" opacity="0.25" />
          </>
        );
      case 11:
        return (
          <>
            <path
              d="M20 34S5.5 25.2 5.5 16.4C5.5 11 9.6 7.5 14 7.5c2.6 0 4.8 1.2 6 3.1 1.2-1.9 3.4-3.1 6-3.1 4.4 0 8.5 3.5 8.5 8.9C34.5 25.2 20 34 20 34Z"
              fill={`url(#${gradId})`}
            />
            <path d="M12 12c1.6-1.6 4.4-1.9 6.2-.4" stroke="#fff" strokeWidth="1.8" opacity="0.45" fill="none" strokeLinecap="round" />
            <ellipse cx="26" cy="15" rx="3" ry="2" fill="#fff" opacity="0.2" transform="rotate(-25 26 15)" />
          </>
        );
      default:
        return (
          <>
            <g stroke={`url(#${gradId})`} strokeWidth="3.2" strokeLinecap="round">
              {Array.from({ length: 6 }).map((_, index) => (
                <line key={index} x1="20" y1="21" x2="20" y2="5" transform={`rotate(${index * 60} 20 21)`} />
              ))}
            </g>
            <g stroke={p.accent} strokeWidth="1.7" strokeLinecap="round" opacity="1">
              {Array.from({ length: 6 }).map((_, index) => (
                <g key={index} transform={`rotate(${index * 60} 20 21)`}>
                  <line x1="20" y1="10" x2="16" y2="6.5" />
                  <line x1="20" y1="10" x2="24" y2="6.5" />
                  <line x1="20" y1="16.5" x2="16.4" y2="13.4" />
                  <line x1="20" y1="16.5" x2="23.6" y2="13.4" />
                </g>
              ))}
            </g>
            <circle cx="20" cy="21" r="4" fill={p.accent} />
            <circle cx="20" cy="21" r="1.6" fill={p.dark} opacity="0.6" />
          </>
        );
    }
  })();

  return (
    <svg
      viewBox="0 0 40 46"
      width={size}
      height={size * 1.15}
      aria-hidden="true"
      style={{ filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.55)) drop-shadow(0 0 ${glow}px ${p.main}66)` }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="55%" stopColor={p.main} />
          <stop offset="100%" stopColor={p.dark} />
        </linearGradient>
      </defs>
      <line x1="20" y1="0" x2="20" y2="6" stroke="#ffe3a6" strokeWidth="1" opacity="0.55" />
      <rect x="17.6" y="4.6" width="4.8" height="3.4" rx="1.4" fill="#ffcb6b" opacity="0.9" />
      <g transform="translate(0 2)">{glyph}</g>
      {![4, 12].includes(taskNumber) ? (
        <ellipse cx="16.5" cy="12" rx="3.2" ry="2" fill="#fff" opacity="0.2" transform="rotate(-25 16.5 12)" />
      ) : null}
    </svg>
  );
}
