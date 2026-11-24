"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Answers, CardValue } from "@/db/schema";
import {
  emptyAnswers,
  isFieldVisible,
  summarizeAnswers,
  validateAnswers,
  type GameField,
  type GameTask,
  type TaskPhase,
} from "@/lib/answers";
import { submitAnswerAction } from "@/lib/actions";
import { aliasEmoji, formatDateTime } from "@/lib/format";
import { SummaryList } from "./SummaryList";
import { Countdown } from "./Countdown";

type Props = {
  task: GameTask;
  initialAnswers: Answers | null;
  existingStatus: "pending" | "approved" | "rejected" | null;
  participantAlias: string | null;
  isOpen: boolean;
  phase: TaskPhase;
  isOrganizer: boolean;
};

type Step = "edit" | "preview" | "done";

const STATUS_TEXT: Record<string, string> = {
  pending: "Ответ отправлен и ждёт модерации. Пока игрушка не на ёлке — но она уже в пути!",
  approved: "Ответ опубликован на общей ёлке. Спасибо за вклад!",
  rejected: "Ответ не опубликован модератором. Можно исправить и отправить снова.",
};

function requiredIcon(required: boolean) {
  return required ? <span className="text-berry-400">*</span> : <span className="text-[10px] text-cream-100/35">необязательно</span>;
}

