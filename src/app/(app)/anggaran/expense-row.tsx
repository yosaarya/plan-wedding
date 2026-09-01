'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DeleteButton } from '@/components/ui/delete-button'
import { deleteExpense, updateExpense } from '@/features/budget/actions'
import { KELAS_STATUS, LABEL_STATUS, statusBayar } from '@/features/budget/lib'
import { formatRupiah, formatRupiahShort } from '@/lib/format/currency'
import { formatTanggalPendek } from '@/lib/format/date'
import type { BudgetCategory, Expense } from '@/types/database'

export function ExpenseRow({
  expense,
  categories,
}: {
  expense: Expense
  categories: BudgetCategory[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status diturunkan dari nominal, tidak disimpan sebagai kolom (aturan A4.5).
  const status = statusBayar(expense.amount, expense.paid_amount)

  return (
    <li className="rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          className="block w-full truncate text-left text-[15px] font-medium text-ink-900"
        >
          {expense.title}
        </button>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
          <span>{formatTanggalPendek(expense.transaction_date)}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${KELAS_STATUS[status]}`}>
            {LABEL_STATUS[status]}
          </span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="tabular text-[15px] font-semibold text-ink-900">
          {formatRupiah(expense.amount)}
        </p>
        {status === 'dp' ? (
          <p className="tabular text-xs text-ink-500">
            dibayar {formatRupiahShort(expense.paid_amount)}
          </p>
        ) : null}
      </div>

      <DeleteButton label={`pengeluaran ${expense.title}`} onDelete={() => deleteExpense(expense.id)} />
      </div>

      {editing ? (
        <form
          action={async (formData) => {
            const result = await updateExpense(expense.id, formData)
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
            Untuk apa
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={expense.title}
              className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-500">
              Total biaya
              <input
                name="amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                required
                defaultValue={expense.amount}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              />
            </label>
            <label className="block text-xs text-ink-500">
              Sudah dibayar
              <input
                name="paidAmount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                defaultValue={expense.paid_amount}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-ink-500">
              Kategori
              <select
                name="categoryId"
                defaultValue={expense.category_id ?? ''}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-ink-500">
              Tanggal
              <input
                name="transactionDate"
                type="date"
                required
                defaultValue={expense.transaction_date}
                className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
              />
            </label>
          </div>

          <label className="block text-xs text-ink-500">
            Cara bayar
            <select
              name="method"
              defaultValue={expense.method ?? ''}
              className="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-900"
            >
              <option value="">Tidak dicatat</option>
              <option value="transfer">Transfer</option>
              <option value="cash">Tunai</option>
              <option value="ewallet">E-wallet</option>
              <option value="card">Kartu</option>
              <option value="other">Lainnya</option>
            </select>
          </label>

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
