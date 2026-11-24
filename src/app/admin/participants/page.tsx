import { formatDate } from "@/lib/format";
import { getPrivateParticipants, isOrganizer } from "@/lib/game";
import { AdminGate, AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage() {
  const organizer = await isOrganizer();

  if (!organizer) {
    return (
      <div className="space-y-4">
        <AdminNav active="/admin/participants" />
        <AdminGate />
      </div>
    );
  }

  const rows = await getPrivateParticipants();

  return (
    <div className="space-y-5">
      <AdminNav active="/admin/participants" />

      <header>
        <p className="chip chip-gold">Ограниченный доступ</p>
        <h1 className="section-title mt-2">Приватные данные участников</h1>
        <p className="mt-1 max-w-2xl text-xs text-cream-100/55">
          Эти данные не публикуются в игре и доступны только уполномоченным организаторам — для связи по итогам игры,
          награждению и статистике. Публичный игровой профиль (псевдоним) хранится отдельно. Не передавай контакты третьим
          лицам.
        </p>
      </header>

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-cream-100/10 text-[10px] uppercase tracking-[0.1em] text-cream-100/40">
            <tr>
              <th className="px-3 py-2.5">Псевдоним</th>
              <th className="px-3 py-2.5">Имя</th>
              <th className="px-3 py-2.5">Почта</th>
              <th className="px-3 py-2.5">Мессенджер</th>
              <th className="px-3 py-2.5">Команда</th>
              <th className="px-3 py-2.5">Ответов</th>
              <th className="px-3 py-2.5">В игре с</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100/8">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2.5 font-semibold text-cream-100">{row.alias}</td>
                <td className="px-3 py-2.5 text-cream-100/75">{row.privateName ?? "—"}</td>
                <td className="px-3 py-2.5 text-cream-100/60">{row.privateEmail ?? "—"}</td>
                <td className="px-3 py-2.5 text-cream-100/60">{row.privateContact ?? "—"}</td>
                <td className="px-3 py-2.5 text-cream-100/60">{row.team ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <span className="chip">{row.approvedCount}</span>
                </td>
                <td className="px-3 py-2.5 text-cream-100/40">{formatDate(row.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-cream-100/45">
                  Пока никто не присоединился к игре.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
