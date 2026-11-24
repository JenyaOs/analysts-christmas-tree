import Link from "next/link";
import { getApprovedFeed, getAllTasks, getCurrentParticipant, getGameStats } from "@/lib/game";
import { AnswerCard } from "@/components/AnswerCard";
import { formatNumber } from "@/lib/format";
import { ParticipantGate } from "@/components/ParticipantGate";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; sort?: string }>;
}) {
  const { task: taskSlug, sort = "new" } = await searchParams;
  const participant = await getCurrentParticipant();

  if (!participant) {
    return (
      <ParticipantGate
        icon="💬"
        title="Ответы участников доступны внутри игры"
        description="Читать анонимные ответы и ставить лайки могут только участники. Войди в игровой профиль, чтобы увидеть идеи коллег и поддержать лучшие."
      />
    );
  }

  const [tasks, stats] = await Promise.all([getAllTasks(), getGameStats()]);
  const selectedTask = taskSlug ? tasks.find((item) => item.slug === taskSlug) ?? null : null;

  const feed = await getApprovedFeed({
    taskId: selectedTask?.id,
    participantId: participant.id,
    limit: 60,
    sort: sort === "likes" ? "likes" : "new",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/me" className="text-[11px] text-cream-100/45 hover:text-lime-300">
              ← Профиль участника
            </Link>
            <span className="chip">Лента ответов · только участникам</span>
          </div>
          <h1 className="display-title mt-3 text-[clamp(1.9rem,4.6vw,3rem)]">Анонимные ответы</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-100/65">
            Все ответы опубликованы под игровыми псевдонимами после модерации. Читай, вдохновляйся и ставь лайки — от них
            игрушки на ёлке становятся больше.
          </p>
        </div>
        <div className="flex gap-2 text-center">
          <div className="surface px-3 py-2">
            <p className="font-display text-lg font-bold text-lime-300">{formatNumber(stats.ornaments)}</p>
            <p className="text-[9px] uppercase tracking-[0.1em] text-cream-100/40">опубликовано</p>
          </div>
          <div className="surface px-3 py-2">
            <p className="font-display text-lg font-bold text-berry-400">{formatNumber(stats.likes)}</p>
            <p className="text-[9px] uppercase tracking-[0.1em] text-cream-100/40">симпатий</p>
          </div>
        </div>
      </header>

      <div className="surface flex flex-wrap items-center gap-2 p-3">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`/feed?sort=${sort}`}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              !selectedTask ? "border-lime-400 bg-lime-400/15 text-lime-300" : "border-cream-100/15 text-cream-100/60"
            }`}
          >
            Все задания
          </Link>
          {tasks.map((item) => (
            <Link
              key={item.id}
              href={`/feed?task=${item.slug}&sort=${sort}`}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                selectedTask?.id === item.id
                  ? "border-lime-400 bg-lime-400/15 text-lime-300"
                  : "border-cream-100/15 text-cream-100/60 hover:border-lime-400/40"
              }`}
            >
              №{item.number}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {[
            { key: "new", label: "Сначала новые" },
            { key: "likes", label: "Популярные" },
          ].map((option) => (
            <Link
              key={option.key}
              href={`/feed?sort=${option.key}${selectedTask ? `&task=${selectedTask.slug}` : ""}`}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                sort === option.key
                  ? "border-gold-300 bg-gold-300/15 text-gold-300"
                  : "border-cream-100/15 text-cream-100/60 hover:border-gold-300/50"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {selectedTask ? (
        <div className="surface flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-lime-300/70">Задание №{selectedTask.number}</p>
            <p className="text-sm font-semibold text-cream-100">{selectedTask.title}</p>
          </div>
          <Link href={`/tasks/${selectedTask.slug}`} className="btn-ghost !py-1.5 !text-[11px]">
            Открыть задание →
          </Link>
        </div>
      ) : null}

      {feed.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-3xl" aria-hidden="true">
            ❄️
          </p>
          <p className="mt-2 text-sm text-cream-100/70">
            Здесь пока тихо. Опубликованных ответов нет — но это легко исправить.
          </p>
          <Link href="/tasks" className="btn-primary mt-4">
            Выполнить задание
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {feed.map((answer) => (
            <AnswerCard key={answer.id} answer={answer} />
          ))}
        </div>
      )}

      <div className="surface p-4 text-[11px] leading-relaxed text-cream-100/50">
        Ответы проходят модерацию: организаторы могут скрыть или удалить публикацию, если в ней есть персональные данные,
        некорректные формулировки или она не относится к заданию. Свои ответы можно обновить до закрытия приёма — после
        обновления они снова уходят на модерацию.
      </div>
    </div>
  );
}
