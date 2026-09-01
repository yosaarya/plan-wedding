import { describe, expect, it } from 'vitest'
import type { ChecklistItem } from '@/types/database'
import { jatuhTempoBulanIni, persenSelesai, terapkanFilter, terlambat, tugasBulanIni } from './lib'

const today = new Date('2026-08-11T05:00:00Z')

function item(partial: Partial<ChecklistItem> & { id: string }): ChecklistItem {
  return {
    wedding_id: 'w',
    category_id: null,
    title: partial.id,
    notes: null,
    due_date: null,
    priority: 'normal',
    assigned_to: 'both',
    is_done: false,
    completed_at: null,
    expense_id: null,
    sort_order: 0,
    ...partial,
  }
}

describe('terlambat', () => {
  it('hanya berlaku untuk yang belum selesai dan tenggatnya lewat (aturan A3.4)', () => {
    expect(terlambat(item({ id: 'a', due_date: '2026-08-01' }), today)).toBe(true)
    expect(terlambat(item({ id: 'b', due_date: '2026-08-01', is_done: true }), today)).toBe(false)
    expect(terlambat(item({ id: 'c', due_date: '2026-08-20' }), today)).toBe(false)
    // Tenggat hari ini belum terlambat.
    expect(terlambat(item({ id: 'd', due_date: '2026-08-11' }), today)).toBe(false)
    // Item tanpa tenggat tidak pernah terlambat.
    expect(terlambat(item({ id: 'e' }), today)).toBe(false)
  })
})

describe('jatuhTempoBulanIni', () => {
  it('membandingkan bulan dan tahun, bukan hanya bulan', () => {
    expect(jatuhTempoBulanIni(item({ id: 'a', due_date: '2026-08-30' }), today)).toBe(true)
    expect(jatuhTempoBulanIni(item({ id: 'b', due_date: '2026-09-01' }), today)).toBe(false)
    expect(jatuhTempoBulanIni(item({ id: 'c', due_date: '2025-08-15' }), today)).toBe(false)
    expect(jatuhTempoBulanIni(item({ id: 'd' }), today)).toBe(false)
  })
})

describe('tugasBulanIni', () => {
  const items = [
    item({ id: 'terlambat-lama', due_date: '2026-07-01' }),
    item({ id: 'bulan-ini-akhir', due_date: '2026-08-28' }),
    item({ id: 'terlambat-baru', due_date: '2026-08-05' }),
    item({ id: 'bulan-depan', due_date: '2026-09-10' }),
    item({ id: 'sudah-selesai', due_date: '2026-08-02', is_done: true }),
    item({ id: 'tanpa-tenggat' }),
  ]

  it('menggabungkan tenggat bulan ini dengan seluruh yang terlambat (aturan A3.5)', () => {
    expect(tugasBulanIni(items, today).map((i) => i.id)).toEqual([
      'terlambat-lama',
      'terlambat-baru',
      'bulan-ini-akhir',
    ])
  })

  it('mengurutkan tenggat menaik sehingga yang paling mendesak di atas', () => {
    const urut = tugasBulanIni(items, today).map((i) => i.due_date)
    expect(urut).toEqual([...urut].sort())
  })

  it('menghormati batas jumlah untuk kartu beranda', () => {
    expect(tugasBulanIni(items, today, 2)).toHaveLength(2)
  })

  it('tidak memasukkan yang sudah selesai maupun yang tanpa tenggat', () => {
    const ids = tugasBulanIni(items, today).map((i) => i.id)
    expect(ids).not.toContain('sudah-selesai')
    expect(ids).not.toContain('tanpa-tenggat')
  })
})

describe('terapkanFilter', () => {
  const items = [
    item({ id: 'a', due_date: '2026-08-01' }),
    item({ id: 'b', due_date: '2026-08-20' }),
    item({ id: 'c', is_done: true }),
  ]

  it('menyaring sesuai pilihan pengguna', () => {
    expect(terapkanFilter(items, 'semua', today)).toHaveLength(3)
    expect(terapkanFilter(items, 'belum', today).map((i) => i.id)).toEqual(['a', 'b'])
    expect(terapkanFilter(items, 'selesai', today).map((i) => i.id)).toEqual(['c'])
    expect(terapkanFilter(items, 'terlambat', today).map((i) => i.id)).toEqual(['a'])
    expect(terapkanFilter(items, 'bulan-ini', today).map((i) => i.id)).toEqual(['a', 'b'])
  })
})

describe('persenSelesai', () => {
  it('kategori kosong menampilkan 0 persen, bukan 100 (aturan A3.6)', () => {
    expect(persenSelesai(0, 0)).toBe(0)
  })

  it('membulatkan ke bilangan bulat', () => {
    expect(persenSelesai(3, 1)).toBe(33)
    expect(persenSelesai(4, 3)).toBe(75)
    expect(persenSelesai(10, 10)).toBe(100)
  })
})
