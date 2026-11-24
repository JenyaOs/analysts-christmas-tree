import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { likes, participantPrivate, participants, submissions, taskFields, tasks } from "@/db/schema";
import type { Answers } from "@/db/schema";
import { summarizeAnswers, type GameField, type GameTask, type SummaryItem } from "./answers";
import { toIso } from "./format";
import { ensureSeeded } from "./seed";

export const PARTICIPANT_COOKIE = "elka_participant";
export const ORGANIZER_COOKIE = "elka_organizer";

export type Participant = {
  id: number;
  alias: string;
  privateName: string | null;
  privateEmail: string | null;
  privateContact: string | null;
  team: string | null;
  isOrganizer: boolean;
  createdAt: string;
};

type PrivateRow = typeof participantPrivate.$inferSelect;

function mapParticipant(row: typeof participants.$inferSelect, priv?: PrivateRow | null): Participant {
  return {
    id: row.id,
    alias: row.alias,
    privateName: priv?.privateName ?? null,
    privateEmail: priv?.privateEmail ?? null,
    privateContact: priv?.privateContact ?? null,
    team: priv?.team ?? null,
    isOrganizer: row.isOrganizer,
    createdAt: toIso(row.createdAt),
  };
}

function mapField(row: typeof taskFields.$inferSelect): GameField {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    type: row.type,
    required: row.required,
    groupLabel: row.groupLabel,
    placeholder: row.placeholder,
    helpText: row.helpText,
    options: row.options ?? [],
    condition: row.condition ?? null,
    cardFields: row.cardFields ?? [],
    minCards: row.minCards ?? 1,
    maxCards: row.maxCards ?? 5,
    numberMin: row.numberMin ?? 1,
    numberMax: row.numberMax ?? 10,
    publish: row.publish,
    sortOrder: row.sortOrder,
  };
}

export async function getCurrentParticipant(): Promise<Participant | null> {
  const store = await cookies();
  const raw = store.get(PARTICIPANT_COOKIE)?.value;
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  const rows = await db
    .select({ participant: participants, priv: participantPrivate })
    .from(participants)
    .leftJoin(participantPrivate, eq(participantPrivate.participantId, participants.id))
    .where(eq(participants.id, id))
    .limit(1);
  return rows[0] ? mapParticipant(rows[0].participant, rows[0].priv) : null;
}

export async function isOrganizer(): Promise<boolean> {
  const store = await cookies();
  return store.get(ORGANIZER_COOKIE)?.value === "1";
}

export async function getAllTasks(options: { includeUnpublished?: boolean } = {}): Promise<GameTask[]> {
  await ensureSeeded();
  const taskRows = await db
    .select()
    .from(tasks)
    .where(options.includeUnpublished ? undefined : eq(tasks.isPublished, true))
    .orderBy(asc(tasks.sortOrder), asc(tasks.number));

  const fieldRows = await db.select().from(taskFields).orderBy(asc(taskFields.sortOrder), asc(taskFields.id));
  const fieldsByTask = new Map<number, GameField[]>();
  for (const row of fieldRows) {
    const list = fieldsByTask.get(row.taskId) ?? [];
    list.push(mapField(row));
    fieldsByTask.set(row.taskId, list);
  }

  return taskRows.map((row) => ({
    id: row.id,
    number: row.number,
    slug: row.slug,
    title: row.title,
    week: row.week,
    weekTitle: row.weekTitle,
    tool: row.tool,
    description: row.description,
    example: row.example,
    dateLabel: row.dateLabel,
    publishAt: toIso(row.publishAt),
    closesAt: toIso(row.closesAt),
    isPublished: row.isPublished,
    manualState: row.manualState,
    moderationEnabled: row.moderationEnabled,
    points: row.points,
    fields: fieldsByTask.get(row.id) ?? [],
  }));
}

export async function getTaskBySlug(slug: string): Promise<GameTask | null> {
  const all = await getAllTasks();
  return all.find((task) => task.slug === slug) ?? null;
}

export async function getTaskById(id: number): Promise<GameTask | null> {
  const all = await getAllTasks({ includeUnpublished: true });
  return all.find((task) => task.id === id) ?? null;
}

export type FeedAnswer = {
  id: number;
  taskId: number;
  taskNumber: number;
  taskTitle: string;
  taskSlug: string;
  alias: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  isMine: boolean;
  items: SummaryItem[];
};

type FeedOptions = {
  taskId?: number;
  participantId?: number | null;
  limit?: number;
  sort?: "new" | "likes";
};

