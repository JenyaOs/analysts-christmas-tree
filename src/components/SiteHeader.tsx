import Link from "next/link";
import { getCurrentParticipant } from "@/lib/game";
import { aliasEmoji } from "@/lib/format";
import { NavLinks, type NavItem } from "./NavLinks";

export function TreeMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tree-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d5ffa1" />
          <stop offset="100%" stopColor="#17452f" />
        </linearGradient>
      </defs>
      <path d="M24 3 33 17h-5l8 12h-6l9 13H9l9-13H12l8-12h-5z" fill="url(#tree-grad)" />
      <rect x="21" y="41" width="6" height="6" rx="1.5" fill="#ffcb6b" />
      <circle cx="24" cy="10" r="2.2" fill="#ffe3a6" />
      <circle cx="18" cy="24" r="1.8" fill="#ff7fa6" />
      <circle cx="29" cy="33" r="2" fill="#ffe3a6" />
    </svg>
  );
}

const PUBLIC_LINKS: NavItem[] = [
  { href: "/", label: "Ёлка", icon: "🎄" },
  { href: "/about", label: "Об игре", icon: "✨" },
];

const MEMBER_LINKS: NavItem[] = [
  { href: "/", label: "Ёлка", icon: "🎄" },
  { href: "/tasks", label: "Задания", icon: "🎯" },
  { href: "/feed", label: "Ответы", icon: "💬" },
  { href: "/ratings", label: "Рейтинги", icon: "🏆" },
  { href: "/me", label: "Профиль", icon: "🎁" },
];

export async function SiteHeader() {
  const participant = await getCurrentParticipant();
  const links = participant ? MEMBER_LINKS : PUBLIC_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-cream-100/8 bg-pine-950/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <TreeMark className="h-8 w-8" />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-cream-100">Ёлка аналитиков</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-lime-300/60">
              S7 · analysts community
            </span>
          </span>
        </Link>

        <div className="order-3 w-full overflow-hidden sm:order-2 sm:w-auto sm:flex-1">
          <NavLinks links={links} />
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          {participant ? (
            <Link
              href="/me"
              className="flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-[11px] font-semibold text-lime-300 transition hover:border-lime-400/60"
            >
              <span aria-hidden="true">{aliasEmoji(participant.alias)}</span>
              <span className="max-w-[9rem] truncate">{participant.alias}</span>
            </Link>
          ) : (
            <Link href="/me" className="btn-primary !px-4 !py-2 !text-xs">
              Войти в игру
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-15 border-t border-cream-100/8 bg-pine-950/60">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <TreeMark className="h-8 w-8" />
            <p className="text-sm font-semibold text-cream-100">Ёлка аналитиков · 2026</p>
          </div>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-cream-100/50">
            Каждый ответ — новая игрушка. Каждый лайк — немного больше блеска. Каждый участник — часть нашей общей ёлки!
            Ответы публикуются анонимно под игровыми псевдонимами и доступны только участникам игры.
          </p>
        </div>
        <div className="text-xs text-cream-100/55">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-lime-300/60">Участникам</p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/me" className="hover:text-lime-300">
                Профиль участника
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-lime-300">
                Об игре
              </Link>
            </li>
            <li>
              <Link href="/tasks" className="hover:text-lime-300">
                Каталог заданий
              </Link>
            </li>
            <li>
              <Link href="/feed" className="hover:text-lime-300">
                Лента ответов
              </Link>
            </li>
            <li>
              <Link href="/ratings" className="hover:text-lime-300">
                Рейтинги
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-xs text-cream-100/55">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-lime-300/60">Организаторам</p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/admin" className="hover:text-lime-300">
                Панель управления
              </Link>
            </li>
            <li>
              <Link href="/admin/moderation" className="hover:text-lime-300">
                Модерация ответов
              </Link>
            </li>
            <li className="pt-2 text-cream-100/35">Приём ответов: 30.11 — 25.12.2026</li>
            <li className="text-cream-100/35">Финал и награждение: 28–31.12.2026</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-100/8 py-4 text-center text-[11px] text-cream-100/30">
        «Чем больше мы делимся, тем ярче наша общая ёлка!» · Комьюнити аналитиков S7
      </div>
    </footer>
  );
}
