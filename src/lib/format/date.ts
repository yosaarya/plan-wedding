import { DEFAULT_TIMEZONE } from '@/lib/constants'

/**
 * Tanggal selalu ditampilkan berbahasa Indonesia dan tidak pernah sebagai
 * `2026-11-22` di antarmuka pengguna (aturan C2).
 */

const LONG = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: DEFAULT_TIMEZONE,
})

const SHORT = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  timeZone: DEFAULT_TIMEZONE,
})

const MONTH_YEAR = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
  timeZone: DEFAULT_TIMEZONE,
})

/** `"Minggu, 22 November 2026"` */
export function formatTanggalPanjang(date: Date | string): string {
  return LONG.format(toDate(date))
}

/** `"15 Agu"` */
export function formatTanggalPendek(date: Date | string): string {
  return SHORT.format(toDate(date))
}

/** `"Agustus 2026"` */
export function formatBulanTahun(date: Date | string): string {
  return MONTH_YEAR.format(toDate(date))
}

/**
 * Selisih **hari kalender**, bukan selisih jam (aturan A2.3): H-1 tetap
 * "1 hari lagi" pukul berapa pun. Positif = masih akan datang.
 */
export function selisihHari(target: Date | string, from: Date | string = new Date()): number {
  const a = startOfDayInTimezone(toDate(from))
  const b = startOfDayInTimezone(toDate(target))
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/**
 * Teks countdown siap tampil. Menangani hari-H dan tanggal yang sudah lewat
 * (aturan A2.4) — sistem tidak pernah menolak tanggal masa lalu.
 */
export function teksCountdown(days: number): string {
  if (days === 0) return 'Hari ini!'
  if (days === 1) return '1 hari lagi'
  if (days > 1) return `${days} hari lagi`
  if (days === -1) return 'Kemarin'
  return `${Math.abs(days)} hari yang lalu`
}

/** Awal hari dalam zona waktu pernikahan, dinyatakan sebagai Date UTC. */
function startOfDayInTimezone(date: Date): Date {
  // en-CA menghasilkan YYYY-MM-DD, bentuk yang bisa langsung diparse sebagai UTC.
  const ymd = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: DEFAULT_TIMEZONE,
  }).format(date)
  return new Date(`${ymd}T00:00:00Z`)
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}
