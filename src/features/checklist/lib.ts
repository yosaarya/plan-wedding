import type { ChecklistItem, Assignee, TaskPriority } from '@/types/database'

/** Logika murni modul checklist — tanpa React, tanpa Supabase (aturan B2.5). */

export const LABEL_PRIORITAS: Record<TaskPriority, string> = {
  low: 'Rendah',
  normal: 'Normal',
  high: 'Tinggi',
}

export const LABEL_PJ: Record<Assignee, string> = {
  groom: 'Pria',
  bride: 'Wanita',
  both: 'Berdua',
}

export type FilterChecklist = 'semua' | 'belum' | 'selesai' | 'bulan-ini' | 'terlambat'

export const LABEL_FILTER: Record<FilterChecklist, string> = {
  semua: 'Semua',
  belum: 'Belum selesai',
  selesai: 'Selesai',
  'bulan-ini': 'Bulan ini',
  terlambat: 'Terlambat',
}

/** Item terlambat: tenggat sudah lewat dan belum selesai (aturan A3.4). */
export function terlambat(item: Pick<ChecklistItem, 'due_date' | 'is_done'>, today: Date): boolean {
  if (item.is_done || !item.due_date) return false
  return item.due_date < isoDate(today)
}

/** Tenggat jatuh di bulan berjalan. */
export function jatuhTempoBulanIni(
  item: Pick<ChecklistItem, 'due_date'>,
  today: Date,
): boolean {
  if (!item.due_date) return false
  return item.due_date.slice(0, 7) === isoDate(today).slice(0, 7)
}

/**
 * "Tugas Bulan Ini" = item belum selesai dengan tenggat di bulan berjalan,
 * DITAMBAH seluruh item terlambat, diurutkan tenggat menaik (aturan A3.5).
 */
export function tugasBulanIni(
  items: ChecklistItem[],
  today: Date,
  limit?: number,
): ChecklistItem[] {
  const dipilih = items.filter(
    (item) => !item.is_done && (terlambat(item, today) || jatuhTempoBulanIni(item, today)),
  )

  dipilih.sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31'))
  return limit === undefined ? dipilih : dipilih.slice(0, limit)
}

export function terapkanFilter(
  items: ChecklistItem[],
  filter: FilterChecklist,
  today: Date,
): ChecklistItem[] {
  switch (filter) {
    case 'belum':
      return items.filter((item) => !item.is_done)
    case 'selesai':
      return items.filter((item) => item.is_done)
    case 'bulan-ini':
      return items.filter((item) => !item.is_done && jatuhTempoBulanIni(item, today))
    case 'terlambat':
      return items.filter((item) => terlambat(item, today))
    default:
      return items
  }
}

/** Kategori kosong menampilkan 0%, bukan 100% (aturan A3.6). */
export function persenSelesai(total: number, selesai: number): number {
  if (total === 0) return 0
  return Math.round((selesai / total) * 100)
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
