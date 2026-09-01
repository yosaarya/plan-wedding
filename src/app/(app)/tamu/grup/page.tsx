import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { listGuestGroups } from '@/features/guests/queries'
import { GroupForm } from './group-form'

export const metadata = { title: 'Grup tamu — Persiapan Nikah' }

export default async function GrupPage() {
  const groups = await listGuestGroups()

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <Link href="/tamu" aria-label="Kembali ke daftar tamu" className="text-brand-600">
          ←
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          Grup tamu
        </h1>
      </header>

      <p className="text-sm text-ink-700">
        Grup dipakai untuk memfilter daftar tamu, mis. Keluarga, Teman Kuliah, atau Kantor.
      </p>

      <GroupForm />

      {groups.length === 0 ? (
        <EmptyState
          title="Belum ada grup"
          description="Buat grup pertama di atas, lalu tamu bisa dikelompokkan saat ditambahkan."
        />
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]"
            >
              <span className="text-[15px] font-semibold text-ink-900">{group.name}</span>
              <Link
                href={`/tamu?grup=${group.id}`}
                className="text-xs font-semibold text-brand-600"
              >
                Lihat tamunya
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
