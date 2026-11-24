import Link from "next/link";
import { notFound } from "next/navigation";
import { getTaskPhase, PHASE_LABELS } from "@/lib/answers";
import { formatDateTime, formatNumber } from "@/lib/format";
import {
  getAllTasks,
  getApprovedFeed,
  getCurrentParticipant,
  getMySubmission,
  getTaskBySlug,
} from "@/lib/game";
import { AnswerCard } from "@/components/AnswerCard";
import { TaskForm } from "@/components/TaskForm";
import { Countdown } from "@/components/Countdown";
import { ParticipantGate } from "@/components/ParticipantGate";

export const dynamic = "force-dynamic";

const PHASE_HINT: Record<string, string> = {
  open: "Форма доступна до дедлайна. Ответ можно обновить до закрытия приёма.",
  upcoming: "Задание станет доступно в дату публикации. Дедлайн уже известен.",
  closed: "Приём ответов завершён — читай опубликованные ответы и ставь лайки.",
  draft: "Задание готовится организаторами.",
};

export default async function TaskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const task = await getTaskBySlug(slug);
  if (!task) notFound();

  const participant = await getCurrentParticipant();

  if (!participant) {
    return (
      <ParticipantGate
        icon="🎁"
        title="Задания и ответы — для участников"
        description="Задание, его форма и анонимные ответы коллег доступны после входа в игровой профиль. Сама ёлка видна всем без входа."
      />
    );
  }

  const [feed, allTasks, mySubmission] = await Promise.all([
    getApprovedFeed({ taskId: task.id, participantId: participant?.id ?? null, limit: 24 }),
    getAllTasks(),
    getMySubmission(task.id, participant.id),
  ]);

  const phase = getTaskPhase(task);
  const isOpen = phase === "open";
  const index = allTasks.findIndex((item) => item.id === task.id);
  const previous = allTasks[index - 1];
  const next = allTasks[index + 1];
  const totalLikes = feed.reduce((sum, answer) => sum + answer.likes, 0);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link href="/tasks" className="text-cream-100/55 hover:text-lime-300">
          ← Каталог заданий
        </Link>
        <div className="flex gap-2">
          {previous ? (
            <Link href={`/tasks/${previous.slug}`} className="btn-ghost !py-1.5 !text-[11px]">
              ← №{previous.number}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/tasks/${next.slug}`} className="btn-ghost !py-1.5 !text-[11px]">
              №{next.number} →
            </Link>
          ) : null}
        </div>
      </div>

      <header className="surface relative overflow-hidden p-5 sm:p-7">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`chip ${phase === "open" ? "" : phase === "closed" ? "chip-gold" : "chip-muted"}`}>
              {PHASE_LABELS[phase]}
            </span>
            <span className="chip chip-gold">{task.tool}</span>
            <span className="chip chip-muted">Неделя {task.week}</span>
            <span className="chip chip-muted">{task.points} баллов</span>
          </div>
          <p className="eyebrow mt-4">Задание № {task.number} · {task.tool}</p>
          <h1 className="display-title mt-2 text-[clamp(1.9rem,4.4vw,3.1rem)]">{task.title}</h1>
          <p className="mt-2 text-xs text-cream-100/50">
            {task.weekTitle} · {task.dateLabel} · приём ответов до {formatDateTime(task.closesAt)}
          </p>

          {phase === "upcoming" ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gold-300/25 bg-gold-300/8 p-3">
              <span className="text-2xl" aria-hidden="true">
                🔒
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
                  Задание заблокировано до даты открытия
                </p>
                <p className="mt-0.5 text-xs text-cream-100/65">
                  Откроется {formatDateTime(task.publishAt)} — ровно в 00:00 МСК.
                </p>
              </div>
              <Countdown target={task.publishAt} className="ml-auto" />
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 text-sm leading-relaxed text-cream-100/75 md:grid-cols-2">
            {task.description.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {task.example ? (
            <div className="mt-4 rounded-2xl border border-gold-300/25 bg-gold-300/8 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">Пример</p>
              <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-cream-100/75">{task.example}</p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-cream-100/45">
            <span>{PHASE_HINT[phase]}</span>
            <span className="hidden sm:inline">·</span>
            <span>
              {formatNumber(feed.length)} опубликованных ответов · {formatNumber(totalLikes)} симпатий
            </span>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <TaskForm
            task={task}
            initialAnswers={mySubmission?.answers ?? null}
            existingStatus={mySubmission?.status ?? null}
            participantAlias={participant.alias}
            isOpen={isOpen}
            phase={phase}
            isOrganizer={participant.isOrganizer}
          />

          {mySubmission?.moderationNote ? (
            <p className="rounded-xl border border-gold-300/30 bg-gold-300/10 px-3 py-2 text-xs text-gold-300">
              Комментарий модератора: {mySubmission.moderationNote}
            </p>
          ) : null}

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-lime-300">
                Ответы участников ({feed.length})
              </h2>
              <Link href="/feed" className="text-xs text-cream-100/50 hover:text-lime-300">
                Все задания →
              </Link>
            </div>
            {feed.length === 0 ? (
              <div className="surface p-6 text-center text-sm text-cream-100/60">
                По этому заданию пока нет опубликованных ответов. Стань первым — игрушка уже ждёт своё место на ёлке!
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((answer) => (
                  <AnswerCard key={answer.id} answer={answer} showTask={false} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {task.number === 12 ? (
            <div className="surface-light p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-pine-700/70">Финальное послание участнику</p>
              <p className="mt-1.5 text-xs leading-relaxed text-pine-900">
                «Спасибо, что был частью нашей системы в 2026 году. В 2027-м давай не просто загадывать желания, а
                воплощать их вместе. Ведь Комьюнити аналитиков S7 — это мы!»
              </p>
            </div>
          ) : null}

          <div className="surface p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-lime-300">Как это работает</h2>
            <ol className="mt-2.5 space-y-2 text-xs text-cream-100/65">
              <li>1. Заполни форму и проверь введённые данные перед отправкой.</li>
              <li>2. После отправки появится праздничное подтверждение.</li>
              <li>3. {task.moderationEnabled ? "Ответ проходит модерацию и публикуется под псевдонимом." : "Ответ сразу публикуется под псевдонимом."}</li>
              <li>4. Каждый принятый ответ добавляет игрушку на общую ёлку.</li>
              <li>5. Читай ответы коллег и ставь лайки — от них игрушки становятся больше.</li>
            </ol>
          </div>

          <div className="surface p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300">Приватность</h2>
            <p className="mt-2 text-xs leading-relaxed text-cream-100/60">
              Реальные имена и контакты не публикуются. Публичный игровой профиль (псевдоним) хранится отдельно от
              приватных данных, доступ к которым есть только у уполномоченных организаторов. Пожалуйста, не указывай в
              ответах персональные данные коллег и адресатов благодарностей.
            </p>
          </div>

          <div className="surface p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-lime-300">Твоя статистика</h2>
            {participant ? (
              <div className="mt-2 space-y-1.5 text-xs text-cream-100/65">
                <p>
                  Псевдоним: <span className="text-cream-100">{participant.alias}</span>
                </p>
                <p>
                  Статус ответа:{" "}
                  <span className="text-cream-100">
                    {mySubmission
                      ? mySubmission.status === "approved"
                        ? "опубликован"
                        : mySubmission.status === "pending"
                          ? "на модерации"
                          : "отклонён модератором"
                      : "ещё не отправлен"}
                  </span>
                </p>
                <Link href="/me" className="mt-1 inline-block text-lime-300 link-underline">
                  Мой профиль и достижения →
                </Link>
              </div>
            ) : (
              <div className="mt-2 text-xs text-cream-100/65">
                <p>Чтобы отправить ответ и получать лайки, нужно войти в игру.</p>
                <Link href="/me" className="btn-primary mt-2 !px-3 !py-1.5 !text-[11px]">
                  Присоединиться
                </Link>
              </div>
            )}
          </div>

          <div className="surface p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-lime-300">Другие задания</h2>
            <ul className="mt-2 space-y-1.5 text-xs">
              {allTasks
                .filter((item) => item.id !== task.id)
                .slice(0, 5)
                .map((item) => (
                  <li key={item.id}>
                    <Link href={`/tasks/${item.slug}`} className="text-cream-100/65 hover:text-lime-300">
                      №{item.number} · {item.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
