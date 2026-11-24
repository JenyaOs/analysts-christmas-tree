"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string };

export function NavLinks({ links }: { links: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto" aria-label="Основная навигация">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-pill ${active ? "nav-pill-active" : ""}`}
          >
            <span aria-hidden="true" className="text-[13px]">
              {link.icon}
            </span>
            <span className="whitespace-nowrap">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
