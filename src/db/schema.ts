import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type FieldType =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "rating"
  | "checklist"
  | "date"
  | "url"
  | "cards";

export type FieldCondition = {
  fieldKey: string;
  op: "equals" | "notEquals" | "includes" | "notIncludes" | "answered";
  values: string[];
};

export type CardField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type CardValue = Record<string, string>;

export type AnswerValue = string | string[] | number | CardValue[] | null;
export type Answers = Record<string, AnswerValue>;

/** Публичный игровой профиль: только псевдоним, без персональных данных. */
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  alias: text("alias").notNull().unique(),
  isOrganizer: boolean("is_organizer").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Приватные данные участника: доступны только уполномоченным организаторам. */
export const participantPrivate = pgTable("participant_private", {
  participantId: integer("participant_id")
    .primaryKey()
    .references(() => participants.id, { onDelete: "cascade" }),
  privateName: text("private_name"),
  privateEmail: text("private_email"),
  privateContact: text("private_contact"),
  team: text("team"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  week: integer("week").notNull().default(1),
  weekTitle: text("week_title"),
  tool: text("tool"),
  description: text("description").notNull().default(""),
  example: text("example"),
  dateLabel: text("date_label"),
  publishAt: timestamp("publish_at", { withTimezone: true }).notNull().defaultNow(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull().defaultNow(),
  isPublished: boolean("is_published").notNull().default(true),
  /** auto | open | closed — ручное управление приёмом ответов. */
  manualState: text("manual_state").notNull().default("auto"),
  moderationEnabled: boolean("moderation_enabled").notNull().default(true),
  points: integer("points").notNull().default(10),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tasks_number_idx").on(table.number),
    uniqueIndex("tasks_slug_idx").on(table.slug),
  ],
);

export const taskFields = pgTable(
  "task_fields",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    type: text("type").$type<FieldType>().notNull().default("text"),
    required: boolean("required").notNull().default(false),
    groupLabel: text("group_label"),
    placeholder: text("placeholder"),
    helpText: text("help_text"),
    options: jsonb("options").$type<string[]>().default([]),
    condition: jsonb("condition").$type<FieldCondition | null>(),
    cardFields: jsonb("card_fields").$type<CardField[]>().default([]),
    minCards: integer("min_cards").default(1),
    maxCards: integer("max_cards").default(5),
    numberMin: integer("number_min").default(1),
    numberMax: integer("number_max").default(10),
    publish: boolean("publish").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("task_fields_task_idx").on(table.taskId),
    uniqueIndex("task_fields_task_key_idx").on(table.taskId, table.key),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<Answers>().notNull().default({}),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    moderationNote: text("moderation_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("submissions_task_participant_idx").on(table.taskId, table.participantId),
    index("submissions_status_idx").on(table.status),
  ],
);

export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    submissionId: integer("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("likes_submission_participant_idx").on(table.submissionId, table.participantId)],
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
