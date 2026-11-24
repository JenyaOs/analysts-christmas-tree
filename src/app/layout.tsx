import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { MusicToggle } from "@/components/MusicToggle";

export const metadata: Metadata = {
  title: "Ёлка аналитиков · Новогодняя игра Комьюнити аналитиков S7",
  description:
    "12 новогодних заданий с аналитическими инструментами. Каждый принятый ответ добавляет игрушку на общую виртуальную ёлку. 30 ноября — 25 декабря 2026.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.45] snow-layer" aria-hidden="true" />
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-5 sm:px-6 sm:pt-6">{children}</main>
        <SiteFooter />
        <MusicToggle />
      </body>
    </html>
  );
}
