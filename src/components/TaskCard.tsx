import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getTaskPhase, PHASE_LABELS, type GameTask, type TaskPhase } from "@/lib/answers";
import { Countdown } from "./Countdown";

const PHASE_STYLES: Record<TaskPhase, string> = {
  draft: "chip chip-muted",
  upcoming: "chip chip-muted",
  open: "chip",
  closed: "chip chip-gold",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "На модерации", className: "chip chip-gold" },
  approved: { label: "Опубликовано", className: "chip" },
  rejected: { label: "Нужно исправить", className: "chip !border-berry-400/40 !bg-berry-400/10 !text-berry-400" },
};

export function TaskCard({
  task,
  submissionStatus,
  showWeek = true,
}: {
  task: GameTask;
  submissionStatus?: string | null;
  showWeek?: boolean;
}) {
  const phase = getTaskPhase(task);
  const status = submissionStatus ? STATUS_STYLES[submissionStatus] : null;

  return (
    <Link
      href={`/tasks/${task.slug}`}
      className="surface group flex h-full flex-col p-5 transition hover:border-lime-400/40 hover:shadow-[0_26px_60px_-38px_rgba(168,224,99,0.55)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 font-display text-2xl font-bold text-lime-300/80">
          {String(task.number).padStart(2, "0")}
          {phase === "upcoming" ? (
            <span className="text-sm" aria-label="Задание заблокировано до даты открытия" title="Заблокировано до 00:00 МСК даты открытия">
              🔒
            </span>
          ) : null}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {status ? <span className={status.className}>{status.label}</span> : null}
          <span className={PHASE_STYLES[phase]}>{PHASE_LABELS[phase]}</span>
        </div>
      </div>

      <h3 className="mt-2 text-[17px] font-semibold leading-snug text-cream-100 group-hover:text-lime-300">
        {task.title}
      </h3>

      {showWeek && task.weekTitle ? (
        <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-cream-100/40">{task.weekTitle}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {task.tool ? <span className="chip chip-gold !normal-case !tracking-normal">{task.tool}</span> : null}
        {task.dateLabel ? <span className="chip chip-muted !normal-case !tracking-normal">{task.dateLabel}</span> : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-[11px] text-cream-100/50">
        <span>{task.points} баллов активности</span>
        {phase === "upcoming" ? (
          <Countdown target={task.publishAt} label="откроется" compact />
        ) : (
          <span className="text-cream-100/35">до {formatDateTime(task.closesAt)}</span>
        )}
      </div>
    </Link>
  );
}
