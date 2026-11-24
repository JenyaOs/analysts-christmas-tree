"use server";

import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { likes, participantPrivate, participants, submissions, taskFields, tasks } from "@/db/schema";
import type { Answers } from "@/db/schema";
import { getTaskById, isOrganizer, ORGANIZER_COOKIE, PARTICIPANT_COOKIE, getCurrentParticipant } from "./game";
import { getTaskPhase, validateAnswers, type GameField } from "./answers";
import { formatDateTime } from "./format";
import { ensureSeeded } from "./seed";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

const ALIAS_ADJECTIVES = [
  "Мандариновый",
  "Снежный",
  "Праздничный",
  "Гирляндовый",
  "Хвойный",
  "Мятный",
  "Блестящий",
  "Полярный",
  "Сказочный",
  "Морозный",
  "Искристый",
  "Ледяной",
  "Звёздный",
  "Уютный",
  "Ватрушечный",
];

const ALIAS_NOUNS = [
  "Бэклог",
  "Аналитик",
  "Скрам-мастер",
  "Требователь",
  "Сторителлер",
  "Ресерчер",
  "Валидатор",
  "Снеговик",
  "Эльф",
  "Дедлайн",
  "Спринт",
  "Тестировщик",
  "Архитектор",
  "Медиатор",
  "Интегратор",
];

async function generateAlias(): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const adjective = ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
    const noun = ALIAS_NOUNS[Math.floor(Math.random() * ALIAS_NOUNS.length)];
    const suffix = attempt < 6 ? "" : ` ${Math.floor(Math.random() * 90) + 10}`;
    const candidate = `${adjective} ${noun}${suffix}`;
    const existing = await db.select({ id: participants.id }).from(participants).where(eq(participants.alias, candidate)).limit(1);
    if (existing.length === 0) return candidate;
  }
  return `Новогодний аналитик ${Date.now().toString().slice(-5)}`;
}

export type ActionState = { ok: boolean; message?: string; errors?: Record<string, string> };

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function num(formData: FormData, key: string): number {
  return Number(str(formData, key));
}

export async function joinGameAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await ensureSeeded();
  const privateName = str(formData, "privateName");
  const privateEmail = str(formData, "privateEmail");
  const privateContact = str(formData, "privateContact");
  const team = str(formData, "team");

  if (!privateName) return { ok: false, errors: { privateName: "Укажи имя — его увидит только организатор" } };
  if (privateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(privateEmail)) {
    return { ok: false, errors: { privateEmail: "Похоже, в адресе почты опечатка" } };
  }

  const alias = await generateAlias();
  const [inserted] = await db
    .insert(participants)
    .values({ alias })
    .returning({ id: participants.id });

  await db.insert(participantPrivate).values({
    participantId: inserted.id,
    privateName,
    privateEmail: privateEmail || null,
    privateContact: privateContact || null,
    team: team || null,
  });

  const store = await cookies();
  store.set(PARTICIPANT_COOKIE, String(inserted.id), COOKIE_OPTIONS);
  revalidatePath("/", "layout");
  return { ok: true, message: alias };
}

