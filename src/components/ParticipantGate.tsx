import Link from "next/link";

export function ParticipantGate({
  title = "Раздел доступен участникам игры",
  description = "Задания, анонимные ответы и рейтинги открываются после входа в игровой профиль. Ёлка видна всем — а игрушки и идеи участников доступны только внутри игры.",
  icon = "🔒",
}: {
  title?: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="surface-glass relative overflow-hidden p-7 text-center sm:p-10">
        <div className="tree-aurora pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full" aria-hidden="true" />
        <div className="relative">
          <p className="text-4xl" aria-hidden="true">
            {icon}
          </p>
          <p className="eyebrow mt-4">Ёлка аналитиков · доступ участника</p>
          <h1 className="display-title mt-2 text-[clamp(1.7rem,4vw,2.6rem)]">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-100/65">{description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/me" className="btn-primary">
              Войти в игровой профиль
            </Link>
            <Link href="/" className="btn-ghost">
              К общей ёлке
            </Link>
          </div>
          <div className="mt-6 grid gap-2 text-left sm:grid-cols-3">
            {[
              { icon: "🎯", title: "12 заданий", text: "формы и дедлайны" },
              { icon: "💬", title: "Анонимные ответы", text: "только участникам" },
              { icon: "🏆", title: "Рейтинги", text: "активность и симпатии" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-cream-100/10 bg-cream-100/4 p-3">
                <p className="text-lg" aria-hidden="true">
                  {item.icon}
                </p>
                <p className="mt-1 text-xs font-semibold text-cream-100">{item.title}</p>
                <p className="text-[10px] text-cream-100/45">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
