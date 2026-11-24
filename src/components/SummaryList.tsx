import type { SummaryItem } from "@/lib/answers";

export function SummaryList({ items, dense = false }: { items: SummaryItem[]; dense?: boolean }) {
  if (items.length === 0) {
    return <p className="text-xs text-cream-100/40">Ответ без публичных полей</p>;
  }

  return (
    <dl className={`${dense ? "space-y-1.5" : "space-y-3"} text-sm`}>
      {items.map((item) => (
        <div key={item.key}>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lime-300/70">{item.label}</dt>
          <dd className="mt-1 text-cream-100/85">
            {item.kind === "text" ? (
              <p className="whitespace-pre-line leading-relaxed">{item.text}</p>
            ) : null}
            {item.kind === "rating" ? (
              <span className="inline-flex items-baseline gap-1">
                <span className="text-lg font-bold text-gold-300">{item.text}</span>
                <span className="text-xs text-cream-100/50">/ 10</span>
              </span>
            ) : null}
            {item.kind === "list" ? (
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {item.list?.map((entry) => (
                  <li
                    key={entry}
                    className="rounded-full border border-cream-100/15 bg-cream-100/5 px-2.5 py-0.5 text-[11px] text-cream-100/80"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            ) : null}
            {item.kind === "cards" ? (
              <ul className="mt-1 grid gap-2">
                {item.cards?.map((card, index) => (
                  <li key={`${item.key}-${index}`} className="rounded-xl border border-cream-100/12 bg-cream-100/5 p-2.5">
                    <p className="text-xs font-semibold text-cream-100">{card.title}</p>
                    {card.lines.map((line) => (
                      <p key={line} className="mt-1 text-[11px] leading-relaxed text-cream-100/65">
                        {line}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
