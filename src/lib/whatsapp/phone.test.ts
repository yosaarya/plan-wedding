import { describe, expect, it } from 'vitest'
import { formatNomorTampilan, nomorValid, normalisasiNomor } from './phone'

describe('normalisasiNomor', () => {
  it('menerima tiga bentuk penulisan yang lazim (aturan A5.4)', () => {
    expect(normalisasiNomor('081234567890')).toBe('6281234567890')
    expect(normalisasiNomor('+6281234567890')).toBe('6281234567890')
    expect(normalisasiNomor('6281234567890')).toBe('6281234567890')
    expect(normalisasiNomor('81234567890')).toBe('6281234567890')
  })

  it('mengabaikan spasi, tanda hubung, titik, dan kurung', () => {
    expect(normalisasiNomor('0812-3456-7890')).toBe('6281234567890')
    expect(normalisasiNomor('+62 (812) 3456 7890')).toBe('6281234567890')
  })

  it('menolak yang bukan nomor seluler Indonesia', () => {
    expect(normalisasiNomor('021555000')).toBeNull() // nomor rumah
    expect(normalisasiNomor('12345')).toBeNull() // terlalu pendek
    expect(normalisasiNomor('08123456789012345')).toBeNull() // terlalu panjang
    expect(normalisasiNomor('bukan nomor')).toBeNull()
    expect(normalisasiNomor('')).toBeNull()
    expect(normalisasiNomor(null)).toBeNull()
    expect(normalisasiNomor(undefined)).toBeNull()
  })

  it('nomorValid mencerminkan hasil normalisasi', () => {
    expect(nomorValid('081234567890')).toBe(true)
    expect(nomorValid('021555000')).toBe(false)
  })
})

describe('formatNomorTampilan', () => {
  it('menampilkan kembali dalam bentuk lokal yang enak dibaca', () => {
    expect(formatNomorTampilan('6281234567890')).toBe('0812-3456-7890')
    expect(formatNomorTampilan(null)).toBe('')
  })
})
