import { describe, expect, it } from 'vitest'
import { escapeCsvCell, toCsv } from './csv'

describe('escapeCsvCell', () => {
  it('membiarkan teks biasa apa adanya', () => {
    expect(escapeCsvCell('Panji')).toBe('Panji')
    expect(escapeCsvCell(42)).toBe('42')
  })

  it('mengutip sel yang mengandung koma, kutip, atau baris baru', () => {
    expect(escapeCsvCell('Ahmad, S.Pd')).toBe('"Ahmad, S.Pd"')
    expect(escapeCsvCell('dia bilang "ya"')).toBe('"dia bilang ""ya"""')
    expect(escapeCsvCell('baris\nbaru')).toBe('"baris\nbaru"')
  })

  it('menetralkan sel yang bisa dibaca spreadsheet sebagai rumus', () => {
    expect(escapeCsvCell('=1+1')).toBe("'=1+1")
    expect(escapeCsvCell('+62812')).toBe("'+62812")
    expect(escapeCsvCell('-nama')).toBe("'-nama")
    expect(escapeCsvCell('@here')).toBe("'@here")
  })

  it('mengubah null dan undefined menjadi sel kosong', () => {
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
  })
})

describe('toCsv', () => {
  it('menyusun header dan baris dengan CRLF dan BOM', () => {
    const csv = toCsv(['Nama', 'Pax'], [['Panji', 2], ['Sindy', 1]])
    expect(csv).toBe('﻿Nama,Pax\r\nPanji,2\r\nSindy,1\r\n')
  })
})
