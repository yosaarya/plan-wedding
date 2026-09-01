'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createGuest, updateGuest } from '@/features/guests/actions'
import { formatNomorTampilan } from '@/lib/whatsapp/phone'
import type { Guest, GuestGroup } from '@/types/database'

const inputClass = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-ink-900'

type Props = {
  groups: GuestGroup[]
  groomName: string
  brideName: string
  /** Bila diisi, form berada dalam mode ubah. */
  guest?: Guest
}

export function GuestForm({ groups, groomName, brideName, guest }: Props) {
  const editing = guest !== undefined
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function action(formData: FormData) {
    setPending(true)
    setError(null)
    setWarning(null)

    const result = editing ? await updateGuest(guest.id, formData) : await createGuest(formData)

    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }
    if (result.warning) {
      // Duplikat nomor tidak menghalangi penyimpanan (aturan A5.5) — tamu
      // sudah tersimpan, jadi peringatannya ditampilkan lalu kembali ke daftar.
      setWarning(result.warning)
      setPending(false)
      return
    }
    router.push('/tamu')
    router.refresh()
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-ink-900">
          Nama
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={guest?.name ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-ink-900">
          Nomor HP <span className="font-normal text-ink-500">(boleh dikosongkan)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="081234567890"
          defaultValue={formatNomorTampilan(guest?.phone ?? null)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-500">
          Tanpa nomor, tombol WhatsApp tidak bisa dipakai untuk tamu ini.
        </p>
      </div>

      <div>
        <label htmlFor="headcount" className="mb-1 block text-sm font-semibold text-ink-900">
          Jumlah kepala
        </label>
        <input
          id="headcount"
          name="headcount"
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          defaultValue={guest?.headcount ?? 1}
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-500">
          Satu baris = satu undangan. Isi 2 kalau diundang berdua.
        </p>
      </div>

      <div>
        <label htmlFor="groupId" className="mb-1 block text-sm font-semibold text-ink-900">
          Grup
        </label>
        <select
          id="groupId"
          name="groupId"
          defaultValue={guest?.group_id ?? ''}
          className={inputClass}
        >
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
        <select id="side" name="side" defaultValue={guest?.side ?? 'both'} className={inputClass}>
          <option value="both">Keduanya</option>
          <option value="groom">{groomName}</option>
          <option value="bride">{brideName}</option>
        </select>
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-semibold text-ink-900">
          Catatan
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={500}
          defaultValue={guest?.note ?? ''}
          className={inputClass}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      {warning ? (
        <div role="status" className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
          <p>{warning}</p>
          <button
            type="button"
            onClick={() => {
              router.push('/tamu')
              router.refresh()
            }}
            className="mt-2 font-semibold underline"
          >
            Mengerti, kembali ke daftar
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-500 px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Simpan tamu'}
      </button>
    </form>
  )
}
