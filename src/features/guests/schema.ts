import { z } from 'zod'
import { MAX_WISH_LENGTH } from '@/lib/constants'
import { normalisasiNomor } from '@/lib/whatsapp/phone'

const partySide = z.enum(['groom', 'bride', 'both'])
const rsvpStatus = z.enum(['pending', 'attending', 'not_attending', 'maybe'])

/**
 * Nomor HP disimpan sudah ternormalisasi (aturan A5.4). Nomor kosong sah —
 * tamu undangan cetak tidak harus punya nomor (aturan A5.2).
 */
const phone = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? '')
  .superRefine((value, ctx) => {
    // Nomor kosong sah. Nomor yang diisi tapi tidak dikenali harus ditolak,
    // bukan diam-diam disimpan sebagai kosong.
    if (value !== '' && normalisasiNomor(value) === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nomor HP belum dikenali. Contoh: 081234567890.',
      })
    }
  })
  .transform((value) => (value === '' ? null : normalisasiNomor(value)))

export const guestSchema = z.object({
  name: z.string().trim().min(1, 'Nama tamu belum diisi').max(120),
  phone,
  address: z.string().trim().max(240).optional().or(z.literal('')),
  side: partySide.default('both'),
  groupId: z.uuid().optional().or(z.literal('')),
  headcount: z.coerce.number().int().min(1, 'Jumlah kepala minimal 1').max(50),
  note: z.string().trim().max(500).optional().or(z.literal('')),
})

export type GuestInput = z.infer<typeof guestSchema>

export const updateRsvpSchema = z
  .object({
    guestId: z.uuid(),
    status: rsvpStatus,
    attendingCount: z.coerce.number().int().min(0).max(50),
  })
  // Jumlah hadir hanya berarti bila statusnya 'attending' (aturan A5.8).
  .transform((value) => ({
    ...value,
    attendingCount: value.status === 'attending' ? Math.max(value.attendingCount, 1) : 0,
  }))

export const importSchema = z.object({
  text: z.string().trim().min(1, 'Belum ada nama yang ditempel').max(50_000),
  groupId: z.uuid().optional().or(z.literal('')),
  side: partySide.default('both'),
})

export const publicRsvpSchema = z.object({
  token: z.string().min(16).max(64),
  status: rsvpStatus,
  attendingCount: z.coerce.number().int().min(0).max(50),
  message: z.string().trim().max(MAX_WISH_LENGTH).optional().or(z.literal('')),
})
