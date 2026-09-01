import Link from 'next/link'
import { Card, CardHeader } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatTile } from '@/components/ui/stat-tile'
import { formatRupiah, formatRupiahShort } from '@/lib/format/currency'
import { formatTanggalPanjang, teksCountdown } from '@/lib/format/date'
import { listChecklistItems } from '@/features/checklist/queries'
import { terlambat, tugasBulanIni } from '@/features/checklist/lib'
import { getDashboardStats, getPrimaryEvent, getWedding } from '@/features/wedding/queries'
import { HOME_TASK_LIMIT } from '@/lib/constants'
import { formatTanggalPendek } from '@/lib/format/date'

export default async function BerandaPage() {
  const [wedding, event, stats, items] = await Promise.all([
    getWedding(),
    getPrimaryEvent(),
    getDashboardStats(),
    listChecklistItems(),
  ])

  const today = new Date()
  // Tenggat bulan ini ditambah seluruh yang terlambat, maksimal lima (aturan A3.5).
  const tugas = tugasBulanIni(items, today, HOME_TASK_LIMIT)

  const days = stats.days_until_primary_event
  const budgetPercent =
    stats.budget_total > 0 ? (stats.budget_spent / stats.budget_total) * 100 : 0

  return (
    <div className="space-y-3">
      <header className="px-1 pb-1">
        <p className="text-sm text-ink-700">Halo,</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
          {wedding.groom_name} &amp; {wedding.bride_name}
        </h1>
      </header>

      {/* Countdown — elemen paling menonjol di beranda (desain §6.2) */}
      <Card variant="accent" className="text-center">
        {event?.starts_at ? (
          <>
            <p className="text-xs font-medium text-ink-500">
              {formatTanggalPanjang(event.starts_at)}
            </p>
            <p className="tabular my-1 font-[family-name:var(--font-display)] text-[64px] leading-[68px] font-semibold text-brand-500">
              {days === null ? '—' : Math.abs(days)}
            </p>
            <p className="text-ink-700">{days === null ? 'Tanggal belum diatur' : teksCountdown(days)}</p>
            {wedding.city ? (
              <p className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-700">
                {wedding.city}
              </p>
            ) : null}
          </>
        ) : (
          <div className="py-4">
            <p className="mb-3 text-ink-700">Tanggal pernikahan belum diatur.</p>
            <Link
              href="/profil"
              className="inline-block rounded-full bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Atur tanggal
            </Link>
          </div>
        )}
      </Card>

      {/* Tugas bulan ini (aturan A3.5) */}
      <Card>
        <CardHeader
          title="Tugas Bulan Ini"
          action={
            <Link href="/checklist" className="text-sm font-semibold text-brand-600">
              Lihat semua
            </Link>
          }
        />
        <p className="text-sm text-ink-700">
          {stats.checklist_due_this_month} tugas jatuh tempo bulan ini
          {stats.checklist_overdue > 0 ? (
            <span className="text-[var(--color-danger)]">
              {' '}
              &middot; {stats.checklist_overdue} terlambat
            </span>
          ) : null}
        </p>

        {tugas.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {tugas.map((item) => {
              const late = terlambat(item, today)
              return (
                <li key={item.id} className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm text-ink-900">{item.title}</span>
                  {item.due_date ? (
                    <span
                      className={`tabular shrink-0 text-xs ${
                        late ? 'font-semibold text-[var(--color-danger)]' : 'text-ink-500'
                      }`}
                    >
                      {formatTanggalPendek(item.due_date)}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-500">
            Tidak ada yang jatuh tempo bulan ini. Santai dulu.
          </p>
        )}

        <div className="mt-4">
          <ProgressBar
            percent={
              stats.checklist_total > 0
                ? (stats.checklist_done / stats.checklist_total) * 100
                : 0
            }
            label={`Progres checklist: ${stats.checklist_done} dari ${stats.checklist_total} selesai`}
          />
          <p className="tabular mt-2 text-xs text-ink-500">
            {stats.checklist_done} dari {stats.checklist_total} selesai
          </p>
        </div>
      </Card>

      {/* Anggaran (aturan A4.3, A4.6) */}
      <Card>
        <CardHeader
          title="Anggaran"
          action={
            <Link href="/anggaran" className="text-sm font-semibold text-brand-600">
              Lihat detail
            </Link>
          }
        />
        <p className="tabular text-[22px] leading-7 font-bold text-ink-900">
          {formatRupiahShort(stats.budget_spent)}
        </p>
        <p className="tabular mb-3 text-xs text-ink-500">
          terpakai dari {formatRupiahShort(stats.budget_total)}
        </p>
        <ProgressBar percent={budgetPercent} label={`Pemakaian anggaran ${Math.round(budgetPercent)} persen`} />
        <p className="tabular mt-2 text-sm">
          {stats.budget_remaining < 0 ? (
            <span className="font-semibold text-[var(--color-danger)]">
              Over budget {formatRupiah(Math.abs(stats.budget_remaining))}
            </span>
          ) : (
            <span className="text-ink-700">Sisa {formatRupiah(stats.budget_remaining)}</span>
          )}
        </p>
      </Card>

      {/* Tamu — "kepala" dan "undangan" dibedakan (aturan A5.1, A5.9) */}
      <Card>
        <CardHeader
          title="Tamu"
          action={
            <Link href="/tamu" className="text-sm font-semibold text-brand-600">
              Kelola
            </Link>
          }
        />
        <p className="tabular mb-3 text-xs text-ink-500">
          {stats.guest_invitations} undangan &middot; {stats.guest_headcount} kepala
        </p>
        <div className="flex gap-2">
          <StatTile value={stats.guest_headcount} label="kepala" href="/tamu" />
          <StatTile
            value={stats.guest_attending_people}
            label="hadir"
            href="/tamu?rsvp=attending"
          />
          <StatTile
            value={stats.guest_invitations_sent}
            label="terkirim"
            href="/tamu?kirim=sent"
          />
          <StatTile value={stats.guest_pending} label="pending" href="/tamu?rsvp=pending" />
        </div>
      </Card>
    </div>
  )
}
