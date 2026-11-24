import Link from "next/link";
import { notFound } from "next/navigation";
import { getTaskPhase, PHASE_LABELS, type GameField } from "@/lib/answers";
import { getTaskById, isOrganizer } from "@/lib/game";
import {
  createFieldAction,
  deleteFieldAction,
  moveFieldAction,
  updateFieldAction,
  updateTaskAction,
} from "@/lib/actions";
import { ActionForm } from "@/components/ActionForm";
import { AdminGate, AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  text: "Однострочный текст",
  textarea: "Многострочный текст",
  radio: "Одиночный выбор",
  checkbox: "Множественный выбор",
  rating: "Числовая оценка",
  checklist: "Чек-лист",
  date: "Дата",
  url: "Ссылка",
  cards: "Повторяющиеся карточки",
};

const TYPES = Object.keys(TYPE_LABELS);

const CONDITION_OPS = [
  { value: "equals", label: "равно" },
  { value: "notEquals", label: "не равно" },
  { value: "includes", label: "включает" },
  { value: "notIncludes", label: "не включает" },
  { value: "answered", label: "заполнено" },
];

function toLocalInput(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

function OptionsTextarea({ field }: { field?: GameField }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-cream-100/45">
        Варианты ответа (по одному в строке)
      </label>
      <textarea
        name="options"
        rows={5}
        defaultValue={(field?.options ?? []).join("\n")}
        className="textarea !text-[12px]"
        placeholder={"Вариант 1\nВариант 2"}
      />
    </div>
  );
}