export async function getApprovedFeed(options: FeedOptions = {}): Promise<FeedAnswer[]> {
  await ensureSeeded();
  const { taskId, participantId = null, limit = 60, sort = "new" } = options;

  const likeCount = sql<number>`(select count(*)::int from ${likes} where ${likes.submissionId} = ${submissions.id})`;
  const likedByMe = participantId
    ? sql<boolean>`exists(select 1 from ${likes} where ${likes.submissionId} = ${submissions.id} and ${likes.participantId} = ${participantId})`
    : sql<boolean>`false`;

  const rows = await db
    .select({
      id: submissions.id,
      taskId: submissions.taskId,
      answers: submissions.answers,
      createdAt: submissions.createdAt,
      participantId: submissions.participantId,
      alias: participants.alias,
      taskNumber: tasks.number,
      taskTitle: tasks.title,
      taskSlug: tasks.slug,
      likes: likeCount,
      likedByMe,
    })
    .from(submissions)
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .innerJoin(participants, eq(submissions.participantId, participants.id))
    .where(taskId ? and(eq(submissions.status, "approved"), eq(submissions.taskId, taskId)) : eq(submissions.status, "approved"))
    .orderBy(sort === "likes" ? desc(likeCount) : desc(submissions.createdAt))
    .limit(limit);

  const fieldRows = await db.select().from(taskFields).orderBy(asc(taskFields.sortOrder), asc(taskFields.id));
  const fieldsByTask = new Map<number, GameField[]>();
  for (const row of fieldRows) {
    const list = fieldsByTask.get(row.taskId) ?? [];
    list.push(mapField(row));
    fieldsByTask.set(row.taskId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    taskNumber: row.taskNumber,
    taskTitle: row.taskTitle,
    taskSlug: row.taskSlug,
    alias: row.alias,
    createdAt: toIso(row.createdAt),
    likes: Number(row.likes ?? 0),
    likedByMe: Boolean(row.likedByMe),
    isMine: participantId !== null && row.participantId === participantId,
    items: summarizeAnswers(fieldsByTask.get(row.taskId) ?? [], row.answers ?? {}),
  }));
}

export async function getMySubmission(taskId: number, participantId: number) {
  const rows = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.taskId, taskId), eq(submissions.participantId, participantId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    status: row.status as "pending" | "approved" | "rejected",
    answers: row.answers ?? {},
    moderationNote: row.moderationNote,
  };
}

export async function getGameStats() {
  await ensureSeeded();
  const [participantCount] = await db.select({ value: count() }).from(participants);
  const [approvedCount] = await db
    .select({ value: count() })
    .from(submissions)
    .where(eq(submissions.status, "approved"));
  const [pendingCount] = await db
    .select({ value: count() })
    .from(submissions)
    .where(eq(submissions.status, "pending"));
  const [likeCount] = await db.select({ value: count() }).from(likes);
  const [taskCount] = await db.select({ value: count() }).from(tasks).where(eq(tasks.isPublished, true));

  return {
    participants: Number(participantCount?.value ?? 0),
    ornaments: Number(approvedCount?.value ?? 0),
    pending: Number(pendingCount?.value ?? 0),
    likes: Number(likeCount?.value ?? 0),
    tasks: Number(taskCount?.value ?? 0),
  };
}

export type LeaderboardRow = {
  participantId: number;
  alias: string;
  value: number;
  submissionCount?: number;
};

export async function getActivityLeaderboard(limit = 12): Promise<LeaderboardRow[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      participantId: participants.id,
      alias: participants.alias,
      value: sql<number>`coalesce(sum(${tasks.points}), 0)::int`,
      submissionCount: sql<number>`count(${submissions.id})::int`,
    })
    .from(submissions)
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .innerJoin(participants, eq(submissions.participantId, participants.id))
    .where(eq(submissions.status, "approved"))
    .groupBy(participants.id, participants.alias)
    .orderBy(desc(sql`coalesce(sum(${tasks.points}), 0)`), desc(sql`count(${submissions.id})`))
    .limit(limit);

  return rows.map((row) => ({
    participantId: row.participantId,
    alias: row.alias,
    value: Number(row.value),
    submissionCount: Number(row.submissionCount),
  }));
}

export async function getAppreciationLeaderboard(limit = 12): Promise<LeaderboardRow[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      participantId: participants.id,
      alias: participants.alias,
      value: sql<number>`count(${likes.id})::int`,
      submissionCount: sql<number>`count(distinct ${submissions.id})::int`,
    })
    .from(likes)
    .innerJoin(submissions, eq(likes.submissionId, submissions.id))
    .innerJoin(participants, eq(submissions.participantId, participants.id))
    .where(eq(submissions.status, "approved"))
    .groupBy(participants.id, participants.alias)
    .orderBy(desc(sql`count(${likes.id})`))
    .limit(limit);

  return rows.map((row) => ({
    participantId: row.participantId,
    alias: row.alias,
    value: Number(row.value),
    submissionCount: Number(row.submissionCount),
  }));
}

