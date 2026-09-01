/**
 * "Kepala" dan "undangan" adalah dua angka berbeda dan tidak boleh tertukar
 * (aturan A5.1). Helper ini memaksa keduanya punya label sendiri.
 */

export function labelKepala(headcount: number): string {
  return `${headcount} kepala`
}

export function labelUndangan(rows: number): string {
  return `${rows} undangan`
}

/** "Hadir" adalah jumlah orang, bukan jumlah baris tamu (aturan A5.9). */
export function labelHadir(people: number): string {
  return `${people} orang hadir`
}

export function labelPax(headcount: number): string {
  return `${headcount} pax`
}
