import { describe, expect, it } from 'vitest'
import { buatTautanWhatsApp, buatVars, renderTemplate } from './message'

const vars = buatVars({
  guestName: 'Panji',
  groomName: 'Agus',
  brideName: 'Siti',
  eventDate: '2026-11-22T03:00:00Z',
  rsvpUrl: 'https://contoh.id/rsvp/abc123',
})

describe('renderTemplate', () => {
  it('mengisi seluruh placeholder yang didukung', () => {
    const hasil = renderTemplate(
      'Halo {nama}, kami {pria} & {wanita} menikah pada {tanggal}. Konfirmasi: {link}',
      vars,
    )
    expect(hasil).toBe(
      'Halo Panji, kami Agus & Siti menikah pada Minggu, 22 November 2026. ' +
        'Konfirmasi: https://contoh.id/rsvp/abc123',
    )
  })

  it('membiarkan placeholder yang salah ketik apa adanya, supaya terlihat', () => {
    expect(renderTemplate('Halo {namaa}', vars)).toBe('Halo {namaa}')
  })

  it('memberi teks pengganti bila tanggal belum diisi', () => {
    const tanpaTanggal = buatVars({
      guestName: 'Panji',
      groomName: 'Agus',
      brideName: 'Siti',
      eventDate: null,
      rsvpUrl: 'https://contoh.id/rsvp/abc123',
    })
    expect(renderTemplate('{tanggal}', tanpaTanggal)).toBe('tanggal menyusul')
  })
})

describe('buatTautanWhatsApp', () => {
  it('membangun deep link dengan pesan ter-encode', () => {
    const url = buatTautanWhatsApp('081234567890', 'Halo Panji & keluarga')
    expect(url).toBe('https://wa.me/6281234567890?text=Halo%20Panji%20%26%20keluarga')
  })

  it('mengembalikan null untuk nomor tidak valid, supaya tombol dinonaktifkan (aturan A5.3)', () => {
    expect(buatTautanWhatsApp(null, 'pesan')).toBeNull()
    expect(buatTautanWhatsApp('021555000', 'pesan')).toBeNull()
  })

  it('meng-encode baris baru pada template asli', () => {
    const url = buatTautanWhatsApp('081234567890', 'baris satu\nbaris dua')
    expect(url).toContain('baris%20satu%0Abaris%20dua')
  })
})
