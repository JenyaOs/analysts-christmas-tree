import Link from "next/link";
import { getTaskPhase, PHASE_LABELS, type TaskPhase } from "@/lib/answers";
import { formatDateTime } from "@/lib/format";
import { getAllTasks, getCurrentParticipant, getParticipantOverview } from "@/lib/game";
import { TaskCard } from "@/components/TaskCard";
import { ParticipantGate } from "@/components/ParticipantGate";

export const dynamic = "force-dynamic";

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "Все задания" },
  { key: "open", label: "Приём открыт" },
  { key: "upcoming", label: "Скоро" },
  { key: "closed", label: "Закрыты" },
  { key: "mine", label: "Мои ответы" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const [tasks, participant] = await Promise.all([getAllTasks(), getCurrentParticipant()]);

  if (!participant) {
    return (
      <ParticipantGate
        icon="🎯"
        title="Задания открываются из профиля участника"
        description="Каталог из 12 заданий, формы и дедлайны доступны участникам игры. Войди в игровой профиль — псевдоним создаётся автоматически, а настоящие имя и почта остаются приватными."
      />
    );
  }

  const overview = await getParticipantOverview(participant.id);
  const statusByTask = new Map(overview?.submissions.map((row) => [row.taskId, row.status]) ?? []);

  const filtered = tasks.filter((task) => {
    const phase = getTaskPhase(task);
    if (status === "mine") return statusByTask.has(task.id);
    if (status === "open") return phase === "open";
    if (status === "upcoming") return phase === "upcoming";
    if (status === "closed") return phase === "closed";
    return true;
  });

  const counts = tasks.reduce<Record<string, number>>((acc, task) => {
    const phase = getTaskPhase(task);
    acc[phase] = (acc[phase] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/me" className="text-[11px] text-cream-100/45 hover:text-lime-300">
            ← Профиль участника
          </Link>
          <span className="chip">Каталог · 12 заданий</span>
        </div>
        <h1 className="display-title mt-3 text-[clamp(1.9rem,4.6vw,3rem)]">Задания «Ёлки аналитиков»</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-100/65">
          Каждое принятое задание добавляет игрушку на общую виртуальную ёлку. Задания открываются строго по
          календарю — в 00:00 по московскому времени: до этого момента форма заблокирована, но описание и внешний вид
          формы можно изучить заранее.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="chip chip-muted">Приём ответов: 30.11 — 25.12.2026</span>
          <span className="chip chip-muted">Пн · Ср · Пт — новое задание</span>
          <span className="chip chip-gold">🔒 Открытие по календарю в 00:00 МСК</span>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const active = status === filter.key;
          const count =
            filter.key === "mine"
              ? overview?.submissions.length ?? 0
              : filter.key === "all"
                ? tasks.length
                : counts[filter.key] ?? 0;
          return (
            <Link
              key={filter.key}
              href={filter.key === "all" ? "/tasks" : `/tasks?status=${filter.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-lime-400 bg-lime-400/15 text-lime-300"
                  : "border-cream-100/15 text-cream-100/65 hover:border-lime-400/50 hover:text-lime-300"
              }`}
            >
              {filter.label} <span className="opacity-60">{count}</span>
            </Link>
          );
        })}
        <Link href="/me" className="ml-auto text-xs text-lime-300 link-underline">
          Мой профиль и достижения →
        </Link>
      </div>

      {[1, 2, 3, 4].map((week) => {
        const weekTasks = filtered.filter((task) => task.week === week);
        if (weekTasks.length === 0) return null;
        return (
          <section key={week}>
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-gold-300">Неделя {week}</h2>
              <span className="text-xs text-cream-100/45">
                {weekTasks[0]?.weekTitle?.replace(/^Неделя \d\.\s*/, "")}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {weekTasks.map((task) => (
                <TaskCard key={task.id} task={task} submissionStatus={statusByTask.get(task.id) ?? null} showWeek={false} />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-3xl" aria-hidden="true">
            🎅
          </p>
          <p className="mt-2 text-sm text-cream-100/70">
            В этой подборке пока пусто.{" "}
            {status === "mine"
              ? "Самое время выполнить первое доступное задание!"
              : status === "open"
                ? "Сейчас нет заданий с открытой формой — ближайшее откроется по календарю в 00:00 МСК. Посмотрите, что уже скоро."
                : "Загляни позже — задания публикуются по понедельникам, средам и пятницам."}
          </p>
          <Link href="/tasks" className="btn-primary mt-4">
            Показать все задания
          </Link>
        </div>
      ) : null}

      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-lime-300">Дедлайны</h2>
            <p className="mt-1 text-xs text-cream-100/55">
              Ответы принимаются до 25 декабря. После этого — модерация, подведение итогов и финальная сияющая ёлка
              28–31 декабря.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["open", "upcoming", "closed"] as TaskPhase[]).map((phase) => (
              <span key={phase} className="chip chip-muted">
                {PHASE_LABELS[phase]}: {counts[phase] ?? 0}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-[11px] text-cream-100/45 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <p key={task.id}>
              №{task.number} · до {formatDateTime(task.closesAt)}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
