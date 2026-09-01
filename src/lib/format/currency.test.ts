import { describe, expect, it } from 'vitest'
import { formatRupiah, formatRupiahShort, parseRupiah } from './currency'

describe('formatRupiah', () => {
  it('memberi pemisah titik setiap tiga digit', () => {
    expect(formatRupiah(49_700_000)).toBe('Rp 49.700.000')
    expect(formatRupiah(1_000)).toBe('Rp 1.000')
    expect(formatRupiah(999)).toBe('Rp 999')
    expect(formatRupiah(0)).toBe('Rp 0')
  })

  it('menangani nominal negatif — sisa budget boleh minus (aturan A4.6)', () => {
    expect(formatRupiah(-2_500_000)).toBe('-Rp 2.500.000')
  })

  it('tidak pernah memunculkan desimal', () => {
    expect(formatRupiah(1234.99)).toBe('Rp 1.234')
  })
})

describe('formatRupiahShort', () => {
  it('meringkas juta dan miliar dengan koma sebagai desimal', () => {
    expect(formatRupiahShort(49_700_000)).toBe('Rp 49,7 jt')
    expect(formatRupiahShort(125_000_000)).toBe('Rp 125 jt')
    expect(formatRupiahShort(1_250_000_000)).toBe('Rp 1,25 m')
    expect(formatRupiahShort(50_000)).toBe('Rp 50 rb')
  })

  it('jatuh kembali ke bentuk penuh di bawah seribu', () => {
    expect(formatRupiahShort(750)).toBe('Rp 750')
  })
})

describe('parseRupiah', () => {
  it('membaca angka yang diketik dengan atau tanpa pemisah', () => {
    expect(parseRupiah('49.700.000')).toBe(49_700_000)
    expect(parseRupiah('Rp 49.700.000')).toBe(49_700_000)
    expect(parseRupiah('49700000')).toBe(49_700_000)
  })

  it('mengembalikan null untuk masukan yang bukan angka', () => {
    expect(parseRupiah('')).toBeNull()
    expect(parseRupiah('abc')).toBeNull()
    expect(parseRupiah('Rp')).toBeNull()
  })
})
