import { formatTanggalPanjang } from '@/lib/format/date'
import { normalisasiNomor } from '@/lib/whatsapp/phone'

/** Placeholder yang didukung template pesan undangan (kebutuhan F4.8). */
export type TemplateVars = {
  nama: string
  pria: string
  wanita: string
  tanggal: string
  link: string
}

export const PLACEHOLDERS = ['nama', 'pria', 'wanita', 'tanggal', 'link'] as const

/**
 * Mengisi placeholder `{nama}`, `{pria}`, dan seterusnya.
 * Placeholder yang tidak dikenal dibiarkan apa adanya supaya pengguna bisa
 * melihat salah ketiknya, bukan menemukan teks hilang diam-diam.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key as keyof TemplateVars] : match,
  )
}

export function buatVars(input: {
  guestName: string
  groomName: string
  brideName: string
  eventDate: Date | string | null
  rsvpUrl: string
}): TemplateVars {
  return {
    nama: input.guestName,
    pria: input.groomName,
    wanita: input.brideName,
    tanggal: input.eventDate ? formatTanggalPanjang(input.eventDate) : 'tanggal menyusul',
    link: input.rsvpUrl,
  }
}

/**
 * Deep link WhatsApp (arsitektur §9.1). Tidak ada API yang dipanggil —
 * pesan dikirim sendiri dari WhatsApp milik pengguna.
 *
 * Mengembalikan null bila nomor tidak valid, sehingga pemanggil bisa
 * menonaktifkan tombolnya.
 */
export function buatTautanWhatsApp(phone: string | null | undefined, message: string): string | null {
  const nomor = normalisasiNomor(phone)
  if (!nomor) return null
  return `https://wa.me/${nomor}?text=${encodeURIComponent(message)}`
}
