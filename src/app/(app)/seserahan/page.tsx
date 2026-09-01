import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { kelompokkan, ringkas } from '@/features/seserahan/lib'
import { listSeserahanItems } from '@/features/seserahan/queries'
import { persenSelesai } from '@/features/checklist/lib'
import { formatRupiah } from '@/lib/format/currency'
import { AddSeserahanForm } from './add-seserahan-form'
import { SeserahanItemRow } from './seserahan-item'

export const metadata = { title: 'Seserahan — Persiapan Nikah' }

export default async function SeserahanPage() {
  const items = await listSeserahanItems()
  const stat = ringkas(items)
  const grup = kelompokkan(items)
  const persen = persenSelesai(stat.total, stat.dibeli)

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
            Seserahan
          </h1>
          <p className="tabular text-xs text-ink-500">
            {stat.dibeli} dari {stat.total} barang sudah dibeli
          </p>
        </div>
        <Link href="/checklist" className="shrink-0 pt-1 text-xs font-semibold text-brand-600">
          Ke checklist
        </Link>
      </header>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[15px] font-bold text-ink-900">Progres belanja</span>
          <span className="tabular text-[22px] font-bold text-brand-500">{persen}%</span>
        </div>
        <ProgressBar percent={persen} label={`Progres belanja seserahan ${persen} persen`} />

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-ink-500">Perkiraan total</dt>
            <dd className="tabular font-semibold text-ink-900">{formatRupiah(stat.estimasi)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Sudah dibelanjakan</dt>
            <dd className="tabular font-semibold text-ink-900">{formatRupiah(stat.aktual)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-ink-500">
          Harga bawaan adalah perkiraan kasar. Ganti dengan harga sebenarnya saat sudah
          belanja supaya angkanya berguna.
        </p>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada daftar seserahan"
          description="Daftar biasanya terisi otomatis saat onboarding. Tambahkan sendiri lewat tombol di kanan bawah."
        />
      ) : (
        <div className="space-y-5">
          {grup.map(([kategori, daftar]) => (
            <section key={kategori}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-[15px] font-bold text-ink-900">{kategori}</h2>
                <span className="tabular text-xs text-ink-500">
                  {daftar.filter((i) => i.is_purchased).length}/{daftar.length}
                </span>
              </div>
              <ul className="space-y-2">
                {daftar.map((item) => (
                  <SeserahanItemRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <AddSeserahanForm categories={grup.map(([nama]) => nama)} />
    </div>
  )
}
