import { Card } from '@/components/ui/card'
import { requireWedding } from '@/lib/auth/guards'
import { getWeddingSettings } from '@/features/guests/queries'
import { getPrimaryEvent, getWedding } from '@/features/wedding/queries'
import { EventForm } from './event-form'
import { SignOutButton } from './sign-out-button'
import { TemplateForm } from './template-form'
import { WeddingForm } from './wedding-form'

export const metadata = { title: 'Profil — Persiapan Nikah' }

export default async function ProfilPage() {
  const [{ email, role }, wedding, event, settings] = await Promise.all([
    requireWedding(),
    getWedding(),
    getPrimaryEvent(),
    getWeddingSettings(),
  ])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          Profil
        </h1>
        <p className="text-xs text-ink-500">
          Masuk sebagai {email} &middot; {role === 'owner' ? 'Pemilik' : 'Pasangan'}
        </p>
      </header>

      <Card>
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">Data pernikahan</h2>
        <WeddingForm wedding={wedding} />
      </Card>

      <Card>
        <h2 className="mb-1 text-[15px] font-bold text-ink-900">Acara utama</h2>
        <p className="mb-3 text-xs text-ink-500">
          Tanggal ini yang dipakai untuk countdown di beranda. Mengubahnya tidak menggeser
          tenggat tugas yang sudah ada.
        </p>
        <EventForm event={event} />
      </Card>

      <Card>
        <h2 className="mb-1 text-[15px] font-bold text-ink-900">Template pesan WhatsApp</h2>
        <p className="mb-3 text-xs text-ink-500">
          Dipakai saat menekan tombol WA di daftar tamu.
        </p>
        <TemplateForm template={settings?.whatsapp_template ?? ''} />
      </Card>

      <Card>
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">Cadangan data</h2>
        <p className="mb-3 text-sm text-ink-700">
          Unduh daftar tamu sebagai CSV. Simpan sesekali — ini cadangan yang tetap bisa
          dibuka meski aplikasinya suatu saat tidak jalan.
        </p>
        <a
          href="/api/export/tamu"
          className="inline-block rounded-full border border-brand-300 px-5 py-2.5 text-sm font-semibold text-brand-700"
        >
          Unduh daftar tamu (CSV)
        </a>
      </Card>

      <SignOutButton />
    </div>
  )
}