export async function updatePrivateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentParticipant();
  if (!current) return { ok: false, message: "Сначала зарегистрируйся в игре" };

  const privateName = str(formData, "privateName");
  const privateEmail = str(formData, "privateEmail");
  const privateContact = str(formData, "privateContact");
  const team = str(formData, "team");

  if (!privateName) return { ok: false, errors: { privateName: "Имя не может быть пустым" } };

  await db
    .insert(participantPrivate)
    .values({
      participantId: current.id,
      privateName,
      privateEmail: privateEmail || null,
      privateContact: privateContact || null,
      team: team || null,
    })
    .onConflictDoUpdate({
      target: participantPrivate.participantId,
      set: {
        privateName,
        privateEmail: privateEmail || null,
        privateContact: privateContact || null,
        team: team || null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/me");
  return { ok: true, message: "Приватные данные обновлены. Публичный псевдоним не изменился." };
}

export async function leaveGameAction(): Promise<void> {
  const store = await cookies();
  store.delete(PARTICIPANT_COOKIE);
  revalidatePath("/", "layout");
}

function parseAnswers(raw: string): Answers {
  try {
    const parsed = JSON.parse(raw) as Answers;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function submitAnswerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await getCurrentParticipant();
  if (!current) return { ok: false, message: "Сначала присоединись к игре на странице «Мой профиль»." };

  const taskId = num(formData, "taskId");
  const task = await getTaskById(taskId);
  if (!task) return { ok: false, message: "Задание не найдено." };

  const phase = getTaskPhase({ ...task, publishAt: task.publishAt, closesAt: task.closesAt });
  if (phase !== "open") {
    return {
      ok: false,
      message:
        phase === "upcoming"
          ? `Задание откроется ${formatDateTime(task.publishAt)} по московскому времени. До этого момента приём ответов закрыт.`
          : "Приём ответов по этому заданию уже закрыт.",
    };
  }

  const answers = parseAnswers(str(formData, "answers"));
  const errors = validateAnswers(task.fields, answers);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Проверь выделенные поля — и снова отправь ответ." };
  }

  const status = task.moderationEnabled ? "pending" : "approved";
  await db
    .insert(submissions)
    .values({
      taskId,
      participantId: current.id,
      answers,
      status,
      moderatedAt: task.moderationEnabled ? null : new Date(),
    })
    .onConflictDoUpdate({
      target: [submissions.taskId, submissions.participantId],
      set: {
        answers,
        status,
        moderationNote: null,
        createdAt: new Date(),
        moderatedAt: task.moderationEnabled ? null : new Date(),
      },
    });

  revalidatePath(`/tasks/${task.slug}`);
  revalidatePath("/me");
  revalidatePath("/tree");
  revalidatePath("/ratings");
  revalidatePath("/admin/moderation");
  return {
    ok: true,
    message: "Отлично! Ещё одна игрушка отправляется на нашу общую ёлку!",
  };
}

export type LikeResult = { ok: boolean; likes: number; liked: boolean; message?: string };

export async function toggleLikeAction(submissionId: number): Promise<LikeResult> {
  const current = await getCurrentParticipant();
  if (!current) return { ok: false, likes: 0, liked: false, message: "Лайкать могут участники игры. Присоединяйся!" };

  const [submission] = await db
    .select({ id: submissions.id, participantId: submissions.participantId, status: submissions.status, taskId: submissions.taskId })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission || submission.status !== "approved") {
    return { ok: false, likes: 0, liked: false, message: "Этот ответ пока не опубликован." };
  }
  if (submission.participantId === current.id) {
    return { ok: false, likes: 0, liked: false, message: "За свой ответ лайк поставить нельзя 🙂" };
  }

  const existing = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.submissionId, submissionId), eq(likes.participantId, current.id)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(likes).where(eq(likes.id, existing[0].id));
  } else {
    await db.insert(likes).values({ submissionId, participantId: current.id }).onConflictDoNothing();
  }

  const [countRow] = await db.select({ value: sql<number>`count(*)::int` }).from(likes).where(eq(likes.submissionId, submissionId));
  revalidatePath("/tree");
  revalidatePath("/feed");
  revalidatePath("/ratings");
  revalidatePath(`/tasks/${submission.taskId}`);
  return { ok: true, likes: Number(countRow?.value ?? 0), liked: existing.length === 0 };
}

/* ---------- Администрирование ---------- */

async function requireOrganizer(): Promise<void> {
  if (!(await isOrganizer())) throw new Error("Недостаточно прав: требуется вход организатора");
}

function organizerCode(): string {
  return process.env.ADMIN_CODE || "elka2026";
}

export async function organizerLoginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const code = str(formData, "code");
  if (code !== organizerCode()) return { ok: false, message: "Неверный код организатора" };
  const store = await cookies();
  store.set(ORGANIZER_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Добро пожаловать в панель организатора" };
}

