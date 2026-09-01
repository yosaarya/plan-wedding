/**
 * Penulis CSV kecil. Dipakai untuk ekspor cadangan mandiri (aturan A2.7) —
 * satu-satunya jalan keluar data yang tidak bergantung pada layanan mana pun
 * tetap hidup.
 */

/**
 * Membungkus satu sel. Selain tanda kutip dan pemisah, sel yang diawali
 * `=`, `+`, `-`, atau `@` juga diberi awalan kutip: tanpa itu, spreadsheet
 * memperlakukannya sebagai rumus (CSV injection).
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''

  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`

  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.map(escapeCsvCell).join(',')]
  for (const row of rows) lines.push(row.map(escapeCsvCell).join(','))
  // BOM supaya Excel membaca UTF-8 dengan benar — nama Indonesia sering
  // mengandung karakter beraksen.
  return `﻿${lines.join('\r\n')}\r\n`
}
