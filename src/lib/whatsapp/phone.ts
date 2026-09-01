/**
 * Normalisasi nomor HP Indonesia ke bentuk E.164 tanpa `+` (aturan A5.4).
 *
 *   "0812-3456-789"  → "628123456789"
 *   "+62 812 3456789"→ "628123456789"
 *   "8123456789"     → "628123456789"
 *
 * Mengembalikan null bila tidak bisa dinormalisasi. Nomor yang tidak valid
 * membuat tombol WhatsApp nonaktif, bukan memunculkan error (aturan A5.3).
 */
export function normalisasiNomor(input: string | null | undefined): string | null {
  if (!input) return null

  // Buang segala pemisah: spasi, tanda hubung, titik, kurung.
  let digits = input.replace(/[\s\-().]/g, '')

  if (digits.startsWith('+')) digits = digits.slice(1)
  if (!/^\d+$/.test(digits)) return null

  if (digits.startsWith('62')) {
    // sudah berkode negara
  } else if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`
  } else if (digits.startsWith('8')) {
    // Orang sering menulis tanpa 0 di depan.
    digits = `62${digits}`
  } else {
    return null
  }

  // Nomor seluler Indonesia: 62 + 8xx + 7..11 digit. Total 10-15 digit.
  if (digits.length < 10 || digits.length > 15) return null
  if (!digits.startsWith('628')) return null

  return digits
}

/** Bentuk enak dibaca untuk ditampilkan: "0812-3456-789". */
export function formatNomorTampilan(normalized: string | null): string {
  if (!normalized) return ''
  const local = `0${normalized.slice(2)}`
  const parts = local.match(/^(\d{4})(\d{4})(\d*)$/)
  if (!parts) return local
  return [parts[1], parts[2], parts[3]].filter(Boolean).join('-')
}

export function nomorValid(input: string | null | undefined): boolean {
  return normalisasiNomor(input) !== null
}
