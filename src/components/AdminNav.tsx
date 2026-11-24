import Link from "next/link";
import { organizerLogoutAction } from "@/lib/actions";

const LINKS = [
  { href: "/admin", label: "Задания" },
  { href: "/admin/moderation", label: "Модерация" },
  { href: "/admin/participants", label: "Участники" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <div className="surface flex flex-wrap items-center gap-2 p-2.5">
      <span className="chip chip-gold ml-1">Организатор</span>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            active === link.href
              ? "bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/40"
              : "text-cream-100/65 hover:bg-cream-100/5 hover:text-cream-100"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <form action={organizerLogoutAction} className="ml-auto">
        <button type="submit" className="btn-ghost !px-3 !py-1.5 !text-[11px]">
          Выйти
        </button>
      </form>
    </div>
  );
}

export function AdminGate() {
  return (
    <div className="surface p-6 text-center">
      <p className="text-3xl" aria-hidden="true">
        🔐
      </p>
      <h2 className="mt-2 text-lg font-semibold text-cream-100">Нужен доступ организатора</h2>
      <p className="mt-1 text-xs text-cream-100/55">Войди в панель, чтобы управлять заданиями и модерацией.</p>
      <Link href="/admin" className="btn-primary mt-4">
        Перейти к входу
      </Link>
    </div>
  );
}
