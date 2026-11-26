import Link from "next/link";
import { aliasEmoji, formatDateTime } from "@/lib/format";
import {
  getAllTasks,
  getActivityLeaderboard,
  getAppreciationLeaderboard,
  getCurrentParticipant,
  getParticipantOverview,
} from "@/lib/game";
import { getTaskPhase } from "@/lib/answers";
import { updatePrivateProfileAction, leaveGameAction } from "@/lib/actions";
import { ActionForm } from "@/components/ActionForm";
import { JoinForm } from "@/components/JoinForm";
import { Countdown } from "@/components/Countdown";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "На модерации", className: "chip chip-gold" },
  approved: { label: "Опубликовано", className: "chip" },
  rejected: { label: "Нужно исправить", className: "chip !border-berry-400/40 !bg-berry-400/10 !text-berry-400" },
};

export default async function ProfilePage() {
  const participant = await getCurrentParticipant();

  if (!participant) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="surface-glass relative overflow-hidden p-6 sm:p-8">
          <div className="tree-aurora pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full" aria-hidden="true" />
          <div className="relative">
            <p className="eyebrow">Вход в игру</p>
            <h1 className="display-title mt-2 text-[clamp(2rem,5vw,3.2rem)]">
              Мой игровой
              <br />
              профиль
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream-100/65">
              Задания, формы и ответы участников открываются только из профиля. Заполни приватные данные — и получишь
              весёлый псевдоним, под которым будут публиковаться ответы.
            </p>
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
          <JoinForm />
          <aside className="space-y-3">
            <div className="surface p-4">
              <h2 className="eyebrow">Что открывает профиль</h2>
              <ul className="mt-2 space-y-1.5 text-xs text-cream-100/60">
                <li>· каталог 12 заданий и формы ответов;</li>
                <li>· анонимные ответы других участников и лайки;</li>
                <li>· рейтинги активности и симпатий;</li>
                <li>· личные достижения и игрушки на ёлке.</li>
              </ul>
            </div>
            <div className="surface p-4">
              <h2 className="eyebrow">Конфиденциальность</h2>
              <p className="mt-2 text-xs leading-relaxed text-cream-100/55">
                Публичный профиль — только псевдоним. Реальные имена и контакты хранятся отдельно и доступны только
                уполномоченным организаторам.
              </p>
            </div>
            <Link href="/" className="surface flex items-center justify-between p-4 text-xs text-cream-100/65 hover:border-lime-400/40">
              <span>🎄 Посмотреть общую ёлку</span>
              <span className="text-lime-300">→</span>
            </Link>
          </aside>
        </div>
      </div>
    );
  }

  const [overview, tasks, activity, appreciation] = await Promise.all([
    getParticipantOverview(participant.id),
    getAllTasks(),
    getActivityLeaderboard(100),
    getAppreciationLeaderboard(100),
  ]);

  const activityRank = activity.findIndex((row) => row.participantId === participant.id);
  const appreciationRank = appreciation.findIndex((row) => row.participantId === participant.id);
  const answeredTaskIds = new Set(overview.submissions.map((row) => row.taskId));
  const openCount = tasks.filter((task) => getTaskPhase(task) === "open").length;
  const weeks = [1, 2, 3, 4].map((week) => ({
    week,
    title: tasks.find((task) => task.week === week)?.weekTitle ?? `Неделя ${week}`,
    tasks: tasks.filter((task) => task.week === week),
  }));

  return (
    <div className="space-y-4">
      {/* Профиль */}
      <header className="surface-glass flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-400/30 bg-lime-400/10 text-2xl">
            {aliasEmoji(participant.alias)}
          </div>
          <div>
            <p className="eyebrow">Профиль участника</p>
            <h1 className="font-display text-xl font-bold tracking-tight text-cream-100">{participant.alias}</h1>
            <p className="text-[11px] text-cream-100/40">В игре с {formatDateTime(participant.createdAt)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "баллы активности", value: overview.activityPoints, color: "text-lime-300" },
            { label: "симпатии", value: overview.likesReceived, color: "text-berry-400" },
            { label: "лайков поставил", value: overview.likesGiven, color: "text-gold-300" },
            { label: "заданий сдано", value: overview.submissions.length, color: "text-cream-100" },
          ].map((stat) => (
            <div key={stat.label} className="stat-tile min-w-[5.5rem]">
              <p className={`font-display text-lg font-bold leading-none ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-cream-100/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* Задания */}
        <section className="surface p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="section-title">Мои задания</h2>
              
            </div>
           </div>

          <div className="mt-4 space-y-4">
            {weeks.map((week) => (
              <div key={week.week}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
                    Неделя {week.week}
                  </span>
                  <span className="text-[10px] text-cream-100/35">
                    {week.title.replace(/^Неделя \d\.\s*/, "")}
                  </span>
                  <span className="h-px flex-1 bg-cream-100/8" />
                </div>
                <ul className="space-y-1.5">
                  {week.tasks.map((task) => {
                    const phase = getTaskPhase(task);
                    const submission = overview.submissions.find((row) => row.taskId === task.id);
                    const status = submission ? STATUS_LABELS[submission.status] : null;
                    const locked = phase === "upcoming";
                    return (
                      <li key={task.id}>
                        <Link
                          href={`/tasks/${task.slug}`}
                          className={`group flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-3 py-2 transition ${
                            locked
                              ? "border-cream-100/8 bg-cream-100/2 hover:border-gold-300/30"
                              : "border-cream-100/10 bg-cream-100/4 hover:border-lime-400/45 hover:bg-lime-400/6"
                          }`}
                        >
                          <span className="w-6 text-xs font-bold text-gold-300">{task.number}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-cream-100/90 group-hover:text-lime-300">
                              {locked ? <span aria-hidden="true">🔒</span> : null}
                              <span className="truncate">{task.title}</span>
                            </span>
                            <span className="mt-0.5 block text-[10px] text-cream-100/35">
                              {task.tool} · {task.dateLabel}
                            </span>
                          </span>
                          {status ? <span className={status.className}>{status.label}</span> : null}
                          {locked ? (
                            <Countdown target={task.publishAt} compact label="через" className="!text-[10px]" />
                          ) : phase === "open" ? (
                            <span className="chip !text-[9px]">{answeredTaskIds.has(task.id) ? "изменить" : "ответить"}</span>
                          ) : (
                            <span className="chip chip-muted !text-[9px]">закрыто</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-3">
          <div className="surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">Мои ответы</h2>
              <span className="text-[10px] text-cream-100/35">
                активность: {activityRank >= 0 ? `#${activityRank + 1}` : "—"} · симпатии:{" "}
                {appreciationRank >= 0 ? `#${appreciationRank + 1}` : "—"}
              </span>
            </div>
            {overview.submissions.length === 0 ? (
              <div className="mt-2 rounded-xl border border-dashed border-cream-100/15 p-4 text-center">
                <p className="text-2xl" aria-hidden="true">
                  🎁
                </p>
                <p className="mt-1 text-xs text-cream-100/55">Пока ни одного ответа — начни с открытого задания.</p>
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-cream-100/8">
                {overview.submissions.map((submission) => {
                  const status = STATUS_LABELS[submission.status] ?? STATUS_LABELS.pending;
                  return (
                    <li key={submission.submissionId} className="flex flex-wrap items-center gap-1.5 py-2">
                      <span className="w-5 text-[11px] font-bold text-gold-300">{submission.taskNumber}</span>
                      <Link
                        href={`/tasks/${submission.taskSlug}`}
                        className="min-w-0 flex-1 truncate text-[11px] text-cream-100/80 hover:text-lime-300"
                      >
                        {submission.taskTitle}
                      </Link>
                      <span className={`${status.className} !text-[9px]`}>{status.label}</span>
                      <span className="w-9 text-right text-[10px] text-berry-400">{submission.likes} ♥</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href="/feed" className="btn-ghost !px-3 !py-1.5 !text-[11px]">
                Лента ответов
              </Link>
              <Link href="/ratings" className="btn-ghost !px-3 !py-1.5 !text-[11px]">
                Рейтинги
              </Link>
            </div>
          </div>

          <div className="surface p-4">
            <h2 className="eyebrow">Приватные данные</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-cream-100/40">
              Не публикуются. Доступны только уполномоченным организаторам. Псевдоним изменить нельзя.
            </p>
            <ActionForm action={updatePrivateProfileAction} submitLabel="Сохранить" className="mt-2.5" compact>
              <div className="space-y-2">
                {[
                  { name: "privateName", label: "Имя и фамилия", value: participant.privateName, type: "text" },
                  { name: "privateEmail", label: "Рабочая почта", value: participant.privateEmail, type: "email" },
                  { name: "privateContact", label: "Мессенджер", value: participant.privateContact, type: "text" },
                  { name: "team", label: "Команда", value: participant.team, type: "text" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="mb-1 block text-[10px] font-medium text-cream-100/55" htmlFor={field.name}>
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      defaultValue={field.value ?? ""}
                      className="input !py-1.5 !text-[12px]"
                    />
                  </div>
                ))}
              </div>
            </ActionForm>
          </div>

          <form action={leaveGameAction} className="surface p-4">
            <h2 className="eyebrow">Выйти из профиля</h2>
            <p className="mt-1 text-[10px] text-cream-100/40">
              Ответы останутся на ёлке под псевдонимом. Вернуться можно, создав новый профиль.
            </p>
            <button type="submit" className="btn-ghost mt-2.5 !py-1.5 !text-[11px]">
              Выйти на этом устройстве
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
