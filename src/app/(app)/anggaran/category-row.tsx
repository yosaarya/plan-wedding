'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { updateCategoryPlan } from '@/features/budget/actions'
import type { CategorySummary } from '@/features/budget/queries'
import { formatRupiah, formatRupiahShort } from '@/lib/format/currency'

export function CategoryRow({ category }: { category: CategorySummary }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <li className="rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        aria-expanded={editing}
        className="mb-2 flex w-full items-baseline justify-between gap-3 text-left"
      >
        <span className="truncate text-[15px] font-semibold text-ink-900">{category.name}</span>
        <span
          className={`tabular shrink-0 text-xs ${
            category.is_over ? 'font-semibold text-[var(--color-danger)]' : 'text-ink-500'
          }`}
        >
          {formatRupiahShort(category.spent_amount)}
          {category.planned_amount > 0 ? ` / ${formatRupiahShort(category.planned_amount)}` : ''}
        </span>
      </button>

      <ProgressBar
        percent={category.usage_percent}
        label={`${category.name}: terpakai ${category.usage_percent} persen dari alokasi`}
      />

      {category.is_over ? (
        <p className="mt-1 text-xs font-semibold text-[var(--color-danger)]">
          Melebihi alokasi {formatRupiah(category.spent_amount - category.planned_amount)}
        </p>
      ) : null}

      {editing ? (
        <form
          action={async (formData) => {
            const result = await updateCategoryPlan(category.category_id, formData)
            if (result.error) {
              setError(result.error)
              return
            }
            setEditing(false)
            router.refresh()
          }}
          className="mt-3 space-y-2 border-t border-cream-200 pt-3"
        >
          <label className="block text-xs text-ink-500">
            Nama kategori
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={category.name}
              className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
            />
          </label>

          <label className="block text-xs text-ink-500">
            Alokasi rencana (rupiah)
            <input
              name="plannedAmount"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={category.planned_amount}
              className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
            />
          </label>
          <p className="text-xs text-ink-500">
            Total alokasi semua kategori boleh berbeda dari total budget. Selisihnya
            tampil sebagai &ldquo;belum dialokasikan&rdquo;.
          </p>

          {error ? (
            <p role="alert" className="text-xs text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-full border border-cream-200 px-3 py-2 text-xs font-semibold text-ink-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 rounded-full bg-sage-500 px-3 py-2 text-xs font-semibold text-white"
            >
              Simpan
            </button>
          </div>
        </form>
      ) : null}
    </li>
  )
}
