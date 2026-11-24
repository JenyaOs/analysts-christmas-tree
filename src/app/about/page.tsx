import Link from "next/link";

export const metadata = {
  title: "Об игре · Ёлка аналитиков",
};

const STEPS = [
  { icon: "📅", title: "Получаем задания", text: "По понедельникам, средам и пятницам — по одному новому заданию. Форма открывается ровно в 00:00 МСК." },
  { icon: "✍️", title: "Выполняем", text: "Заполняем форму с аналитическим инструментом и проверяем ответ перед отправкой." },
  { icon: "🎀", title: "Украшаем ёлку", text: "Каждый принятый ответ добавляет новую игрушку на общую виртуальную ёлку." },
  { icon: "❤️", title: "Ставим лайки", text: "Читаем анонимные ответы участников и голосуем за понравившиеся." },
  { icon: "⭐", title: "Набираем баллы", text: "Активность — за выполненные задания, симпатии — за полученные лайки." },
  { icon: "🏆", title: "Следим за рейтингами", text: "Два рейтинга, достижения и итоги игры 28–31 декабря." },
];

const ACCESS = [
  { icon: "🌍", title: "Ёлка — всем", text: "Общая ёлка и её статистика видны без входа и на весь экран." },
  { icon: "🔒", title: "Игрушки — участникам", text: "Читать анонимные ответы и ставить лайки могут только участники игры." },
  { icon: "🎯", title: "Задания — из профиля", text: "Каталог заданий и формы открываются внутри профиля участника." },
];

const PRIVACY = [
  "Публикуются только ответы под игровыми псевдонимами.",
  "Реальные имена и контакты хранятся отдельно и доступны только организаторам.",
  "Перед отправкой участник видит, как ответ будет выглядеть для других.",
  "Модератор может скрыть или удалить ответ с персональными данными.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="surface-glass relative overflow-hidden p-6 sm:p-8">
        <div className="tree-aurora pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full" aria-hidden="true" />
        <div className="relative">
          <p className="eyebrow">Новогодняя игра · Комьюнити аналитиков S7</p>
          <h1 className="display-title mt-3 text-[clamp(2rem,5vw,3.4rem)]">
            12 заданий,
            <br />
            одна общая ёлка
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream-100/65">
            30 ноября — 25 декабря 2026. Применяем аналитические инструменты к рабочим и повседневным ситуациям, делимся
            ответами и вместе украшаем ёлку сообщества.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/" className="btn-primary">
              Посмотреть ёлку
            </Link>
            <Link href="/me" className="btn-ghost">
              Войти в игру
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title} className="surface p-4">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-100/10 bg-cream-100/5 text-base">
                {step.icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cream-100/30">
                0{index + 1}
              </span>
            </div>
            <h2 className="mt-2 text-sm font-semibold text-cream-100">{step.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-cream-100/55">{step.text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {ACCESS.map((item) => (
          <div key={item.title} className="surface-glass p-4">
            <p className="text-lg" aria-hidden="true">
              {item.icon}
            </p>
            <h2 className="mt-1 text-sm font-semibold text-cream-100">{item.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-cream-100/55">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="surface p-5 sm:p-6">
        <h2 className="section-title">Конфиденциальность</h2>
        <ul className="mt-3 grid gap-2 text-xs leading-relaxed text-cream-100/60 sm:grid-cols-2">
          {PRIVACY.map((item) => (
            <li key={item} className="rounded-xl border border-cream-100/8 bg-cream-100/4 p-2.5">
              · {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-light flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="max-w-xl text-sm font-medium leading-relaxed text-pine-900">
          Главный принцип игры: «Чем больше мы делимся, тем ярче наша общая ёлка!»
        </p>
        <Link href="/me" className="btn-primary">
          Присоединиться
        </Link>
      </section>
    </div>
  );
}
