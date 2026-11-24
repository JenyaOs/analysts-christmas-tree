"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { joinGameAction } from "@/lib/actions";
import { aliasEmoji } from "@/lib/format";

export function JoinForm() {
  const [state, formAction, pending] = useActionState(joinGameAction, { ok: true });
  const router = useRouter();

  if (state.ok && state.message) {
    return (
      <div className="surface animate-pop p-6 text-center">
        <p className="text-4xl" aria-hidden="true">
          🎉🎄
        </p>
        <h2 className="mt-3 text-xl font-bold text-cream-100">Добро пожаловать в игру!</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream-100/65">
          Твой игровой псевдоним —{" "}
          <span className="font-semibold text-lime-300">
            {aliasEmoji(state.message)} {state.message}
          </span>
          . Под ним будут публиковаться ответы. Настоящее имя и контакты видят только организаторы.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={() => router.refresh()}>
            Перейти в профиль
          </button>
          <Link href="/tasks" className="btn-ghost">
            К заданиям
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="surface p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="privateName">
            Имя и фамилия <span className="text-berry-400">*</span>
          </label>
          <p className="field-hint mb-1.5">Видно только организаторам — никогда не публикуется.</p>
          <input id="privateName" name="privateName" className="input" placeholder="Как к тебе обращаться" required />
          {state.errors?.privateName ? <p className="mt-1 text-[11px] text-berry-400">{state.errors.privateName}</p> : null}
        </div>
        <div>
          <label className="field-label" htmlFor="privateEmail">
            Рабочая почта
          </label>
          <p className="field-hint mb-1.5">Для связи по итогам игры и призов.</p>
          <input id="privateEmail" name="privateEmail" type="email" className="input" placeholder="name@example.com" />
          {state.errors?.privateEmail ? <p className="mt-1 text-[11px] text-berry-400">{state.errors.privateEmail}</p> : null}
        </div>
        <div>
          <label className="field-label" htmlFor="privateContact">
            Контакт в мессенджере
          </label>
          <p className="field-hint mb-1.5">Необязательно. Только для организаторов.</p>
          <input id="privateContact" name="privateContact" className="input" placeholder="@nickname" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="team">
            Команда или направление
          </label>
          <p className="field-hint mb-1.5">Необязательно. Помогает организаторам в статистике.</p>
          <input id="team" name="team" className="input" placeholder="Например, команда карточных продуктов" />
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-lime-400/20 bg-lime-400/5 p-3 text-[11px] leading-relaxed text-cream-100/60">
        🔒 Приватные данные хранятся отдельно от публичного игрового профиля. В ответах и рейтингах виден только
        псевдоним — его мы сгенерируем автоматически. Пожалуйста, не указывай персональные данные других людей в
        публичных ответах.
      </p>

      {!state.ok && state.message ? <p className="mt-3 text-xs text-berry-400">{state.message}</p> : null}

      <div className="mt-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Создаём игровой профиль…" : "Присоединиться к «Ёлке аналитиков»"}
        </button>
      </div>
    </form>
  );
}
