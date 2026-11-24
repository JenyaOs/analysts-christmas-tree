"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/lib/actions";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  buttonClassName?: string;
  hidden?: Record<string, string | number>;
  compact?: boolean;
  successColor?: "lime" | "gold";
};

export function ActionForm({
  action,
  children,
  submitLabel,
  className = "",
  buttonClassName = "btn-primary",
  hidden = {},
  compact = false,
  successColor = "lime",
}: Props) {
  const [state, formAction, pending] = useActionState(action, { ok: true } as ActionState);

  return (
    <form action={formAction} className={className}>
      {Object.entries(hidden).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      {children}
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-2" : "mt-4"}`}>
        <button type="submit" className={buttonClassName} disabled={pending}>
          {pending ? "Сохраняем…" : submitLabel}
        </button>
        {state.message ? (
          <span
            className={`text-[11px] leading-tight ${
              state.ok ? (successColor === "gold" ? "text-gold-300" : "text-lime-300") : "text-berry-400"
            }`}
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
