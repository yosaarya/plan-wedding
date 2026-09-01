import { describe, expect, it } from 'vitest'
import { formatTanggalPanjang, formatTanggalPendek, selisihHari, teksCountdown } from './date'

describe('format tanggal', () => {
  it('menulis tanggal lengkap berbahasa Indonesia (aturan C2)', () => {
    // 22 November 2026 jatuh pada hari Minggu.
    expect(formatTanggalPanjang('2026-11-22T03:00:00Z')).toBe('Minggu, 22 November 2026')
  })

  it('punya bentuk pendek untuk daftar', () => {
    expect(formatTanggalPendek('2026-08-15T03:00:00Z')).toBe('15 Agu')
  })
})

describe('selisihHari', () => {
  it('menghitung selisih hari kalender, bukan selisih jam (aturan A2.3)', () => {
    // Beda 2 jam saja, tapi sudah berbeda hari di Asia/Jakarta.
    const malam = '2026-11-21T16:30:00Z' // 23:30 WIB, 21 Nov
    const dini = '2026-11-21T18:30:00Z' // 01:30 WIB, 22 Nov
    expect(selisihHari(dini, malam)).toBe(1)
  })

  it('nol pada hari yang sama meski jamnya berjauhan', () => {
    expect(selisihHari('2026-11-22T23:00:00+07:00', '2026-11-22T00:30:00+07:00')).toBe(0)
  })

  it('negatif untuk tanggal yang sudah lewat (aturan A2.4)', () => {
    expect(selisihHari('2026-11-20T05:00:00Z', '2026-11-22T05:00:00Z')).toBe(-2)
  })

  it('menghitung 103 hari seperti di rancangan beranda', () => {
    expect(selisihHari('2026-11-22T05:00:00Z', '2026-08-11T05:00:00Z')).toBe(103)
  })
})

describe('teksCountdown', () => {
  it('menangani hari-H, sebelum, dan sesudah', () => {
    expect(teksCountdown(103)).toBe('103 hari lagi')
    expect(teksCountdown(1)).toBe('1 hari lagi')
    expect(teksCountdown(0)).toBe('Hari ini!')
    expect(teksCountdown(-1)).toBe('Kemarin')
    expect(teksCountdown(-30)).toBe('30 hari yang lalu')
  })
})
