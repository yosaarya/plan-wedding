import Link from 'next/link'
import { listGuestGroups } from '@/features/guests/queries'
import { getWedding } from '@/features/wedding/queries'
import { GuestForm } from './guest-form'

export const metadata = { title: 'Tambah tamu — Persiapan Nikah' }

export default async function TambahTamuPage() {
  const [groups, wedding] = await Promise.all([listGuestGroups(), getWedding()])

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <Link href="/tamu" aria-label="Kembali ke daftar tamu" className="text-brand-600">
          ←
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          Tambah tamu
        </h1>
      </header>

      <GuestForm groups={groups} groomName={wedding.groom_name} brideName={wedding.bride_name} />

      <p className="text-center text-sm text-ink-500">
        Mau menambahkan banyak sekaligus?{' '}
        <Link href="/tamu/import" className="font-semibold text-brand-600">
          Tempel daftar nama
        </Link>
      </p>
    </div>
  )
}
