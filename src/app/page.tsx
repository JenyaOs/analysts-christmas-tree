import Link from "next/link";
import { aliasEmoji, formatDateTime, formatNumber, plural } from "@/lib/format";
import {
  getActivityLeaderboard,
  getAppreciationLeaderboard,
  getApprovedFeed,
  getAllTasks,
  getCurrentParticipant,
  getGameStats,
  getParticipantOverview,
} from "@/lib/game";
import { getTaskPhase } from "@/lib/answers";
import { TreeScene, type Ornament } from "@/components/TreeScene";
import { Countdown } from "@/components/Countdown";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const participant = await getCurrentParticipant();
  const [stats, tasks, feed, activity, appreciation] = await Promise.all([
    getGameStats(),
    getAllTasks(),
    getApprovedFeed({ limit: 30, participantId: participant?.id ?? null }),
    getActivityLeaderboard(3),
    getAppreciationLeaderboard(3),
  ]);
  const overview = participant ? await getParticipantOverview(participant.id) : null;

  const ornaments: Ornament[] = feed.map((answer) => ({
    id: answer.id,
    alias: participant ? answer.alias : "",
    likes: answer.likes,
    likedByMe: answer.likedByMe,
    isMine: answer.isMine,
    taskNumber: answer.taskNumber,
    taskTitle: participant ? answer.taskTitle : "",
    taskSlug: answer.taskSlug,
    items: participant ? answer.items : [],
  }));

  const nextTask = tasks.find((task) => getTaskPhase(task) === "upcoming");
  const openTask = tasks.find((task) => getTaskPhase(task) === "open");
  const activityFraction = Math.min(1, stats.ornaments / 40);

  return (
    <div className="space-y-8">
      {/* ---------- Полноэкранная ёлка ---------- */}
      <section className="surface-glass relative isolate overflow-hidden rounded-[2rem]">
        <div className="pointer-events-none absolute inset-0 snow-layer opacity-40" aria-hidden="true" />
        <div className="grid-hero relative p-4 sm:p-6">
          <div className="animate-rise">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="chip chip-gold">30 ноября — 25 декабря 2026</span>
              <span className="chip">12 заданий</span>
              <span className="chip chip-muted">Комьюнити аналитиков S7</span>
            </div>
            <h1 className="display-title mt-4">
              Ёлка
              <br />
              <span className="bg-gradient-to-r from-lime-300 via-lime-400 to-moss-400 bg-clip-text text-transparent">
                аналитиков
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-100/65">
              Общая новогодняя ёлка сообщества: каждая принятая работа участника добавляет игрушку, каждый лайк делает её
              больше и ярче.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {participant ? (
                <>
                  <Link href="/me" className="btn-primary">
                    Мой профиль и задания
                  </Link>
                  <Link href="/feed" className="btn-ghost">
                    Читать ответы
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/me" className="btn-primary">
                    Войти в игру
                  </Link>
                  <Link href="/about" className="btn-ghost">
                    Как это работает
                  </Link>
                </>
              )}
            </div>

            {participant && overview ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-cream-100/55">
                <span>
                  {aliasEmoji(participant.alias)}{" "}
                  <strong className="text-cream-100">{participant.alias}</strong>
                </span>
                <span className="text-cream-100/20">|</span>
                <span>
                  {overview.submissions.length} из {stats.tasks} заданий
                </span>
                <span className="text-lime-300">{overview.activityPoints} б. активности</span>
                <span className="text-berry-400">{overview.likesReceived} ♥</span>
              </div>
            ) : (
              <p className="mt-4 max-w-md rounded-xl border border-lime-400/20 bg-lime-400/6 px-3 py-2 text-[11px] leading-relaxed text-cream-100/60">
                🔒 Ёлку видно всем. Задания и анонимные ответы открываются после входа в игровой профиль участника.
              </p>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "участников", value: stats.participants },
                { label: "игрушек", value: stats.ornaments },
                { label: "симпатий", value: stats.likes },
                { label: "заданий", value: stats.tasks },
              ].map((item) => (
                <div key={item.label} className="stat-tile">
                  <dd className="font-display text-xl font-bold leading-none text-cream-100">{formatNumber(item.value)}</dd>
                  <dt className="mt-1 text-[9px] uppercase tracking-[0.1em] text-cream-100/40">{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative flex justify-center">
            <TreeScene ornaments={ornaments} activity={activityFraction} size="full" locked={!participant} />
          </div>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-cream-100/10 px-4 py-3 text-[11px] text-cream-100/50 sm:px-6">
          <span>
            {formatNumber(stats.ornaments)}{" "}
            {plural(stats.ornaments, "игрушка", "игрушки", "игрушек")} · {formatNumber(stats.likes)} симпатий ·{" "}
            {formatNumber(stats.pending)} на модерации
          </span>
          {nextTask ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-cream-100/40">
                Задание №{nextTask.number} — {formatDateTime(nextTask.publishAt)}
              </span>
              <Countdown target={nextTask.publishAt} compact label="откроется" />
            </span>
          ) : (
            <span className="text-lime-300">Все задания открыты</span>
          )}
        </div>
      </section>

      {/* ---------- Как устроена ёлка ---------- */}
      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            icon: "🎀",
            title: "Количество игрушек",
            text: `${stats.ornaments} ${plural(stats.ornaments, "принятый ответ", "принятых ответа", "принятых ответов")} — столько игрушек уже висит на ёлке.`,
          },
          {
            icon: "📏",
            title: "Размер игрушки",
            text: "Зависит от количества лайков: чем больше симпатий у ответа, тем крупнее шар.",
          },
          {
            icon: "💡",
            title: "Яркость гирлянд",
            text: `Сейчас ${Math.round(activityFraction * 100)}% от максимума — гирлянды светятся ярче вместе с активностью сообщества.`,
          },
        ].map((item) => (
          <div key={item.title} className="surface p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-100/10 bg-cream-100/5 text-base">
                {item.icon}
              </span>
              <h2 className="text-sm font-semibold text-cream-100">{item.title}</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-cream-100/55">{item.text}</p>
          </div>
        ))}
      </section>

      {/* ---------- Что внутри игры ---------- */}
      <section className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
        <div className="surface relative overflow-hidden p-5 sm:p-6">
          <p className="eyebrow">Доступ участника</p>
          <h2 className="section-title mt-2">Внутри игры</h2>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-cream-100/55">
            Всё игровое содержимое открывается из профиля участника: задания, анонимные ответы, рейтинги и личные
            достижения. Публичной остаётся только ёлка.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/tasks", icon: "🎯", title: "Задания", text: "12 форм с аналитическими инструментами" },
              { href: "/feed", icon: "💬", title: "Ответы", text: "анонимная лента и лайки" },
              { href: "/ratings", icon: "🏆", title: "Рейтинги", text: "активность и симпатии" },
              { href: "/me", icon: "🎁", title: "Профиль", text: "псевдоним, баллы, достижения" },
            ].map((card) => (
              <Link
                key={card.href}
                href={participant ? card.href : "/me"}
                className="group rounded-2xl border border-cream-100/10 bg-cream-100/4 p-3 transition hover:border-lime-400/40 hover:bg-lime-400/6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg" aria-hidden="true">
                    {card.icon}
                  </span>
                  <span className="text-[10px] text-cream-100/30 transition group-hover:text-lime-300">
                    {participant ? "→" : "🔒"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-cream-100">{card.title}</p>
                <p className="text-[10px] leading-relaxed text-cream-100/45">{card.text}</p>
              </Link>
            ))}
          </div>
          {openTask ? (
            <p className="mt-3 rounded-xl border border-lime-400/20 bg-lime-400/6 px-3 py-2 text-[11px] text-cream-100/60">
              Сейчас открыто задание №{openTask.number}: «{openTask.title}» ·{" "}
              <Link href={participant ? `/tasks/${openTask.slug}` : "/me"} className="text-lime-300 link-underline">
                {participant ? "перейти к форме" : "войти, чтобы ответить"}
              </Link>
            </p>
          ) : null}
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Лучшие на ёлке</h2>
            <Link href={participant ? "/ratings" : "/me"} className="text-[11px] text-lime-300 link-underline">
              {participant ? "Все рейтинги" : "Войти"}
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {[
              { title: "Активность", rows: activity, accent: "text-lime-300", suffix: "б." },
              { title: "Симпатии", rows: appreciation, accent: "text-berry-400", suffix: "♥" },
            ].map((group) => (
              <div key={group.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cream-100/40">{group.title}</p>
                <ul className="mt-1.5 space-y-1">
                  {group.rows.map((row, index) => (
                    <li key={row.participantId} className="flex items-center gap-2 rounded-lg bg-cream-100/4 px-2.5 py-1.5">
                      <span className="w-4 text-[10px] font-bold text-gold-300">{index + 1}</span>
                      <span className="flex-1 truncate text-[11px] text-cream-100/75">
                        {participant ? `${aliasEmoji(row.alias)} ${row.alias}` : `Участник №${index + 1}`}
                      </span>
                      <span className={`text-[11px] font-semibold ${group.accent}`}>
                        {formatNumber(row.value)} {group.suffix}
                      </span>
                    </li>
                  ))}
                  {group.rows.length === 0 ? (
                    <li className="px-2 text-[11px] text-cream-100/40">Пока пусто — стань первым участником.</li>
                  ) : null}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-cream-100/35">
            Имена участников видны только внутри игры: в публичном режиме показываются позиции без псевдонимов.
          </p>
        </div>
      </section>

      <section className="surface-light flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-pine-700/60">Финал: 28–31 декабря</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-pine-900">
            Лучшие идеи, номинации и финальная сияющая ёлка
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-pine-800/70">
            Каждый ответ — новая игрушка. Каждый лайк — немного больше блеска. Каждый участник — часть нашей общей ёлки!
          </p>
        </div>
        <Link href={participant ? "/me" : "/me"} className="btn-primary">
          {participant ? "К заданиям" : "Присоединиться"}
        </Link>
      </section>
    </div>
  );
}