export async function organizerLogoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(ORGANIZER_COOKIE);
  revalidatePath("/admin", "layout");
}

const ISO_FALLBACK = "2026-12-25T21:00:00.000Z";

function parseMskDateTime(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(`${value}:00+03:00`);
  const parsed = new Date(value || ISO_FALLBACK);
  return Number.isNaN(parsed.getTime()) ? new Date(ISO_FALLBACK) : parsed;
}

export async function updateTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireOrganizer();
  const id = num(formData, "taskId");
  if (!Number.isFinite(id)) return { ok: false, message: "Задание не найдено" };

  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Название задания обязательно" };

  const publishAt = str(formData, "publishAt");
  const closesAt = str(formData, "closesAt");

  await db
    .update(tasks)
    .set({
      title,
      tool: str(formData, "tool") || null,
      description: str(formData, "description"),
      example: str(formData, "example") || null,
      dateLabel: str(formData, "dateLabel") || null,
      week: num(formData, "week") || 1,
      weekTitle: str(formData, "weekTitle") || null,
      publishAt: parseMskDateTime(publishAt),
      closesAt: parseMskDateTime(closesAt),
      manualState: str(formData, "manualState") || "auto",
      isPublished: formData.get("isPublished") === "on",
      moderationEnabled: formData.get("moderationEnabled") === "on",
      points: num(formData, "points") || 10,
    })
    .where(eq(tasks.id, id));

  revalidatePath("/", "layout");
  revalidatePath(`/admin/tasks/${id}`);
  return { ok: true, message: "Настройки задания сохранены" };
}

function parseCondition(formData: FormData) {
  const fieldKey = str(formData, "conditionField");
  const op = str(formData, "conditionOp");
  const valuesRaw = str(formData, "conditionValues");
  if (!fieldKey || !op || (op !== "answered" && !valuesRaw)) return null;
  return {
    fieldKey,
    op: op as "equals" | "notEquals" | "includes" | "notIncludes" | "answered",
    values: valuesRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

const ALLOWED_TYPES = ["text", "textarea", "radio", "checkbox", "rating", "checklist", "date", "url", "cards"] as const;

function parseCardFields(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [labelPart, typePart, requiredPart, optionsPart] = line.split("|").map((part) => part.trim());
      const type = (ALLOWED_TYPES as readonly string[]).includes(typePart) ? (typePart as GameField["type"]) : "text";
      return {
        key: `card_${index + 1}`,
        label: labelPart || `Поле ${index + 1}`,
        type,
        required: requiredPart === "required",
        options: optionsPart ? optionsPart.split(";").map((option) => option.trim()).filter(Boolean) : [],
      };
    });
}

async function fieldPayload(formData: FormData) {
  const typeRaw = str(formData, "type");
  const type = (ALLOWED_TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as GameField["type"]) : "text";
  const options = str(formData, "options")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    label: str(formData, "label"),
    key: str(formData, "key"),
    type,
    required: formData.get("required") === "on",
    groupLabel: str(formData, "groupLabel") || null,
    placeholder: str(formData, "placeholder") || null,
    helpText: str(formData, "helpText") || null,
    options,
    condition: parseCondition(formData),
    cardFields: parseCardFields(str(formData, "cardFields")),
    minCards: num(formData, "minCards") || 1,
    maxCards: num(formData, "maxCards") || 5,
    numberMin: num(formData, "numberMin") || 1,
    numberMax: num(formData, "numberMax") || 10,
    publish: formData.get("publish") === "on",
  };
}

