const MSK = "Europe/Moscow";

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MSK,
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: MSK,
  }).format(new Date(iso));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

const EMOJIS = ["🎄", "🔔", "⭐", "❄️", "🎁", "🦌", "🕯️", "🍬", "🧦", "✨", "🛷", "☃️"];

export function aliasEmoji(alias: string): string {
  let hash = 0;
  for (let i = 0; i < alias.length; i += 1) hash = (hash * 31 + alias.charCodeAt(i)) % 100000;
  return EMOJIS[hash % EMOJIS.length];
}

export function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