export function TaskForm({ task, initialAnswers, existingStatus, participantAlias, isOpen, phase, isOrganizer }: Props) {
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers ?? emptyAnswers(task.fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>("edit");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [showPreviewFields, setShowPreviewFields] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const visibleFields = useMemo(
    () => task.fields.filter((field) => isFieldVisible(field, answers)),
    [task.fields, answers],
  );

  const requiredFields = visibleFields.filter((field) => field.required);
  const filledRequired = requiredFields.filter((field) => {
    const error = validateAnswers([field], answers)[field.key];
    return !error;
  }).length;
  const progress = requiredFields.length === 0 ? 100 : Math.round((filledRequired / requiredFields.length) * 100);

  function setAnswer(key: string, value: Answers[string]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleList(key: string, option: string) {
    const current = Array.isArray(answers[key]) ? (answers[key] as string[]) : [];
    const next = current.includes(option) ? current.filter((entry) => entry !== option) : [...current, option];
    setAnswer(key, next);
  }

  function setCardValue(key: string, index: number, cardKey: string, value: string) {
    const cards = Array.isArray(answers[key]) ? ([...answers[key]] as CardValue[]) : [];
    cards[index] = { ...(cards[index] ?? {}), [cardKey]: value };
    setAnswer(key, cards);
  }

  function updateCardKind(key: string, index: number, kind: string) {
    // удобный автоподбор типа идеи для свободных карточек
    setCardValue(key, index, "kind", kind);
  }

  function handlePreview() {
    const validation = validateAnswers(task.fields, answers);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setServerMessage("Проверь поля, отмеченные красным, и попробуй снова.");
      return;
    }
    setServerMessage(null);
    setStep("preview");
    window.scrollTo({ top: 180, behavior: "smooth" });
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("taskId", String(task.id));
    formData.set("answers", JSON.stringify(answers));
    startTransition(async () => {
      const result = await submitAnswerAction({ ok: false }, formData);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setServerMessage(result.message ?? "Не удалось отправить ответ");
        setStep("edit");
        return;
      }
      setServerMessage(result.message ?? null);
      setStep("done");
      router.refresh();
      window.scrollTo({ top: 120, behavior: "smooth" });
    });
  }

  function fieldList(disabled: boolean) {
    return visibleFields.map((field, index) => {
      const previous = visibleFields[index - 1];
      const showGroup = field.groupLabel && field.groupLabel !== previous?.groupLabel;
      return (
        <div key={field.key} id={`field-${field.key}`}>
          {showGroup ? (
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-300" aria-hidden="true" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300">{field.groupLabel}</h4>
              <span className="h-px flex-1 bg-cream-100/10" />
            </div>
          ) : null}
          <fieldset disabled={disabled} className={disabled ? "pointer-events-none select-none opacity-70" : undefined}>
            <FieldControl
              field={field}
              value={answers[field.key]}
              error={disabled ? undefined : errors[field.key]}
              onChange={(value) => setAnswer(field.key, value)}
              onToggle={(option) => toggleList(field.key, option)}
              onCardChange={(cardIndex, cardKey, value) => setCardValue(field.key, cardIndex, cardKey, value)}
              onCardKind={(cardIndex, kind) => updateCardKind(field.key, cardIndex, kind)}
              onAddCard={() => {
                const cards = Array.isArray(answers[field.key]) ? (answers[field.key] as CardValue[]) : [];
                if (cards.length < field.maxCards) setAnswer(field.key, [...cards, {}]);
              }}
              onRemoveCard={(cardIndex) => {
                const cards = Array.isArray(answers[field.key]) ? (answers[field.key] as CardValue[]) : [];
                if (cards.length > field.minCards) setAnswer(field.key, cards.filter((_, i) => i !== cardIndex));
              }}
            />
          </fieldset>
        </div>
      );
    });
  }

  if (!isOpen) {
    const upcoming = phase === "upcoming";
    return (
      <div className="surface relative overflow-hidden p-6">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_50%_0%,rgba(240,193,90,0.18),transparent_70%)]" aria-hidden="true" />
        <div className="relative text-center">
          <p className="text-4xl" aria-hidden="true">
            {upcoming ? "🔒" : "🔔"}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-300">
            {upcoming ? "Задание закрыто до даты открытия" : "Приём ответов завершён"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-cream-100">
            {upcoming ? "Форма откроется по календарю — в 00:00 МСК" : "Ответы больше не принимаются"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-cream-100/60">
            {upcoming
              ? "Задания открываются строго по расписанию: по понедельникам, средам и пятницам в 00:00 по московскому времени. До этого момента форма заблокирована."
              : "Но игрушки с этого задания уже висят на нашей ёлке — загляни в ленту ответов и поставь лайки понравившимся."}
          </p>

          {upcoming ? (
            <div className="mt-4 flex flex-col items-center gap-2">
              <Countdown target={task.publishAt} label="До открытия задания" />
              <p className="text-[11px] text-cream-100/45">
                Откроется {formatDateTime(task.publishAt)} · приём ответов до {formatDateTime(task.closesAt)}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/feed" className="btn-primary">
              Смотреть ответы
            </Link>
            <Link href="/tasks" className="btn-ghost">
              К каталогу заданий
            </Link>
            {upcoming ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowPreviewFields((value) => !value)}
                aria-expanded={showPreviewFields}
              >
                {showPreviewFields ? "Скрыть пример формы" : "Как выглядит форма"}
              </button>
            ) : null}
          </div>
        </div>

        {upcoming && showPreviewFields ? (
          <div className="mt-5 rounded-2xl border border-dashed border-cream-100/20 bg-pine-950/40 p-4">
            <p className="mb-3 rounded-lg border border-gold-300/25 bg-gold-300/10 px-2.5 py-1.5 text-[10px] leading-relaxed text-gold-300">
              Предпросмотр без возможности отправки. Заполнить и отправить ответ можно с {formatDateTime(task.publishAt)}.
            </p>
            <div className="space-y-5">{fieldList(true)}</div>
          </div>
        ) : null}
      </div>
    );
  }

  if (!participantAlias) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          🎁
        </p>
        <h3 className="mt-2 text-lg font-semibold text-cream-100">Чтобы отправить ответ, нужен игровой профиль</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream-100/65">
          Твой настоящий имя и почта останутся в приватном профиле организаторов. В игре ты выступаешь под весёлым
          псевдонимом — его мы придумаем автоматически.
        </p>
        <Link href="/me" className="btn-primary mt-4">
          Присоединиться к игре
        </Link>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="surface animate-pop relative overflow-hidden p-7 text-center">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_50%_0%,rgba(168,224,99,0.35),transparent_70%)]" />
        <div className="relative">
          <p className="text-5xl" aria-hidden="true">
            🎄✨
          </p>
          <h3 className="mt-3 text-xl font-bold text-cream-100">Отлично! Ещё одна игрушка отправляется на нашу общую ёлку!</h3>
          <p className="mt-2 text-sm text-cream-100/70">
            Спасибо,{" "}
            <span className="font-semibold text-lime-300">
              {aliasEmoji(participantAlias)} {participantAlias}
            </span>
            ! Твой ответ сохранён.
          </p>
          <p className="mx-auto mt-3 max-w-md rounded-xl border border-gold-300/25 bg-gold-300/10 px-3 py-2 text-xs text-gold-300">
            {task.moderationEnabled
              ? "Ответ появится на ёлке после проверки модератором. Обычно это занимает не больше дня."
              : "Ответ сразу опубликован на ёлке под псевдонимом."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/tree" className="btn-primary">
              Посмотреть ёлку
            </Link>
            <Link href="/tasks" className="btn-ghost">
              К другим заданиям
            </Link>
            <button type="button" className="btn-ghost" onClick={() => setStep("edit")}>
              Изменить ответ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="chip">Проверка перед отправкой</p>
            <h3 className="mt-2 text-lg font-semibold text-cream-100">Так ответ увидят другие участники</h3>
          </div>
          <span className="text-xs text-cream-100/50">
            {aliasEmoji(participantAlias)} {participantAlias}
          </span>
        </div>
        <p className="mt-3 rounded-xl border border-cream-100/12 bg-cream-100/5 p-3 text-[11px] leading-relaxed text-cream-100/60">
          Публикуются только ответы под игровым псевдонимом. Проверь, что в тексте нет имён коллег, контактов и других
          персональных данных.
        </p>
        <div className="mt-4 max-h-[52vh] overflow-y-auto rounded-xl border border-cream-100/10 bg-pine-950/40 p-4">
          <SummaryList
            items={summarizeAnswers(
              task.fields.map((field) => ({ ...field, publish: true })),
              answers,
              false,
            )}
          />
        </div>
        {serverMessage ? <p className="mt-3 text-xs text-berry-400">{serverMessage}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Отправляем…" : existingStatus ? "Обновить ответ" : "Отправить ответ"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setStep("edit")} disabled={isPending}>
            Вернуться к форме
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="chip">Форма задания №{task.number}</p>
          <h3 className="mt-2 text-lg font-semibold text-cream-100">Заполни форму и проверь ответ</h3>
        </div>
        <div className="min-w-[9rem]">
          <div className="flex items-center justify-between text-[10px] text-cream-100/50">
            <span>Заполнено</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cream-100/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime-400 to-gold-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {existingStatus && STATUS_TEXT[existingStatus] ? (
        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${
            existingStatus === "approved"
              ? "border-lime-300/30 bg-lime-300/10 text-lime-300"
              : existingStatus === "pending"
                ? "border-gold-300/30 bg-gold-300/10 text-gold-300"
                : "border-berry-400/30 bg-berry-400/10 text-berry-400"
          }`}
        >
          {STATUS_TEXT[existingStatus]} Отправляя форму повторно, ты обновишь ответ — он снова уйдёт на модерацию.
        </p>
      ) : null}

      <p className="mt-3 rounded-xl border border-cream-100/12 bg-cream-100/5 p-3 text-[11px] leading-relaxed text-cream-100/60">
        🔒 Не указывай реальные имена, телефоны, почту и другие персональные данные в ответах: они публикуются анонимно
        под псевдонимом. Приватные данные профиля хранятся отдельно и доступны только организаторам.
      </p>

      <fieldset className="mt-5 space-y-5" disabled={false}>
        {fieldList(false)}
      </fieldset>

      {serverMessage ? (
        <p className="mt-4 rounded-xl border border-berry-400/30 bg-berry-400/10 px-3 py-2 text-xs text-berry-400">
          {serverMessage}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" onClick={handlePreview}>
          Проверить ответ
        </button>
        <span className="text-[11px] text-cream-100/45">
          {isOrganizer ? "Ты организатор: ответы всё равно публикуются анонимно." : "Перед отправкой можно всё проверить."}
        </span>
      </div>
    </div>
  );
}

type FieldProps = {
  field: GameField;
  value: Answers[string];
  error?: string;
  onChange: (value: Answers[string]) => void;
  onToggle: (option: string) => void;
  onCardChange: (cardIndex: number, cardKey: string, value: string) => void;
  onCardKind: (cardIndex: number, kind: string) => void;
  onAddCard: () => void;
  onRemoveCard: (cardIndex: number) => void;
};

function FieldControl({ field, value, error, onChange, onToggle, onCardChange, onCardKind, onAddCard, onRemoveCard }: FieldProps) {
  const listValue = Array.isArray(value) && field.type !== "cards" ? (value as string[]) : [];
  const stringValue = typeof value === "string" || typeof value === "number" ? String(value) : "";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-1">
        <label className="field-label" htmlFor={`input-${field.key}`}>
          {field.label} {requiredIcon(field.required)}
        </label>
        {field.type === "rating" ? (
          <span className="text-[10px] text-cream-100/45">
            {field.numberMin} — {field.numberMax}
          </span>
        ) : null}
      </div>
      {field.helpText ? <p className="field-hint mb-2">{field.helpText}</p> : null}

      {field.type === "text" || field.type === "url" || field.type === "date" ? (
        <input
          id={`input-${field.key}`}
          className="input"
          type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.type === "textarea" ? (
        <textarea
          id={`input-${field.key}`}
          className="textarea min-h-[92px] resize-y"
          rows={field.label.length > 60 ? 3 : 4}
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.type === "radio" || field.type === "checkbox" || field.type === "checklist" ? (
        <div className={`grid gap-2 ${field.options.length > 4 ? "sm:grid-cols-2" : ""}`} role="group" aria-labelledby={`input-${field.key}`}>
          {field.options.map((option) => {
            const checked = field.type === "radio" ? stringValue === option : listValue.includes(option);
            return (
              <label key={option} className="option-tile">
                <input
                  type={field.type === "radio" ? "radio" : "checkbox"}
                  name={`input-${field.key}`}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#a8e063]"
                  checked={checked}
                  onChange={() => (field.type === "radio" ? onChange(option) : onToggle(option))}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {field.type === "rating" ? (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: field.numberMax - field.numberMin + 1 }, (_, index) => field.numberMin + index).map(
            (score) => {
              const active = Number(stringValue) === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => onChange(active ? "" : score)}
                  aria-pressed={active}
                  className={`h-9 min-w-9 rounded-xl border px-2 text-sm font-semibold transition ${
                    active
                      ? "border-lime-400 bg-lime-400 text-pine-950"
                      : "border-cream-100/18 bg-cream-100/5 text-cream-100/70 hover:border-lime-400/60 hover:text-lime-300"
                  }`}
                >
                  {score}
                </button>
              );
            },
          )}
        </div>
      ) : null}

      {field.type === "cards" ? (
        <div className="space-y-3">
          {(Array.isArray(value) ? (value as CardValue[]) : []).map((card, cardIndex) => (
            <div key={cardIndex} className="rounded-xl border border-cream-100/14 bg-pine-900/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-300">
                  Карточка {cardIndex + 1}
                </p>
                {(Array.isArray(value) ? (value as CardValue[]).length : 0) > field.minCards ? (
                  <button
                    type="button"
                    onClick={() => onRemoveCard(cardIndex)}
                    className="text-[10px] text-cream-100/45 hover:text-berry-400"
                  >
                    удалить
                  </button>
                ) : null}
              </div>
              <div className="space-y-2.5">
                {field.cardFields.map((cardField) => {
                  const entry = String(card?.[cardField.key] ?? "");
                  return (
                    <div key={cardField.key}>
                      <label className="mb-1 block text-[11px] font-medium text-cream-100/75">
                        {cardField.label} {cardField.required ? <span className="text-berry-400">*</span> : null}
                      </label>
                      {cardField.type === "radio" && cardField.options ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cardField.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => onCardKind(cardIndex, option)}
                              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                                entry === option
                                  ? "border-lime-400 bg-lime-400/20 text-lime-300"
                                  : "border-cream-100/18 text-cream-100/65 hover:border-lime-400/50"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : cardField.type === "textarea" ? (
                        <textarea
                          className="textarea min-h-[64px] !text-[13px]"
                          rows={2}
                          value={entry}
                          placeholder={cardField.placeholder ?? ""}
                          onChange={(event) => onCardChange(cardIndex, cardField.key, event.target.value)}
                        />
                      ) : (
                        <input
                          className="input !text-[13px]"
                          type={cardField.type === "date" ? "date" : "text"}
                          value={entry}
                          placeholder={cardField.placeholder ?? ""}
                          onChange={(event) => onCardChange(cardIndex, cardField.key, event.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {(Array.isArray(value) ? (value as CardValue[]).length : 0) < field.maxCards ? (
            <button type="button" onClick={onAddCard} className="btn-ghost !py-1.5 !text-xs">
              + Добавить карточку
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-1.5 text-[11px] font-medium text-berry-400">{error}</p> : null}
    </div>
  );
}
