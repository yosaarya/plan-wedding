import { describe, expect, it } from 'vitest'
import type { SeserahanItem } from '@/types/database'
import { kelompokkan, ringkas } from './lib'

function item(partial: Partial<SeserahanItem> & { id: string }): SeserahanItem {
  return {
    wedding_id: 'w',
    category: 'Skincare',
    name: partial.id,
    quantity: 1,
    estimated_price: null,
    actual_price: null,
    is_purchased: false,
    purchased_at: null,
    tray_number: null,
    product_url: null,
    expense_id: null,
    note: null,
    sort_order: 0,
    ...partial,
  }
}

describe('ringkas', () => {
  it('menghitung estimasi seluruh item tapi aktual hanya yang sudah dibeli', () => {
    const hasil = ringkas([
      item({ id: 'a', estimated_price: 100_000, actual_price: 120_000, is_purchased: true }),
      item({ id: 'b', estimated_price: 200_000 }),
    ])
    expect(hasil.estimasi).toBe(300_000)
    expect(hasil.aktual).toBe(120_000)
    expect(hasil.dibeli).toBe(1)
    expect(hasil.total).toBe(2)
  })

  it('mengalikan harga dengan jumlah barang', () => {
    const hasil = ringkas([
      item({ id: 'a', estimated_price: 50_000, quantity: 3, is_purchased: true, actual_price: 60_000 }),
    ])
    expect(hasil.estimasi).toBe(150_000)
    expect(hasil.aktual).toBe(180_000)
  })

  it('memakai harga estimasi bila harga aktual belum diisi saat dicentang', () => {
    const hasil = ringkas([item({ id: 'a', estimated_price: 100_000, is_purchased: true })])
    expect(hasil.aktual).toBe(100_000)
  })

  it('item tanpa harga sama sekali tidak merusak hitungan', () => {
    const hasil = ringkas([item({ id: 'a', is_purchased: true })])
    expect(hasil.estimasi).toBe(0)
    expect(hasil.aktual).toBe(0)
  })

  it('daftar kosong menghasilkan nol, bukan NaN', () => {
    expect(ringkas([])).toEqual({ total: 0, dibeli: 0, estimasi: 0, aktual: 0 })
  })
})

describe('kelompokkan', () => {
  it('mempertahankan urutan kemunculan kategori', () => {
    const hasil = kelompokkan([
      item({ id: 'a', category: 'Alat Salat' }),
      item({ id: 'b', category: 'Skincare' }),
      item({ id: 'c', category: 'Alat Salat' }),
    ])
    expect(hasil.map(([nama]) => nama)).toEqual(['Alat Salat', 'Skincare'])
    expect(hasil[0]?.[1]).toHaveLength(2)
  })
})