function ConditionInputs({ field, fields }: { field?: GameField; fields: GameField[] }) {
  return (
    <div className="rounded-xl border border-cream-100/12 bg-pine-950/40 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gold-300">Условное отображение</p>
      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
        <select name="conditionField" defaultValue={field?.condition?.fieldKey ?? ""} className="input !text-[12px]">
          <option value="">— всегда показывать —</option>
          {fields.map((candidate) => (
            <option key={candidate.key} value={candidate.key}>
              {candidate.label}
            </option>
          ))}
        </select>
        <select name="conditionOp" defaultValue={field?.condition?.op ?? "equals"} className="input !text-[12px]">
          {CONDITION_OPS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="conditionValues"
        rows={2}
        defaultValue={(field?.condition?.values ?? []).join("\n")}
        className="textarea mt-1.5 !text-[12px]"
        placeholder="Значения условия (по одному в строке)"
      />
    </div>
  );
}

function FieldInputs({ field, fields }: { field?: GameField; fields: GameField[] }) {
  return (
    <div className="grid gap-2.5">
      <div className="grid gap-2 sm:grid-cols-[1fr_150px_130px]">
        <input
          name="label"
          defaultValue={field?.label ?? ""}
          className="input !text-[12px]"
          placeholder="Вопрос / название поля"
          required
        />
        <select name="type" defaultValue={field?.type ?? "text"} className="input !text-[12px]">
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input name="key" defaultValue={field?.key ?? ""} className="input !text-[12px]" placeholder="системный_ключ" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="groupLabel"
          defaultValue={field?.groupLabel ?? ""}
          className="input !text-[12px]"
          placeholder="Блок / секция (необязательно)"
        />
        <input
          name="placeholder"
          defaultValue={field?.placeholder ?? ""}
          className="input !text-[12px]"
          placeholder="Placeholder"
        />
      </div>
      <input
        name="helpText"
        defaultValue={field?.helpText ?? ""}
        className="input !text-[12px]"
        placeholder="Подсказка под полем"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <OptionsTextarea field={field} />
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-cream-100/45">
              Поля карточки (Название|тип|required|варианты через ;)
            </label>
            <textarea
              name="cardFields"
              rows={4}
              defaultValue={(field?.cardFields ?? [])
                .map(
                  (cardField) =>
                    `${cardField.label}|${cardField.type}|${cardField.required ? "required" : "optional"}|${(cardField.options ?? []).join(";")}`,
                )
                .join("\n")}
              className="textarea !text-[12px]"
              placeholder={"Тип идеи|radio|required|Классический;Неожиданный;Креативный\nИдея|text|required"}
            />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <label className="text-[10px] text-cream-100/45">
              min карт.
              <input
                name="minCards"
                type="number"
                min={1}
                defaultValue={field?.minCards ?? 1}
                className="input mt-0.5 !px-2 !py-1 !text-[11px]"
              />
            </label>
            <label className="text-[10px] text-cream-100/45">
              max карт.
              <input
                name="maxCards"
                type="number"
                min={1}
                defaultValue={field?.maxCards ?? 5}
                className="input mt-0.5 !px-2 !py-1 !text-[11px]"
              />
            </label>
            <label className="text-[10px] text-cream-100/45">
              оценка от
              <input
                name="numberMin"
                type="number"
                defaultValue={field?.numberMin ?? 1}
                className="input mt-0.5 !px-2 !py-1 !text-[11px]"
              />
            </label>
            <label className="text-[10px] text-cream-100/45">
              оценка до
              <input
                name="numberMax"
                type="number"
                defaultValue={field?.numberMax ?? 10}
                className="input mt-0.5 !px-2 !py-1 !text-[11px]"
              />
            </label>
          </div>
        </div>
      </div>
      <ConditionInputs field={field} fields={fields} />
      <div className="flex flex-wrap gap-4 text-[11px] text-cream-100/70">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="required" defaultChecked={field?.required} className="h-3.5 w-3.5 accent-[#a8e063]" />
          Обязательное поле
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            name="publish"
            defaultChecked={field?.publish ?? true}
            className="h-3.5 w-3.5 accent-[#a8e063]"
          />
          Публиковать в ответе
        </label>
      </div>
    </div>
  );
}

export default async function AdminTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organizer = await isOrganizer();
  if (!organizer) {
    return (
      <div className="space-y-4">
        <AdminNav active="/admin" />
        <AdminGate />
      </div>
    );
  }

  const task = await getTaskById(Number(id));
  if (!task) notFound();

  const phase = getTaskPhase(task);
  const publicUrl = `/tasks/${task.slug}`;

  return (
    <div className="space-y-5">
      <AdminNav active="/admin" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin" className="text-xs text-cream-100/55 hover:text-lime-300">
            ← Все задания
          </Link>
          <h1 className="mt-1 font-display text-2xl text-cream-100">
            Задание №{task.number}. {task.title}
          </h1>
          <p className="mt-1 text-[11px] text-cream-100/45">
            {PHASE_LABELS[phase]} · {task.fields.length} полей · неделя {task.week}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={publicUrl} className="btn-ghost !py-1.5 !text-[11px]">
            Открыть страницу →
          </Link>
        </div>
      </div>

      <section className="surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-lime-300">Настройки задания</h2>
        <ActionForm action={updateTaskAction} submitLabel="Сохранить настройки" className="mt-3" hidden={{ taskId: task.id }}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[11px] text-cream-100/60">
              Название
              <input name="title" defaultValue={task.title} className="input mt-1 !text-[12px]" required />
            </label>
            <label className="text-[11px] text-cream-100/60">
              Инструмент
              <input name="tool" defaultValue={task.tool ?? ""} className="input mt-1 !text-[12px]" />
            </label>
            <label className="text-[11px] text-cream-100/60">
              Дата публикации (текст)
              <input name="dateLabel" defaultValue={task.dateLabel ?? ""} className="input mt-1 !text-[12px]" />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[11px] text-cream-100/60">
                Неделя
                <input name="week" type="number" min={1} max={4} defaultValue={task.week} className="input mt-1 !text-[12px]" />
              </label>
              <label className="text-[11px] text-cream-100/60 col-span-2">
                Название недели
                <input name="weekTitle" defaultValue={task.weekTitle ?? ""} className="input mt-1 !text-[12px]" />
              </label>
            </div>
            <label className="text-[11px] text-cream-100/60 sm:col-span-2">
              Описание
              <textarea name="description" rows={7} defaultValue={task.description} className="textarea mt-1 !text-[12px]" />
            </label>
            <label className="text-[11px] text-cream-100/60 sm:col-span-2">
              Пример (подсказка участникам)
              <textarea name="example" rows={3} defaultValue={task.example ?? ""} className="textarea mt-1 !text-[12px]" />
            </label>
            <label className="text-[11px] text-cream-100/60">
              Дата открытия (МСК, 00:00)
              <input name="publishAt" type="datetime-local" defaultValue={toLocalInput(task.publishAt)} className="input mt-1 !text-[12px]" />
            </label>
            <label className="text-[11px] text-cream-100/60">
              Дедлайн приёма ответов (МСК)
              <input name="closesAt" type="datetime-local" defaultValue={toLocalInput(task.closesAt)} className="input mt-1 !text-[12px]" />
            </label>
            <label className="text-[11px] text-cream-100/60">
              Приём ответов
              <select name="manualState" defaultValue={task.manualState} className="input mt-1 !text-[12px]">
                <option value="auto">По календарю (00:00 МСК)</option>
                <option value="open">Открыть досрочно</option>
                <option value="closed">Закрыть досрочно</option>
              </select>
            </label>
            <label className="text-[11px] text-cream-100/60">
              Баллы активности
              <input name="points" type="number" min={0} defaultValue={task.points} className="input mt-1 !text-[12px]" />
            </label>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-4 text-[11px] text-cream-100/70">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="isPublished" defaultChecked={task.isPublished} className="h-3.5 w-3.5 accent-[#a8e063]" />
              Опубликовано в каталоге
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                name="moderationEnabled"
                defaultChecked={task.moderationEnabled}
                className="h-3.5 w-3.5 accent-[#a8e063]"
              />
              Ответы проходят модерацию
            </label>
          </div>
        </ActionForm>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-lime-300">
            Поля формы ({task.fields.length})
          </h2>
          <p className="text-[11px] text-cream-100/45">Порядок, обязательность и условия — без изменения кода</p>
        </div>

        {task.fields.map((field, index) => (
          <details key={field.id} className="surface p-4">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-xs text-cream-100/85">
              <span className="font-bold text-gold-300">{index + 1}</span>
              <span className="font-semibold">{field.label}</span>
              <span className="chip chip-muted !text-[9px]">{TYPE_LABELS[field.type]}</span>
              {field.required ? <span className="chip !text-[9px]">обязательное</span> : null}
              {field.condition ? <span className="chip chip-gold !text-[9px]">условие</span> : null}
              <span className="text-[10px] text-cream-100/35">{field.key}</span>
            </summary>
            <div className="mt-3 space-y-2">
              <ActionForm
                action={updateFieldAction}
                submitLabel="Сохранить поле"
                hidden={{ fieldId: field.id, taskId: task.id }}
                compact
                buttonClassName="btn-primary !px-3 !py-1.5 !text-[11px]"
              >
                <FieldInputs field={field} fields={task.fields} />
              </ActionForm>
              <div className="flex flex-wrap items-center gap-2 border-t border-cream-100/10 pt-2">
                {[
                  { direction: "up", label: "↑ Выше" },
                  { direction: "down", label: "↓ Ниже" },
                ].map((option) => (
                  <form key={option.direction} action={moveFieldAction}>
                    <input type="hidden" name="fieldId" value={field.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="direction" value={option.direction} />
                    <button type="submit" className="btn-ghost !px-2 !py-1 !text-[10px]">
                      {option.label}
                    </button>
                  </form>
                ))}
                <form action={deleteFieldAction} className="ml-auto">
                  <input type="hidden" name="fieldId" value={field.id} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <button type="submit" className="text-[10px] text-berry-400 hover:underline">
                    Удалить поле
                  </button>
                </form>
              </div>
            </div>
          </details>
        ))}

        <details className="surface border-lime-400/30 p-4">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-lime-300">
            + Добавить новое поле
          </summary>
          <ActionForm
            action={createFieldAction}
            submitLabel="Добавить поле"
            className="mt-3"
            hidden={{ taskId: task.id }}
            buttonClassName="btn-primary !px-3 !py-1.5 !text-[11px]"
          >
            <FieldInputs fields={task.fields} />
          </ActionForm>
        </details>
      </section>

      <section className="surface p-4 text-[11px] leading-relaxed text-cream-100/50">
        <p className="font-semibold text-cream-100/75">Подсказки по настройке</p>
        <ul className="mt-1.5 space-y-1">
          <li>· Для заданий №3 и №9 оценка формата показывается, если ответ на вопрос об участии не равен «Не участвовал(а)».</li>
          <li>· Для задания №8 используйте поле «Повторяющиеся карточки» с min=max=3 и полями карточки «Тип идеи|radio|required|…».</li>
          <li>· Снятая галочка «Публиковать в ответе» скрывает значение поля из публичной ленты (например, для служебных вопросов).</li>
          <li>· Изменение ключа поля разрывает связь с уже отправленными ответами — меняйте его только при необходимости.</li>
        </ul>
      </section>
    </div>
  );
}
