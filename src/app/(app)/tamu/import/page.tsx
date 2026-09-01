import Link from 'next/link'
import { listGuestGroups } from '@/features/guests/queries'
import { getWedding } from '@/features/wedding/queries'
import { ImportForm } from './import-form'

export const metadata = { title: 'Tempel daftar nama — Persiapan Nikah' }

export default async function ImportPage() {
  const [groups, wedding] = await Promise.all([listGuestGroups(), getWedding()])

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <Link href="/tamu" aria-label="Kembali ke daftar tamu" className="text-brand-600">
          ←
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          Tempel daftar nama
        </h1>
      </header>

      <ImportForm groups={groups} groomName={wedding.groom_name} brideName={wedding.bride_name} />
    </div>
  )
}
