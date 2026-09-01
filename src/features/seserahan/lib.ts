import type { SeserahanItem } from '@/types/database'

/** Logika murni modul seserahan (aturan B2.5). */

export type RingkasanSeserahan = {
  total: number
  dibeli: number
  estimasi: number
  aktual: number
}

/**
 * Total estimasi memakai seluruh item; total aktual hanya yang sudah dibeli.
 * Membandingkan keduanya adalah gunanya halaman ini (kebutuhan F5.5).
 *
 * Harga dikalikan jumlah, karena satu baris bisa berisi beberapa buah.
 */
export function ringkas(items: SeserahanItem[]): RingkasanSeserahan {
  let estimasi = 0
  let aktual = 0
  let dibeli = 0

  for (const item of items) {
    estimasi += (item.estimated_price ?? 0) * item.quantity
    if (item.is_purchased) {
      dibeli += 1
      aktual += (item.actual_price ?? item.estimated_price ?? 0) * item.quantity
    }
  }

  return { total: items.length, dibeli, estimasi, aktual }
}

/** Mengelompokkan per kategori dengan urutan kemunculan dipertahankan. */
export function kelompokkan(items: SeserahanItem[]): Array<[string, SeserahanItem[]]> {
  const map = new Map<string, SeserahanItem[]>()
  for (const item of items) {
    const bucket = map.get(item.category)
    if (bucket) bucket.push(item)
    else map.set(item.category, [item])
  }
  return [...map.entries()]
}
