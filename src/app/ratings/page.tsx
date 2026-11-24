import Link from "next/link";
import { aliasEmoji, formatNumber, plural } from "@/lib/format";
import {
  getActivityLeaderboard,
  getAppreciationLeaderboard,
  getCurrentParticipant,
  getGameStats,
} from "@/lib/game";
import { ParticipantGate } from "@/components/ParticipantGate";

export const dynamic = "force-dynamic";

function Leaderboard({
  rows,
  participantId,
  unit,
  accent,
}: {
  rows: Array<{ participantId: number; alias: string; value: number; submissionCount?: number }>;
  participantId?: number;
  unit: string;
  accent: "lime" | "berry";
}) {
  const max = rows[0]?.value ?? 1;
  return (
    <ol className="mt-3 space-y-2">
      {rows.map((row, index) => {
        const mine = row.participantId === participantId;
        return (
          <li
            key={row.participantId}
            className={`relative overflow-hidden rounded-xl border px-3 py-2 ${
              mine ? "border-lime-400/50 bg-lime-400/10" : "border-cream-100/10 bg-cream-100/5"
            }`}
          >
            <div
              className={`absolute inset-y-0 left-0 ${
                accent === "lime" ? "bg-lime-400/10" : "bg-berry-400/10"
              }`}
              style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  index === 0
                    ? "bg-gold-300 text-pine-950"
                    : index === 1
                      ? "bg-cream-200/80 text-pine-950"
                      : index === 2
                        ? "bg-gold-400/40 text-pine-950"
                        : "bg-cream-100/10 text-cream-100/60"
                }`}
              >
                {index + 1}
              </span>
              <span className="flex-1 truncate text-xs text-cream-100/85">
                {aliasEmoji(row.alias)} {row.alias}
                {mine ? <span className="chip chip-gold ml-2">ты</span> : null}
              </span>
              <span className={`text-xs font-semibold ${accent === "lime" ? "text-lime-300" : "text-berry-400"}`}>
                {formatNumber(row.value)} {unit}
              </span>
            </div>
          </li>
        );
      })}
      {rows.length === 0 ? (
        <li className="rounded-xl border border-dashed border-cream-100/15 p-4 text-center text-xs text-cream-100/45">
          Рейтинг пока пуст. Первые ответы — и здесь появятся имена.
        </li>
      ) : null}
    </ol>
  );
}

export default async function RatingsPage() {
  const participant = await getCurrentParticipant();

  if (!participant) {
    return (
      <ParticipantGate
        icon="🏆"
        title="Рейтинги открыты участникам"
        description="Активность и симпатии участников видны внутри игры. Войди в профиль, чтобы увидеть свою позицию и достижения."
      />
    );
  }

  const [activity, appreciation, stats] = await Promise.all([
    getActivityLeaderboard(20),
    getAppreciationLeaderboard(20),
    getGameStats(),
  ]);

  return (
    <div className="space-y-7">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/me" className="text-[11px] text-cream-100/45 hover:text-lime-300">
            ← Профиль участника
          </Link>
          <span className="chip">Рейтинги и признание</span>
        </div>
        <h1 className="display-title mt-3 text-[clamp(1.9rem,4.6vw,3rem)]">Кто делает ёлку ярче</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-100/65">
          Два индивидуальных рейтинга: активность (выполненные задания) и симпатии (лайки, полученные на ответы). В конце
          игры подводим итоги, публикуем лучшие ответы, объявляем победителей и вручаем призы.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="chip chip-muted">
            {stats.participants} {plural(stats.participants, "участник", "участника", "участников")}
          </span>
          <span className="chip chip-muted">{stats.ornaments} игрушек</span>
          <span className="chip chip-muted">{stats.likes} симпатий</span>
          <span className="chip chip-gold">Финал: 28–31 декабря</span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-lime-300">Рейтинг активности</h2>
            <span className="text-[10px] text-cream-100/40">баллы за задания</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-cream-100/45">
            За каждое принятое задание начисляются баллы активности. Повторная отправка ответа не добавляет баллы.
          </p>
          <Leaderboard rows={activity} participantId={participant.id} unit="б." accent="lime" />
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-berry-400">Рейтинг симпатий</h2>
            <span className="text-[10px] text-cream-100/40">лайки на ответах</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-cream-100/45">
            Баллы симпатий — это лайки, полученные на опубликованные ответы. За свой ответ проголосовать нельзя.
          </p>
          <Leaderboard rows={appreciation} participantId={participant.id} unit="♥" accent="berry" />
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Как начисляются баллы",
            items: [
              "10 баллов за каждое принятое задание",
              "15 баллов за итоговую ретроспективу №12",
              "1 лайк = 1 балл симпатий",
              "Один ответ на задание от участника",
            ],
          },
          {
            title: "Что учитывает модерация",
            items: [
              "Соответствие заданию и инструменту",
              "Отсутствие персональных данных",
              "Уважительный тон",
              "Скрытые и удалённые ответы не участвуют в рейтингах",
            ],
          },
          {
            title: "Итоги и призы",
            items: [
              "Лучшие идеи и ответы участников",
              "Награждение и специальные номинации",
              "Публикация итоговой статистики",
              "Финальная сияющая ёлка",
            ],
          },
        ].map((block) => (
          <div key={block.title} className="surface p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-gold-300">{block.title}</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-cream-100/65">
              {block.items.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="surface-light flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-pine-700/70">Финал: 28–31 декабря</p>
          <p className="mt-1 max-w-lg text-sm font-medium leading-relaxed text-pine-900">
            Праздничное подведение итогов: лучшие идеи и ответы, награждение и специальные номинации, итоговая статистика и
            финальная сияющая ёлка.
          </p>
        </div>
        <Link href="/tree" className="btn-primary">
          Посмотреть ёлку
        </Link>
      </section>
    </div>
  );
}
