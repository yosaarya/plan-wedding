import { describe, expect, it } from 'vitest'
import {
  asInvitationStatus,
  asPartySide,
  asRsvpStatus,
  asUuid,
  buatTautanRsvp,
  cariNomorKembar,
  inisial,
  orangHadir,
  parseDaftarTempel,
  sanitasiPencarian,
} from './lib'

describe('buatTautanRsvp', () => {
  it('menyusun URL tanpa garis miring ganda', () => {
    expect(buatTautanRsvp('abc123', 'https://nikah.id/')).toBe('https://nikah.id/rsvp/abc123')
    expect(buatTautanRsvp('abc123', 'https://nikah.id')).toBe('https://nikah.id/rsvp/abc123')
  })
})

describe('orangHadir', () => {
  it('hanya menghitung yang menyatakan hadir (aturan A5.8)', () => {
    expect(orangHadir({ rsvp_status: 'attending', attending_count: 3 })).toBe(3)
    // attending_count sisa dari jawaban sebelumnya tidak boleh ikut terhitung.
    expect(orangHadir({ rsvp_status: 'not_attending', attending_count: 3 })).toBe(0)
    expect(orangHadir({ rsvp_status: 'pending', attending_count: 0 })).toBe(0)
    expect(orangHadir({ rsvp_status: 'maybe', attending_count: 2 })).toBe(0)
  })
})

describe('inisial', () => {
  it('mengambil huruf pertama dan menangani nama kosong', () => {
    expect(inisial('Panji')).toBe('P')
    expect(inisial('  sindy')).toBe('S')
    expect(inisial('')).toBe('?')
    expect(inisial('   ')).toBe('?')
  })
})

describe('cariNomorKembar', () => {
  const daftar = [
    { id: '1', name: 'Panji', phone: '628111' },
    { id: '2', name: 'Sindy', phone: '628222' },
    { id: '3', name: 'Ibu Panji', phone: '628111' },
  ]

  it('menemukan tamu lain dengan nomor sama (aturan A5.5)', () => {
    expect(cariNomorKembar('628111', daftar).map((g) => g.name)).toEqual(['Panji', 'Ibu Panji'])
  })

  it('tidak menganggap dirinya sendiri sebagai kembaran saat mengubah data', () => {
    expect(cariNomorKembar('628111', daftar, '1').map((g) => g.name)).toEqual(['Ibu Panji'])
  })

  it('nomor kosong tidak pernah dianggap duplikat', () => {
    expect(cariNomorKembar(null, daftar)).toEqual([])
  })
})

describe('parseDaftarTempel', () => {
  it('membaca satu nama per baris', () => {
    expect(parseDaftarTempel('Panji\nSindy\nAcos')).toEqual([
      { name: 'Panji', headcount: 1 },
      { name: 'Sindy', headcount: 1 },
      { name: 'Acos', headcount: 1 },
    ])
  })

  it('membaca jumlah kepala setelah koma atau titik koma', () => {
    expect(parseDaftarTempel('Panji, 2\nSindy; 3')).toEqual([
      { name: 'Panji', headcount: 2 },
      { name: 'Sindy', headcount: 3 },
    ])
  })

  it('melewati baris kosong dan spasi berlebih (aturan A5.14)', () => {
    expect(parseDaftarTempel('  Panji  \n\n\n   \nSindy\n')).toEqual([
      { name: 'Panji', headcount: 1 },
      { name: 'Sindy', headcount: 1 },
    ])
  })

  it('memperlakukan jumlah nol sebagai satu, karena undangan selalu minimal satu kepala', () => {
    expect(parseDaftarTempel('Panji, 0')).toEqual([{ name: 'Panji', headcount: 1 }])
  })

  it('tidak salah membaca nama yang memang mengandung koma', () => {
    expect(parseDaftarTempel('Bapak Ahmad, S.Pd')).toEqual([
      { name: 'Bapak Ahmad, S.Pd', headcount: 1 },
    ])
  })
})

describe('penjaga input dari URL', () => {
  it('hanya menerima nilai enum yang dikenal', () => {
    expect(asRsvpStatus('attending')).toBe('attending')
    expect(asInvitationStatus('sent')).toBe('sent')
    expect(asPartySide('groom')).toBe('groom')
  })

  it('membuang nilai ngawur alih-alih meneruskannya ke database', () => {
    // Tanpa ini, ?rsvp=xxx membuat Postgres menolak cast ke enum dan
    // seluruh halaman tamu gagal dimuat.
    expect(asRsvpStatus('xxx')).toBeUndefined()
    expect(asRsvpStatus('')).toBeUndefined()
    expect(asRsvpStatus(undefined)).toBeUndefined()
    expect(asInvitationStatus('dikirim')).toBeUndefined()
    expect(asPartySide('pria')).toBeUndefined()
  })

  it('hanya menerima UUID berbentuk benar untuk filter grup', () => {
    expect(asUuid('bbbbbbbb-0000-0000-0000-000000000001')).toBe(
      'bbbbbbbb-0000-0000-0000-000000000001',
    )
    expect(asUuid('abc')).toBeUndefined()
    expect(asUuid('')).toBeUndefined()
    expect(asUuid(null)).toBeUndefined()
  })
})

describe('sanitasiPencarian', () => {
  it('membiarkan pencarian biasa apa adanya', () => {
    expect(sanitasiPencarian('Panji')).toBe('Panji')
    expect(sanitasiPencarian('  Sindy PA  ')).toBe('Sindy PA')
    expect(sanitasiPencarian('0812')).toBe('0812')
  })

  it('membuang karakter yang merupakan sintaks filter PostgREST', () => {
    // Koma dan titik memisahkan bagian filter; kurung mengelompokkannya.
    expect(sanitasiPencarian('Ahmad, S.Pd')).toBe('Ahmad S Pd')
    expect(sanitasiPencarian('Budi (kantor)')).toBe('Budi kantor')
  })

  it('membuang wildcard ilike supaya pencarian tidak melebar diam-diam', () => {
    expect(sanitasiPencarian('%')).toBe('')
    expect(sanitasiPencarian('a_b')).toBe('a b')
  })

  it('memotong kata pencarian yang kepanjangan', () => {
    expect(sanitasiPencarian('a'.repeat(200))).toHaveLength(80)
  })
})
