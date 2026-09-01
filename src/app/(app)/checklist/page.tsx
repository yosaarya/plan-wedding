import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  listCategoryProgress,
  listChecklistCategories,
  listChecklistItems,
} from '@/features/checklist/queries'
import {
  LABEL_FILTER,
  persenSelesai,
  terapkanFilter,
  terlambat,
  type FilterChecklist,
} from '@/features/checklist/lib'
import { FilterChips, type Chip } from '../tamu/filter-chips'
import { AddItemForm } from './add-item-form'
import { ChecklistItemRow } from './checklist-item'

export const metadata = { title: 'Checklist — Persiapan Nikah' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const FILTERS: FilterChecklist[] = ['semua', 'belum', 'bulan-ini', 'terlambat', 'selesai']

export default async function ChecklistPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const raw = Array.isArray(params.f) ? params.f[0] : params.f
  const filter: FilterChecklist = FILTERS.includes(raw as FilterChecklist)
    ? (raw as FilterChecklist)
    : 'belum'

  const [items, categories, progress] = await Promise.all([
    listChecklistItems(),
    listChecklistCategories(),
    listCategoryProgress(),
  ])

  const today = new Date()
  const total = items.length
  const selesai = items.filter((item) => item.is_done).length
  const terlihat = terapkanFilter(items, filter, today)

  const namaKategori = new Map(categories.map((c) => [c.id, c.name]))

  // Kelompokkan menurut kategori, mempertahankan urutan kategori.
  const grup = new Map<string, typeof terlihat>()
  for (const item of terlihat) {
    const key = item.category_id ?? ''
    const bucket = grup.get(key)
    if (bucket) bucket.push(item)
    else grup.set(key, [item])
  }
  const urutan = [...categories.map((c) => c.id), '']

  const chips: Chip[] = FILTERS.map((value) => ({
    key: 'f',
    value,
    label: LABEL_FILTER[value],
  }))

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl leading-8 font-semibold text-ink-900">
            Checklist
          </h1>
          <p className="tabular text-xs text-ink-500">
            {selesai} dari {total} tugas selesai
          </p>
        </div>
        {/* Seserahan punya halaman sendiri tapi bukan tab, karena lima tab adalah
            batas kenyamanan di layar 360px (desain §5.2). */}
        <Link href="/seserahan" className="shrink-0 pt-1 text-xs font-semibold text-brand-600">
          Seserahan
        </Link>
      </header>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[15px] font-bold text-ink-900">Progres keseluruhan</span>
          <span className="tabular text-[22px] font-bold text-brand-500">
            {persenSelesai(total, selesai)}%
          </span>
        </div>
        <ProgressBar
          percent={persenSelesai(total, selesai)}
          label={`Progres checklist ${persenSelesai(total, selesai)} persen`}
        />
      </Card>

      <FilterChips chips={chips} />

      {terlihat.length === 0 ? (
        <EmptyState
          title={filter === 'belum' ? 'Semua tugas selesai' : 'Tidak ada tugas di sini'}
          description={
            filter === 'belum'
              ? 'Tidak ada yang menunggu dikerjakan. Nikmati dulu sebentar.'
              : 'Coba ganti filternya, atau tambahkan tugas baru lewat tombol di kanan bawah.'
          }
        />
      ) : (
        <div className="space-y-5">
          {urutan.map((categoryId) => {
            const bucket = grup.get(categoryId)
            if (!bucket || bucket.length === 0) return null

            const stat = progress.find((p) => p.category_id === categoryId)
            const nama = categoryId ? (namaKategori.get(categoryId) ?? 'Lain-lain') : 'Tanpa kategori'

            return (
              <section key={categoryId || 'none'}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-[15px] font-bold text-ink-900">{nama}</h2>
                  {stat ? (
                    <span className="tabular text-xs text-ink-500">
                      {stat.done_items}/{stat.total_items}
                    </span>
                  ) : null}
                </div>
                <ul className="space-y-2">
                  {bucket.map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      late={terlambat(item, today)}
                    />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <AddItemForm categories={categories} />
    </div>
  )
}