export async function getParticipantOverview(participantId: number) {
  const rows = await db
    .select({
      submissionId: submissions.id,
      status: submissions.status,
      createdAt: submissions.createdAt,
      moderationNote: submissions.moderationNote,
      taskId: tasks.id,
      taskNumber: tasks.number,
      taskTitle: tasks.title,
      taskSlug: tasks.slug,
      points: tasks.points,
      likes: sql<number>`(select count(*)::int from ${likes} where ${likes.submissionId} = ${submissions.id})`,
    })
    .from(submissions)
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .where(eq(submissions.participantId, participantId))
    .orderBy(asc(tasks.number));

  const activityPoints = rows.filter((row) => row.status === "approved").reduce((sum, row) => sum + row.points, 0);
  const likesReceived = rows.reduce((sum, row) => sum + Number(row.likes ?? 0), 0);

  const [given] = await db.select({ value: count() }).from(likes).where(eq(likes.participantId, participantId));

  return {
    submissions: rows.map((row) => ({
      submissionId: row.submissionId,
      status: row.status,
      createdAt: toIso(row.createdAt),
      moderationNote: row.moderationNote,
      taskId: row.taskId,
      taskNumber: row.taskNumber,
      taskTitle: row.taskTitle,
      taskSlug: row.taskSlug,
      points: row.points,
      likes: Number(row.likes ?? 0),
    })),
    activityPoints,
    likesReceived,
    likesGiven: Number(given?.value ?? 0),
  };
}

export type ModerationRow = {
  id: number;
  taskNumber: number;
  taskTitle: string;
  alias: string;
  createdAt: string;
  status: string;
  items: SummaryItem[];
  answers: Answers;
};

export async function getModerationQueue(status: "pending" | "approved" | "rejected" = "pending"): Promise<ModerationRow[]> {
  await ensureSeeded();
  const rows = await db
    .select({
      id: submissions.id,
      answers: submissions.answers,
      status: submissions.status,
      createdAt: submissions.createdAt,
      alias: participants.alias,
      taskId: submissions.taskId,
      taskNumber: tasks.number,
      taskTitle: tasks.title,
    })
    .from(submissions)
    .innerJoin(participants, eq(submissions.participantId, participants.id))
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .where(eq(submissions.status, status))
    .orderBy(desc(submissions.createdAt))
    .limit(100);

  const all = await getAllTasks({ includeUnpublished: true });
  const taskById = new Map(all.map((task) => [task.id, task]));

  return rows.map((row) => ({
    id: row.id,
    taskNumber: row.taskNumber,
    taskTitle: row.taskTitle,
    alias: row.alias,
    createdAt: toIso(row.createdAt),
    status: row.status,
    answers: row.answers ?? {},
    items: summarizeAnswers(taskById.get(row.taskId)?.fields ?? [], row.answers ?? {}, false),
  }));
}

export async function getTasksForAdmin() {
  await ensureSeeded();
  const all = await getAllTasks({ includeUnpublished: true });
  const counts = await db
    .select({
      taskId: submissions.taskId,
      status: submissions.status,
      value: sql<number>`count(*)::int`,
    })
    .from(submissions)
    .groupBy(submissions.taskId, submissions.status);

  const countMap = new Map<string, number>();
  for (const row of counts) countMap.set(`${row.taskId}:${row.status}`, Number(row.value));

  return all.map((task) => ({
    ...task,
    totalAnswers: ["pending", "approved", "rejected"].reduce(
      (sum, status) => sum + (countMap.get(`${task.id}:${status}`) ?? 0),
      0,
    ),
    pendingAnswers: countMap.get(`${task.id}:pending`) ?? 0,
    approvedAnswers: countMap.get(`${task.id}:approved`) ?? 0,
  }));
}

export async function getPrivateParticipants() {
  await ensureSeeded();
  const rows = await db
    .select({ participant: participants, priv: participantPrivate })
    .from(participants)
    .leftJoin(participantPrivate, eq(participantPrivate.participantId, participants.id))
    .orderBy(desc(participants.createdAt))
    .limit(200);
  const counts = await db
    .select({ participantId: submissions.participantId, value: sql<number>`count(*)::int` })
    .from(submissions)
    .where(eq(submissions.status, "approved"))
    .groupBy(submissions.participantId);
  const countMap = new Map(counts.map((row) => [row.participantId, Number(row.value)]));
  return rows.map((row) => ({
    ...mapParticipant(row.participant, row.priv),
    approvedCount: countMap.get(row.participant.id) ?? 0,
  }));
}
