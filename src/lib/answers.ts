import type { AnswerValue, Answers, CardField, CardValue, FieldCondition, FieldType } from "@/db/schema";

export type GameField = {
  id: number;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  groupLabel: string | null;
  placeholder: string | null;
  helpText: string | null;
  options: string[];
  condition: FieldCondition | null;
  cardFields: CardField[];
  minCards: number;
  maxCards: number;
  numberMin: number;
  numberMax: number;
  publish: boolean;
  sortOrder: number;
};

export type GameTask = {
  id: number;
  number: number;
  slug: string;
  title: string;
  week: number;
  weekTitle: string | null;
  tool: string | null;
  description: string;
  example: string | null;
  dateLabel: string | null;
  publishAt: string;
  closesAt: string;
  isPublished: boolean;
  manualState: string;
  moderationEnabled: boolean;
  points: number;
  fields: GameField[];
};

export type TaskPhase = "draft" | "upcoming" | "open" | "closed";

export function getTaskPhase(
  task: { isPublished: boolean; manualState: string; publishAt: string; closesAt: string },
  now: Date = new Date(),
): TaskPhase {
  if (!task.isPublished) return "draft";
  if (task.manualState === "closed") return "closed";
  if (new Date(task.closesAt).getTime() < now.getTime()) return "closed";
  if (task.manualState === "open") return "open";
  if (new Date(task.publishAt).getTime() > now.getTime()) return "upcoming";
  return "open";
}

export const PHASE_LABELS: Record<TaskPhase, string> = {
  draft: "Черновик",
  upcoming: "Закрыто до даты",
  open: "Приём ответов открыт",
  closed: "Приём ответов закрыт",
};

/** Дата открытия по московскому календарю (00:00 МСК). */
export function openingMoment(task: { publishAt: string }): Date {
  return new Date(task.publishAt);
}

export function isLockedUntilOpen(task: { publishAt: string; manualState: string }, now: Date = new Date()): boolean {
  if (task.manualState === "open") return false;
  return openingMoment(task).getTime() > now.getTime();
}

export function conditionMet(condition: FieldCondition | null, answers: Answers): boolean {
  if (!condition) return true;
  const raw = answers[condition.fieldKey];
  const values = condition.values ?? [];

  if (condition.op === "answered") {
    if (Array.isArray(raw)) return raw.length > 0;
    return raw !== undefined && raw !== null && String(raw).trim() !== "";
  }

  if (condition.op === "equals") return values.includes(String(raw ?? ""));
  if (condition.op === "notEquals") return !values.includes(String(raw ?? ""));

  const list = Array.isArray(raw) ? raw.map((item) => (typeof item === "string" ? item : "")) : [String(raw ?? "")];
  if (condition.op === "includes") return values.some((value) => list.includes(value));
  if (condition.op === "notIncludes") return !values.some((value) => list.includes(value));
  return true;
}

export function isFieldVisible(field: GameField, answers: Answers): boolean {
  return conditionMet(field.condition, answers);
}

export function validateField(field: GameField, value: AnswerValue): string | null {
  if (field.type === "cards") {
    const cards = Array.isArray(value) ? (value as CardValue[]) : [];
    const filled = cards.filter((card) => card && Object.values(card).some((entry) => String(entry ?? "").trim() !== ""));
    if (filled.length < field.minCards) return `Заполни минимум ${field.minCards} карточки`;
    for (const [index, card] of cards.entries()) {
      if (!card) continue;
      for (const cardField of field.cardFields) {
        const entry = String(card[cardField.key] ?? "").trim();
        if (cardField.required && !entry) return `Карточка ${index + 1}: заполни «${cardField.label}»`;
        if (cardField.type === "radio" && entry && cardField.options && !cardField.options.includes(entry)) {
          return `Карточка ${index + 1}: недопустимый вариант в «${cardField.label}»`;
        }
      }
    }
    return null;
  }

  if (field.type === "checkbox" || field.type === "checklist") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    if (field.required && list.length === 0) return "Выбери хотя бы один вариант";
    return null;
  }

  if (field.type === "rating") {
    if (value === null || value === undefined || value === "") {
      return field.required ? "Поставь оценку" : null;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < field.numberMin || numeric > field.numberMax) {
      return `Оценка должна быть от ${field.numberMin} до ${field.numberMax}`;
    }
    return null;
  }

  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (field.required && !text) return "Поле обязательно для заполнения";
  if (field.type === "radio" && text && field.options.length > 0 && !field.options.includes(text)) {
    return "Выбери вариант из списка";
  }
  if (field.type === "url" && text && !/^https?:\/\/.+/i.test(text)) return "Ссылка должна начинаться с http:// или https://";
  return null;
}

export function validateAnswers(fields: GameField[], answers: Answers): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!isFieldVisible(field, answers)) continue;
    const error = validateField(field, answers[field.key] ?? null);
    if (error) errors[field.key] = error;
  }
  return errors;
}

export type SummaryItem = {
  key: string;
  label: string;
  kind: "text" | "list" | "rating" | "cards";
  text?: string;
  list?: string[];
  cards?: Array<{ title: string; lines: string[] }>;
};

/** Готовит публичное представление ответа: без скрытых полей и персональных данных. */
export function summarizeAnswers(fields: GameField[], answers: Answers, limited = true): SummaryItem[] {
  const ordered = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const items: SummaryItem[] = [];

  for (const field of ordered) {
    if (!field.publish) continue;
    if (!isFieldVisible(field, answers)) continue;
    const value = answers[field.key];
    if (value === undefined || value === null || value === "") continue;

    if (field.type === "cards") {
      const cards = (Array.isArray(value) ? value : []) as CardValue[];
      const rendered = cards
        .filter((card) => card && Object.values(card).some((entry) => String(entry ?? "").trim() !== ""))
        .map((card, index) => {
          const title =
            String(card[field.cardFields[0]?.key ?? "title"] ?? "").trim() || `Карточка ${index + 1}`;
          const lines = field.cardFields
            .slice(1)
            .map((cardField) => {
              const entry = String(card[cardField.key] ?? "").trim();
              return entry ? `${cardField.label}: ${entry}` : "";
            })
            .filter(Boolean);
          return { title, lines };
        });
      if (rendered.length > 0) items.push({ key: field.key, label: field.label, kind: "cards", cards: rendered });
      continue;
    }

    if (field.type === "checkbox" || field.type === "checklist") {
      const list = (Array.isArray(value) ? value : [value]).map((entry) => String(entry)).filter(Boolean);
      if (list.length > 0) items.push({ key: field.key, label: field.label, kind: "list", list });
      continue;
    }

    if (field.type === "rating") {
      items.push({ key: field.key, label: field.label, kind: "rating", text: String(value) });
      continue;
    }

    const text = String(value).trim();
    if (!text) continue;
    items.push({
      key: field.key,
      label: field.label,
      kind: "text",
      text: limited && text.length > 420 ? `${text.slice(0, 420)}…` : text,
    });
  }

  return items;
}

export function emptyAnswers(fields: GameField[]): Answers {
  const answers: Answers = {};
  for (const field of fields) {
    if (field.type === "cards") {
      const count = Math.max(field.minCards, 1);
      answers[field.key] = Array.from({ length: count }, () => ({}));
    } else if (field.type === "checkbox" || field.type === "checklist") {
      answers[field.key] = [];
    } else {
      answers[field.key] = "";
    }
  }
  return answers;
}
