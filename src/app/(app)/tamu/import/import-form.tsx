'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { importGuests } from '@/features/guests/actions'
import { parseDaftarTempel } from '@/features/guests/lib'
import type { GuestGroup } from '@/types/database'

const inputClass = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

export function ImportForm({
  groups,
  groomName,
  brideName,
}: {
  groups: GuestGroup[]
  groomName: string
  brideName: string
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Pratinjau dihitung dari fungsi yang sama dengan yang dipakai server,
  // supaya yang terlihat persis sama dengan yang tersimpan (aturan A5.14).
  const preview = useMemo(() => parseDaftarTempel(text), [text])
  const totalKepala = preview.reduce((sum, row) => sum + row.headcount, 0)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)

    const result = await importGuests(formData)
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }
    router.push('/tamu')
    router.refresh()
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="text" className="mb-1 block text-sm font-semibold text-ink-900">
          Satu nama per baris
        </label>
        <textarea
          id="text"
          name="text"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={'Panji, 2\nSindy\nAcos, 3'}
          className={`${inputClass} font-mono text-sm`}
        />
        <p className="mt-1 text-xs text-ink-500">
          Tambahkan koma dan angka untuk jumlah kepala, mis. <code>Panji, 2</code>. Tanpa angka
          dianggap 1 kepala. Baris kosong dilewati.
        </p>
      </div>

      <div>
        <label htmlFor="groupId" className="mb-1 block text-sm font-semibold text-ink-900">
          Masukkan semua ke grup
        </label>
        <select id="groupId" name="groupId" defaultValue="" className={inputClass}>
          <option value="">Tanpa grup</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="side" className="mb-1 block text-sm font-semibold text-ink-900">
          Dari pihak
        </label>
        <select id="side" name="side" defaultValue="both" className={inputClass}>
          <option value="both">Keduanya</option>
          <option value="groom">{groomName}</option>
          <option value="bride">{brideName}</option>
        </select>
      </div>

      {preview.length > 0 ? (
        <div className="rounded-xl border border-cream-200 bg-white p-3">
          <p className="tabular mb-2 text-sm font-semibold text-ink-900">
            Akan menambahkan {preview.length} undangan &middot; {totalKepala} kepala
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-ink-700">
            {preview.slice(0, 50).map((row, index) => (
              <li key={`${row.name}-${index}`} className="flex justify-between gap-3">
                <span className="truncate">{row.name}</span>
                <span className="tabular shrink-0 text-ink-500">{row.headcount} pax</span>
              </li>
            ))}
          </ul>
          {preview.length > 50 ? (
            <p className="mt-2 text-xs text-ink-500">…dan {preview.length - 50} lainnya</p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || preview.length === 0}
        className="w-full rounded-full bg-sage-500 px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : `Simpan ${preview.length} tamu`}
      </button>
    </form>
  )
}
