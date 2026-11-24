import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getModerationQueue, getGameStats, isOrganizer } from "@/lib/game";
import { moderateSubmissionAction } from "@/lib/actions";
import { AdminGate, AdminNav } from "@/components/AdminNav";
import { SummaryList } from "@/components/SummaryList";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Ждут проверки" },
  { key: "approved", label: "Опубликованы" },
  { key: "rejected", label: "Отклонены" },
];

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = rawStatus === "approved" || rawStatus === "rejected" ? rawStatus : "pending";
  const organizer = await isOrganizer();

  if (!organizer) {
    return (
      <div className="space-y-4">
        <AdminNav active="/admin/moderation" />
        <AdminGate />
      </div>
    );
  }

  const [rows, stats] = await Promise.all([getModerationQueue(status), getGameStats()]);

  return (
    <div className="space-y-5">
      <AdminNav active="/admin/moderation" />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip chip-gold">Модерация</p>
          <h1 className="section-title mt-2">Ответы участников</h1>
          <p className="mt-1 max-w-xl text-xs text-cream-100/55">
            Проверь ответ, скрой персональные данные при необходимости и прими решение. Одобренный ответ появляется в
            ленте и добавляет игрушку на общую ёлку.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="chip chip-gold">{stats.pending} в очереди</span>
          <span className="chip">{stats.ornaments} опубликовано</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/moderation?status=${tab.key}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              status === tab.key
                ? "border-lime-400 bg-lime-400/15 text-lime-300"
                : "border-cream-100/15 text-cream-100/60 hover:border-lime-400/50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="surface p-8 text-center text-sm text-cream-100/60">
          {status === "pending" ? "Очередь пуста — все ответы проверены. 🎉" : "В этой подборке пока нет ответов."}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="surface p-4 sm:p-5">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-lime-300/70">
                    Задание №{row.taskNumber} · {row.taskTitle}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-cream-100">{row.alias}</p>
                  <p className="text-[10px] text-cream-100/35">
                    отправлен {formatDateTime(row.createdAt)} · id {row.id}
                  </p>
                </div>
                <span className={`chip ${row.status === "approved" ? "" : row.status === "pending" ? "chip-gold" : "chip-muted"}`}>
                  {row.status === "approved" ? "опубликован" : row.status === "pending" ? "на модерации" : "отклонён"}
                </span>
              </header>

              <div className="mt-3 rounded-xl border border-cream-100/10 bg-pine-950/40 p-3">
                <SummaryList items={row.items} dense />
              </div>

              <form action={moderateSubmissionAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="submissionId" value={row.id} />
                <input
                  name="note"
                  className="input !w-auto flex-1 !py-1.5 !text-[11px]"
                  placeholder="Комментарий модератора (необязательно)"
                />
                <button type="submit" name="decision" value="approve" className="btn-primary !px-3 !py-1.5 !text-[11px]">
                  Одобрить
                </button>
                <button type="submit" name="decision" value="reject" className="btn-ghost !px-3 !py-1.5 !text-[11px]">
                  Отклонить
                </button>
                <button type="submit" name="decision" value="pending" className="btn-ghost !px-3 !py-1.5 !text-[11px]">
                  Вернуть в очередь
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="delete"
                  className="rounded-full border border-berry-400/40 px-3 py-1.5 text-[11px] text-berry-400 hover:bg-berry-400/10"
                >
                  Удалить
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      <div className="surface p-4 text-[11px] leading-relaxed text-cream-100/50">
        Отклонённые и удалённые ответы не попадают в рейтинги. Участник увидит комментарий модератора на странице задания
        и сможет отправить исправленный вариант до дедлайна.
      </div>
    </div>
  );
}
