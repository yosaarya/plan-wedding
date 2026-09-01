/**
 * Tipe database.
 *
 * Idealnya berkas ini di-generate (`supabase gen types typescript`) dan tidak
 * disunting tangan (aturan B1.3). Sampai proyek Supabase dibuat, ia ditulis
 * manual mengikuti `db/schema.sql` — bila keduanya berbeda, `db/schema.sql`
 * yang benar.
 */

export type MemberRole = 'owner' | 'partner' | 'viewer'
export type EventType =
  | 'akad' | 'resepsi' | 'lamaran' | 'siraman'
  | 'midodareni' | 'ngunduh_mantu' | 'pengajian' | 'lainnya'
export type TaskPriority = 'low' | 'normal' | 'high'
export type Assignee = 'groom' | 'bride' | 'both'
export type PartySide = 'groom' | 'bride' | 'both'
export type RsvpStatus = 'pending' | 'attending' | 'not_attending' | 'maybe'
export type InvitationStatus = 'not_sent' | 'sent' | 'opened'
export type InvitationChannel = 'whatsapp' | 'printed' | 'other'
export type VendorStatus = 'shortlist' | 'contacted' | 'booked' | 'rejected'
export type PaymentMethod = 'cash' | 'transfer' | 'ewallet' | 'card' | 'other'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  active_wedding_id: string | null
}

export type Wedding = {
  id: string
  owner_id: string
  groom_name: string
  bride_name: string
  groom_nickname: string | null
  bride_nickname: string | null
  city: string | null
  timezone: string
  /** Integer rupiah utuh (aturan A4.1). */
  total_budget: number
  currency: string
  estimated_guests: number | null
  cover_image_path: string | null
  invitation_url: string | null
  onboarding_completed_at: string | null
  deleted_at: string | null
}

export type WeddingMember = {
  id: string
  wedding_id: string
  user_id: string | null
  invited_email: string | null
  role: MemberRole
  accepted_at: string | null
}

export type WeddingEvent = {
  id: string
  wedding_id: string
  type: EventType
  name: string
  starts_at: string | null
  ends_at: string | null
  venue_name: string | null
  venue_address: string | null
  venue_maps_url: string | null
  is_primary: boolean
  sort_order: number
}

export type ChecklistCategory = {
  id: string
  wedding_id: string
  name: string
  icon: string | null
  sort_order: number
  is_system: boolean
}

export type ChecklistItem = {
  id: string
  wedding_id: string
  category_id: string | null
  title: string
  notes: string | null
  due_date: string | null
  priority: TaskPriority
  assigned_to: Assignee
  is_done: boolean
  completed_at: string | null
  expense_id: string | null
  sort_order: number
}

export type BudgetCategory = {
  id: string
  wedding_id: string
  name: string
  planned_amount: number
  icon: string | null
  color: string | null
  sort_order: number
}

export type Expense = {
  id: string
  wedding_id: string
  category_id: string | null
  vendor_id: string | null
  title: string
  amount: number
  paid_amount: number
  transaction_date: string
  due_date: string | null
  method: PaymentMethod | null
  receipt_path: string | null
  note: string | null
}

export type GuestGroup = {
  id: string
  wedding_id: string
  name: string
  color: string | null
  side: PartySide
  sort_order: number
}

export type Guest = {
  id: string
  wedding_id: string
  group_id: string | null
  name: string
  /** Selalu tersimpan ternormalisasi `62…` (aturan A5.4). */
  phone: string | null
  address: string | null
  side: PartySide
  /** Jumlah kepala pada satu undangan (aturan A5.1). */
  headcount: number
  invitation_status: InvitationStatus
  invitation_channel: InvitationChannel | null
  invitation_sent_at: string | null
  rsvp_status: RsvpStatus
  attending_count: number
  responded_at: string | null
  rsvp_token: string
  note: string | null
  deleted_at: string | null
}

export type SeserahanItem = {
  id: string
  wedding_id: string
  category: string
  name: string
  quantity: number
  estimated_price: number | null
  actual_price: number | null
  is_purchased: boolean
  purchased_at: string | null
  tray_number: number | null
  product_url: string | null
  expense_id: string | null
  note: string | null
  sort_order: number
}

export type WeddingSettings = {
  wedding_id: string
  whatsapp_template: string
  reminder_email_enabled: boolean
  show_wishes_publicly: boolean
}

/** View `wedding_dashboard_stats` — satu baris per pernikahan (arsitektur §8). */
export type DashboardStats = {
  wedding_id: string
  primary_event_at: string | null
  days_until_primary_event: number | null
  checklist_total: number
  checklist_done: number
  checklist_overdue: number
  checklist_due_this_month: number
  budget_total: number
  budget_planned: number
  budget_spent: number
  budget_paid: number
  budget_remaining: number
  /** Jumlah baris tamu (aturan A5.1). */
  guest_invitations: number
  /** Jumlah kepala (aturan A5.1). */
  guest_headcount: number
  /** Jumlah ORANG yang menyatakan hadir, bukan jumlah baris (aturan A5.9). */
  guest_attending_people: number
  guest_invitations_sent: number
  guest_pending: number
  seserahan_total: number
  seserahan_purchased: number
}

/** Konteks yang dikembalikan RPC `get_rsvp_context` — sengaja terbatas (aturan A5.11). */
export type RsvpContext = {
  guest_name: string
  headcount: number
  rsvp_status: RsvpStatus
  attending_count: number
  groom_name: string
  bride_name: string
  event_name: string | null
  event_starts_at: string | null
  venue_name: string | null
  venue_address: string | null
  venue_maps_url: string | null
  invitation_url: string | null
}
