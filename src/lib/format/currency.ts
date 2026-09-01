/**
 * Format rupiah. Nominal SELALU integer rupiah utuh — tidak pernah float
 * dan tidak pernah dibagi 100 (aturan A4.1).
 */

/** `49700000` → `"Rp 49.700.000"` */
export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const digits = Math.abs(Math.trunc(amount)).toString()
  return `${sign}Rp ${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/**
 * Bentuk ringkas untuk kartu ringkasan (aturan C3).
 * `49700000` → `"Rp 49,7 jt"`, `1250000000` → `"Rp 1,25 m"`
 */
export function formatRupiahShort(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const n = Math.abs(Math.trunc(amount))

  const unit = (value: number, suffix: string) => {
    // Satu angka di belakang koma, kecuali miliar yang butuh dua agar tidak kehilangan makna.
    const decimals = suffix === 'm' ? 2 : 1
    const rounded = Number(value.toFixed(decimals))
    const text = Number.isInteger(rounded)
      ? rounded.toString()
      : rounded.toString().replace('.', ',')
    return `${sign}Rp ${text} ${suffix}`
  }

  if (n >= 1_000_000_000) return unit(n / 1_000_000_000, 'm')
  if (n >= 1_000_000) return unit(n / 1_000_000, 'jt')
  if (n >= 1_000) return unit(n / 1_000, 'rb')
  return formatRupiah(amount)
}

/**
 * Membaca nominal yang diketik pengguna menjadi integer rupiah.
 * Menerima "49.700.000", "49700000", "Rp 49.700.000".
 * Mengembalikan null bila tidak bisa dibaca sebagai angka.
 */
export function parseRupiah(input: string): number | null {
  const cleaned = input.replace(/[^0-9-]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const value = Number(cleaned)
  return Number.isSafeInteger(value) ? value : null
}
