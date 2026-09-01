'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { createExpense } from '@/features/budget/actions'
import type { BudgetCategory } from '@/types/database'

const inputClass = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

export function AddExpenseForm({ categories }: { categories: BudgetCategory[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)

    const result = await createExpense(formData)
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }

    formRef.current?.reset()
    setPending(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Catat pengeluaran"
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-2xl font-light text-white shadow-[var(--shadow-raised)]"
      >
        +
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-[var(--radius-card)] bg-white p-4 shadow-[var(--shadow-card)]"
    >
      <h2 className="text-[15px] font-bold text-ink-900">Catat pengeluaran</h2>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm text-ink-700">
          Untuk apa?
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="DP gedung"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm text-ink-700">
            Total biaya
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            placeholder="30000000"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="paidAmount" className="mb-1 block text-sm text-ink-700">
            Sudah dibayar
          </label>
          <input
            id="paidAmount"
            name="paidAmount"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={0}
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-ink-500">
        Isi &ldquo;sudah dibayar&rdquo; lebih kecil dari total kalau baru DP. Statusnya
        dihitung otomatis.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm text-ink-700">
            Kategori
          </label>
          <select id="categoryId" name="categoryId" defaultValue="" className={inputClass}>
            <option value="">Tanpa kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="transactionDate" className="mb-1 block text-sm text-ink-700">
            Tanggal
          </label>
          <input
            id="transactionDate"
            name="transactionDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="method" className="mb-1 block text-sm text-ink-700">
          Cara bayar
        </label>
        <select id="method" name="method" defaultValue="" className={inputClass}>
          <option value="">Tidak dicatat</option>
          <option value="transfer">Transfer</option>
          <option value="cash">Tunai</option>
          <option value="ewallet">E-wallet</option>
          <option value="card">Kartu</option>
          <option value="other">Lainnya</option>
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-full border border-cream-200 px-4 py-3 text-sm font-semibold text-ink-700"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-sage-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
