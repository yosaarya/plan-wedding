import { describe, expect, it } from 'vitest'
import { belumDialokasikan, melebihiAlokasi, persenPakai, sisaBayar, statusBayar } from './lib'

describe('statusBayar', () => {
  it('diturunkan dari nominal, bukan disimpan terpisah (aturan A4.5)', () => {
    expect(statusBayar(10_000_000, 0)).toBe('belum')
    expect(statusBayar(10_000_000, 3_000_000)).toBe('dp')
    expect(statusBayar(10_000_000, 10_000_000)).toBe('lunas')
  })

  it('pengeluaran bernilai nol yang belum dibayar tetap terbaca belum bayar', () => {
    expect(statusBayar(0, 0)).toBe('belum')
  })
})

describe('sisaBayar', () => {
  it('tidak pernah negatif', () => {
    expect(sisaBayar(10_000_000, 3_000_000)).toBe(7_000_000)
    expect(sisaBayar(10_000_000, 10_000_000)).toBe(0)
  })
})

describe('persenPakai', () => {
  it('menghitung pemakaian terhadap alokasi', () => {
    expect(persenPakai(5_000_000, 10_000_000)).toBe(50)
    expect(persenPakai(12_000_000, 10_000_000)).toBe(120)
  })

  it('alokasi nol menghasilkan 0, bukan pembagian dengan nol', () => {
    expect(persenPakai(5_000_000, 0)).toBe(0)
    expect(Number.isFinite(persenPakai(5_000_000, 0))).toBe(true)
  })
})

describe('melebihiAlokasi', () => {
  it('hanya berarti bila alokasinya memang diisi (aturan A4.7)', () => {
    expect(melebihiAlokasi(12_000_000, 10_000_000)).toBe(true)
    expect(melebihiAlokasi(8_000_000, 10_000_000)).toBe(false)
    // Kategori tanpa alokasi tidak pernah dilaporkan over budget.
    expect(melebihiAlokasi(5_000_000, 0)).toBe(false)
  })
})

describe('belumDialokasikan', () => {
  it('boleh negatif bila alokasi kategori melebihi total budget (aturan A4.9)', () => {
    expect(belumDialokasikan(125_000_000, 100_000_000)).toBe(25_000_000)
    expect(belumDialokasikan(125_000_000, 130_000_000)).toBe(-5_000_000)
  })
})
