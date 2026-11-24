import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getTaskPhase, PHASE_LABELS } from "@/lib/answers";
import { getGameStats, getTasksForAdmin, isOrganizer } from "@/lib/game";
import { organizerLoginAction, setTaskStateAction, toggleTaskPublishedAction } from "@/lib/actions";
import { ActionForm } from "@/components/ActionForm";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const organizer = await isOrganizer();

  if (!organizer) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <header className="text-center">
          <p className="chip chip-gold">Панель организатора</p>
          <h1 className="section-title mt-3">Управление «Ёлкой аналитиков»</h1>
          <p className="mt-2 text-xs text-cream-100/55">
            Здесь можно менять задания, поля, условную логику, дедлайны и модерировать ответы — без изменения кода.
          </p>
        </header>
        <ActionForm action={organizerLoginAction} submitLabel="Войти" className="surface p-5">
          <label className="field-label" htmlFor="code">
            Код организатора
          </label>
          <input id="code" name="code" type="password" className="input mt-1.5" placeholder="Введите код" required />
          <p className="field-hint mt-2">
            Код задаётся переменной окружения <code className="text-lime-300">ADMIN_CODE</code>. В демо-режиме
            используется <code className="text-gold-300">elka2026</code>.
          </p>
        </ActionForm>
      </div>
    );
  }

  const [tasks, stats] = await Promise.all([getTasksForAdmin(), getGameStats()]);

  return (
    <div className="space-y-5">
      <AdminNav active="/admin" />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip">Администрирование</p>
          <h1 className="section-title mt-2">Задания и приём ответов</h1>
          <p className="mt-1 max-w-xl text-xs text-cream-100/55">
            Все 12 заданий уже загружены при первоначальной настройке. Названия, описания, вопросы, обязательность,
            условная логика, даты и публикация настраиваются здесь.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "заданий", value: stats.tasks },
            { label: "игрушек", value: stats.ornaments },
            { label: "на модерации", value: stats.pending },
            { label: "участников", value: stats.participants },
          ].map((item) => (
            <div key={item.label} className="surface px-3 py-2 text-center">
              <p className="font-display text-lg font-bold text-cream-100">{item.value}</p>
              <p className="text-[9px] uppercase tracking-[0.08em] text-cream-100/40">{item.label}</p>
            </div>
          ))}
        </div>
      </header>

      {stats.pending > 0 ? (
        <Link
          href="/admin/moderation"
          className="surface flex flex-wrap items-center justify-between gap-2 border-gold-300/30 bg-gold-300/8 p-4 hover:border-gold-300/60"
        >
          <span className="text-xs text-gold-300">
            {stats.pending} ответ(ов) ждут модерации — без проверки они не появятся на ёлке.
          </span>
          <span className="text-xs font-semibold text-gold-300">Открыть очередь →</span>
        </Link>
      ) : null}

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="border-b border-cream-100/10 text-[10px] uppercase tracking-[0.1em] text-cream-100/40">
            <tr>
              <th className="px-3 py-2.5">№</th>
              <th className="px-3 py-2.5">Задание</th>
              <th className="px-3 py-2.5">Публикация</th>
              <th className="px-3 py-2.5">Статус</th>
              <th className="px-3 py-2.5">Приём ответов</th>
              <th className="px-3 py-2.5">Ответы</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100/8">
            {tasks.map((task) => {
              const phase = getTaskPhase(task);
              return (
                <tr key={task.id} className="align-top">
                  <td className="px-3 py-3 font-bold text-gold-300">{task.number}</td>
                  <td className="max-w-[260px] px-3 py-3">
                    <p className="font-semibold text-cream-100">{task.title}</p>
                    <p className="mt-0.5 text-[10px] text-cream-100/40">
                      {task.weekTitle} · {task.fields.length} полей · {task.points} б.
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-cream-100/60">
                    {task.dateLabel}
                    <br />
                    <span className="text-cream-100/35">до {formatDateTime(task.closesAt)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`chip ${phase === "open" ? "" : phase === "closed" ? "chip-gold" : "chip-muted"}`}>
                      {PHASE_LABELS[phase]}
                    </span>
                    <span className="mt-1 block text-[10px] text-cream-100/35">
                      {task.isPublished ? "опубликовано" : "черновик"} · {task.moderationEnabled ? "модерация" : "авто"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {[
                        { value: "open", label: "Открыть сейчас" },
                        { value: "auto", label: "По календарю" },
                        { value: "closed", label: "Закрыть" },
                      ].map((option) => (
                        <form key={option.value} action={setTaskStateAction}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="state" value={option.value} />
                          <button
                            type="submit"
                            className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                              task.manualState === option.value
                                ? "border-lime-400/70 bg-lime-400/15 text-lime-300"
                                : "border-cream-100/15 text-cream-100/55 hover:border-lime-400/50"
                            }`}
                          >
                            {option.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-cream-100/60">
                    <span className="text-lime-300">{task.approvedAnswers}</span> опубл.
                    <br />
                    <span className="text-gold-300">{task.pendingAnswers}</span> в очереди
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <Link href={`/admin/tasks/${task.id}`} className="text-[11px] text-lime-300 link-underline">
                        Редактировать
                      </Link>
                      <form action={toggleTaskPublishedAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button type="submit" className="text-[10px] text-cream-100/45 hover:text-cream-100">
                          {task.isPublished ? "Снять с публикации" : "Опубликовать"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="surface p-4 text-xs leading-relaxed text-cream-100/55">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-lime-300">Универсальный механизм форм</p>
          <p className="mt-1.5">
            Формы собираются из конфигурации полей: однострочный и многострочный текст, одиночный и множественный выбор,
            числовая оценка, чек-лист, дата, ссылка и повторяющиеся карточки. Обязательность, варианты и условное
            отображение настраиваются без кода.
          </p>
        </div>
        <div className="surface p-4 text-xs leading-relaxed text-cream-100/55">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-300">Модерация и приватность</p>
          <p className="mt-1.5">
            Ответы публикуются под псевдонимами после проверки. Организатор может одобрить, отклонить, скрыть или удалить
            ответ. Контактные данные участников доступны только в разделе «Участники».
          </p>
          <Link href="/admin/participants" className="mt-2 inline-block text-lime-300 link-underline">
            Приватные данные участников →
          </Link>
        </div>
      </div>
    </div>
  );
}
