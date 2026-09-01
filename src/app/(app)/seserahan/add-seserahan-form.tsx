'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { createSeserahanItem } from '@/features/seserahan/actions'

const inputClass = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

export function AddSeserahanForm({ categories }: { categories: string[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)

    const result = await createSeserahanItem(formData)
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
        aria-label="Tambah barang seserahan"
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
      <h2 className="text-[15px] font-bold text-ink-900">Barang baru</h2>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-ink-700">
          Nama barang
        </label>
        <input id="name" name="name" required maxLength={200} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm text-ink-700">
            Kategori
          </label>
          <input
            id="category"
            name="category"
            required
            list="kategori-seserahan"
            maxLength={80}
            className={inputClass}
          />
          <datalist id="kategori-seserahan">
            {categories.map((nama) => (
              <option key={nama} value={nama} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm text-ink-700">
            Jumlah
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            defaultValue={1}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="estimatedPrice" className="mb-1 block text-sm text-ink-700">
          Perkiraan harga satuan
        </label>
        <input
          id="estimatedPrice"
          name="estimatedPrice"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="productUrl" className="mb-1 block text-sm text-ink-700">
          Tautan toko <span className="text-ink-500">(boleh dikosongkan)</span>
        </label>
        <input
          id="productUrl"
          name="productUrl"
          type="url"
          placeholder="https://…"
          className={inputClass}
        />
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
          {pending ? 'Menyimpan…' : 'Tambah'}
        </button>
      </div>
    </form>
  )
}