export async function createFieldAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireOrganizer();
  const taskId = num(formData, "taskId");
  const payload = await fieldPayload(formData);
  if (!payload.label) return { ok: false, message: "Укажи название поля" };
  if (!payload.key) return { ok: false, message: "Укажи системный ключ поля (латиницей)" };
  if (!/^[a-z0-9_]+$/.test(payload.key)) return { ok: false, message: "Ключ может содержать только латиницу, цифры и _" };

  const [maxRow] = await db
    .select({ value: sql<number>`coalesce(max(${taskFields.sortOrder}), 0)::int` })
    .from(taskFields)
    .where(eq(taskFields.taskId, taskId));

  try {
    await db.insert(taskFields).values({ taskId, ...payload, sortOrder: Number(maxRow?.value ?? 0) + 1 });
  } catch {
    return { ok: false, message: "Поле с таким ключом уже существует в этом задании" };
  }

  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/tasks");
  return { ok: true, message: "Поле добавлено" };
}

export async function updateFieldAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireOrganizer();
  const fieldId = num(formData, "fieldId");
  const taskId = num(formData, "taskId");
  const payload = await fieldPayload(formData);
  if (!payload.label) return { ok: false, message: "Укажи название поля" };

  await db
    .update(taskFields)
    .set({ ...payload, key: payload.key || undefined })
    .where(and(eq(taskFields.id, fieldId), eq(taskFields.taskId, taskId)));

  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/tasks");
  return { ok: true, message: "Поле обновлено" };
}

export async function deleteFieldAction(formData: FormData): Promise<void> {
  await requireOrganizer();
  const fieldId = num(formData, "fieldId");
  const taskId = num(formData, "taskId");
  await db.delete(taskFields).where(and(eq(taskFields.id, fieldId), eq(taskFields.taskId, taskId)));
  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/tasks");
}

export async function moveFieldAction(formData: FormData): Promise<void> {
  await requireOrganizer();
  const fieldId = num(formData, "fieldId");
  const taskId = num(formData, "taskId");
  const direction = str(formData, "direction");
  const rows = await db
    .select({ id: taskFields.id, sortOrder: taskFields.sortOrder })
    .from(taskFields)
    .where(eq(taskFields.taskId, taskId))
    .orderBy(taskFields.sortOrder, taskFields.id);
  const index = rows.findIndex((row) => row.id === fieldId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= rows.length) return;

  await db.update(taskFields).set({ sortOrder: swapWith }).where(eq(taskFields.id, rows[index].id));
  await db.update(taskFields).set({ sortOrder: index }).where(eq(taskFields.id, rows[swapWith].id));
  revalidatePath(`/admin/tasks/${taskId}`);
}

export async function moderateSubmissionAction(formData: FormData): Promise<void> {
  await requireOrganizer();
  const id = num(formData, "submissionId");
  const decision = str(formData, "decision");
  const note = str(formData, "note");

  if (decision === "delete") {
    await db.delete(submissions).where(eq(submissions.id, id));
  } else if (decision === "approve" || decision === "reject" || decision === "pending") {
    const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "pending";
    await db
      .update(submissions)
      .set({ status, moderationNote: note || null, moderatedAt: status === "pending" ? null : new Date() })
      .where(eq(submissions.id, id));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/tree");
  revalidatePath("/feed");
  revalidatePath("/ratings");
  revalidatePath("/me");
}

export async function setTaskStateAction(formData: FormData): Promise<void> {
  await requireOrganizer();
  const id = num(formData, "taskId");
  const state = str(formData, "state");
  if (!["auto", "open", "closed"].includes(state)) return;
  await db.update(tasks).set({ manualState: state }).where(eq(tasks.id, id));
  revalidatePath("/", "layout");
  revalidatePath(`/admin/tasks/${id}`);
}

export async function toggleTaskPublishedAction(formData: FormData): Promise<void> {
  await requireOrganizer();
  const id = num(formData, "taskId");
  const [row] = await db.select({ isPublished: tasks.isPublished }).from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!row) return;
  await db.update(tasks).set({ isPublished: !row.isPublished }).where(eq(tasks.id, id));
  revalidatePath("/", "layout");
  revalidatePath(`/admin/tasks/${id}`);
}
