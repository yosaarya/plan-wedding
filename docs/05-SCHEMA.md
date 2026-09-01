# Skema Data — `plan-wedding`

| Field | Value |
|---|---|
| Versi | 2.0 — pemakaian pribadi |
| Database | PostgreSQL 15 (Supabase) |
| DDL kanonik | `db/schema.sql` |
| Konvensi | `snake_case`, tabel jamak, PK `id uuid`, uang `bigint` rupiah, waktu `timestamptz` |

---

## 1. Peta Relasi

```
auth.users (Supabase)          2 akun, dibuat manual lewat dashboard
    │ 1:1
    ▼
profiles
    │ 1:n
    ▼
wedding_members ──n:1──► weddings
                             │
      ┌──────────────┬───────┼────────────┬──────────────┬──────────────┐
      ▼              ▼       ▼            ▼              ▼              ▼
   events   checklist_    budget_    guest_groups   seserahan_     milestones
            categories   categories       │           items             │
                 │            │           │                             │
                 ▼            ▼           ▼                             ▼
          checklist_     expenses ──► vendors                    wedding_settings
             items                       │
                                      guests ──┬─► rsvp_responses
                                               └─► wishes

Tabel global (tanpa wedding_id, read-only bagi aplikasi):
  template_checklist_categories · template_checklist_items
  template_budget_categories · template_seserahan_items
```

---

## 2. Tipe Enum

| Enum | Nilai |
|---|---|
| `member_role` | `owner`, `partner`, `viewer` |
| `event_type` | `akad`, `resepsi`, `lamaran`, `siraman`, `midodareni`, `ngunduh_mantu`, `pengajian`, `lainnya` |
| `task_priority` | `low`, `normal`, `high` |
| `assignee` | `groom`, `bride`, `both` |
| `party_side` | `groom`, `bride`, `both` |
| `rsvp_status` | `pending`, `attending`, `not_attending`, `maybe` |
| `invitation_status` | `not_sent`, `sent`, `opened` |
| `invitation_channel` | `whatsapp`, `printed`, `other` |
| `vendor_status` | `shortlist`, `contacted`, `booked`, `rejected` |
| `payment_method` | `cash`, `transfer`, `ewallet`, `card`, `other` |

Status pembayaran (Belum bayar / DP / Lunas) **tidak disimpan** — diturunkan dari
`paid_amount` vs `amount` (aturan A4.5).

---

## 3. Tabel Inti

### 3.1 `profiles`
Perluasan `auth.users`. Dibuat otomatis oleh trigger `on_auth_user_created`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id`, `ON DELETE CASCADE` |
| `email` | `text` | disalin dari auth saat akun dibuat |
| `full_name` | `text` | |
| `phone` | `text` | |
| `avatar_url` | `text` | |
| `active_wedding_id` | `uuid` | pernikahan yang sedang dibuka |
| `created_at` / `updated_at` | `timestamptz` | |

### 3.2 `weddings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` PK | |
| `owner_id` | `uuid` → `profiles` NOT NULL | |
| `groom_name` / `bride_name` | `text` NOT NULL | |
| `groom_nickname` / `bride_nickname` | `text` | untuk sapaan singkat |
| `city` | `text` | ditampilkan di chip countdown |
| `timezone` | `text` | default `Asia/Jakarta` |
| `total_budget` | `bigint` | default 0, `>= 0` |
| `currency` | `text` | default `IDR` |
| `estimated_guests` | `int` | dari onboarding |
| `cover_image_path` | `text` | path di Storage, bukan URL publik |
| `invitation_url` | `text` | URL undangan digital milik pengguna |
| `onboarding_completed_at` | `timestamptz` | `null` = belum onboarding |
| `deleted_at` | `timestamptz` | soft delete 30 hari |

### 3.3 `wedding_members`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` → `weddings` | |
| `user_id` | `uuid` → `profiles` | boleh `null` bila undangan belum diterima |
| `invited_email` | `text` | |
| `role` | `member_role` | |
| `accepted_at` | `timestamptz` | |

**Unik:** `(wedding_id, user_id)` dan `(wedding_id, invited_email)`.
Tabel ini adalah **poros seluruh kebijakan RLS**.

### 3.4 `events`
Mendukung pernikahan adat berbilang acara (A2.2, jalur evolusi v1.2).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | |
| `type` | `event_type` | |
| `name` | `text` | mis. "Akad Nikah" |
| `starts_at` | `timestamptz` | |
| `venue_name` / `venue_address` / `venue_maps_url` | `text` | |
| `is_primary` | `boolean` | acuan countdown; tepat satu per pernikahan |

**Indeks unik parsial:** satu `is_primary = true` per `wedding_id`.

---

## 4. Modul Checklist

### 4.1 `checklist_categories`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | |
| `name` | `text` | |
| `icon` | `text` | nama ikon Lucide |
| `sort_order` | `int` | |
| `is_system` | `boolean` | `true` untuk "Dokumen KUA" — tidak boleh dihapus (A3.8) |

### 4.2 `checklist_items`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | denormalisasi untuk RLS sederhana |
| `category_id` | `uuid` → `checklist_categories` `ON DELETE SET NULL` | |
| `title` | `text` NOT NULL | |
| `notes` | `text` | |
| `due_date` | `date` | `null` bila hasil hitungan sudah lewat (A3.3) |
| `priority` | `task_priority` | default `normal` |
| `assigned_to` | `assignee` | default `both` |
| `is_done` | `boolean` | default `false` |
| `completed_at` | `timestamptz` | |
| `expense_id` | `uuid` → `expenses` `ON DELETE SET NULL` | tautan opsional (F2.8) |
| `template_item_id` | `uuid` | asal seed, untuk analitik |
| `sort_order` | `int` | |

**Indeks:** `(wedding_id, is_done, due_date)` — menopang "Tugas Bulan Ini" dan "terlambat".

---

## 5. Modul Anggaran

### 5.1 `budget_categories`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | |
| `name` | `text` | |
| `planned_amount` | `bigint` | `>= 0` |
| `icon` / `color` / `sort_order` | | |

### 5.2 `expenses`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | |
| `category_id` | `uuid` → `budget_categories` `ON DELETE SET NULL` | |
| `vendor_id` | `uuid` → `vendors` `ON DELETE SET NULL` | |
| `title` | `text` NOT NULL | |
| `amount` | `bigint` NOT NULL | total biaya, `>= 0` |
| `paid_amount` | `bigint` | sudah dibayar, `>= 0` dan `<= amount` (A4.4) |
| `transaction_date` | `date` | |
| `due_date` | `date` | jatuh tempo pelunasan |
| `method` | `payment_method` | |
| `receipt_path` | `text` | Storage privat |
| `note` | `text` | |

**CHECK:** `paid_amount >= 0 AND paid_amount <= amount`.

### 5.3 `vendors` (opsional, dipakai ringan di v1)

`wedding_id`, `name`, `category`, `contact_name`, `phone`, `instagram`, `quoted_price`,
`status` (`vendor_status`), `note`.

---

## 6. Modul Tamu

### 6.1 `guest_groups`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | |
| `name` | `text` | "Keluarga", "Teman Kantor", "Bridesmaid" |
| `color` | `text` | token warna avatar |
| `side` | `party_side` | |

### 6.2 `guests`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | |
| `group_id` | `uuid` → `guest_groups` `ON DELETE SET NULL` | |
| `name` | `text` NOT NULL | |
| `phone` | `text` | tersimpan ternormalisasi `62…` (A5.4) |
| `address` | `text` | |
| `side` | `party_side` | pihak pria/wanita |
| `headcount` | `int` | default 1, `>= 1` — jumlah kepala (A5.1) |
| `invitation_status` | `invitation_status` | default `not_sent` |
| `invitation_channel` | `invitation_channel` | |
| `invitation_sent_at` | `timestamptz` | |
| `rsvp_status` | `rsvp_status` | default `pending` |
| `attending_count` | `int` | default 0, `<= headcount` (A5.8) |
| `responded_at` | `timestamptz` | |
| `rsvp_token` | `text` UNIQUE NOT NULL | 32 karakter acak (A5.10) |
| `note` | `text` | |
| `deleted_at` | `timestamptz` | soft delete (A5.13) |

**CHECK:** `attending_count >= 0 AND attending_count <= headcount`.
**Indeks:** `(wedding_id, rsvp_status)`, `(wedding_id, invitation_status)`,
`(wedding_id, group_id)`, GIN `pg_trgm` pada `name`, UNIQUE pada `rsvp_token`.

### 6.3 `rsvp_responses`
Riwayat jawaban; `guests` menyimpan yang terakhir (A5.12).

`wedding_id`, `guest_id`, `status`, `attending_count`, `message`, `source`
(`public_page` / `manual`), `ip_hash`, `created_at`.

### 6.4 `wishes`
Buku ucapan. `wedding_id`, `guest_id` (nullable), `display_name`, `message` (≤ 500),
`is_hidden`, `created_at`.

---

## 7. Modul Seserahan

### 7.1 `seserahan_items`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `wedding_id` | `uuid` | |
| `category` | `text` | "Alat Salat", "Skincare", … |
| `name` | `text` NOT NULL | |
| `quantity` | `int` | default 1 |
| `estimated_price` | `bigint` | dari template |
| `actual_price` | `bigint` | diisi saat dibeli |
| `is_purchased` | `boolean` | |
| `purchased_at` | `timestamptz` | |
| `tray_number` | `int` | hantaran ke-N (F5.6) |
| `product_url` | `text` | tautan toko, ditempel sendiri (aturan A6.3) |
| `expense_id` | `uuid` → `expenses` `ON DELETE SET NULL` | tautan ke anggaran (A6.4) |

---

## 8. Tabel Pendukung

| Tabel | Isi |
|---|---|
| `milestones` | `wedding_id`, `title`, `target_date`, `is_done` — kartu milestone di beranda |
| `wedding_settings` | 1:1 dengan `weddings`: `whatsapp_template`, `reminder_email_enabled`, `show_wishes_publicly` |
| `template_checklist_items` | `category_name`, `title`, `days_before_wedding`, `priority`, `sort_order` |
| `template_budget_categories` | `name`, `icon`, `default_share_percent` |
| `template_seserahan_items` | `category`, `name`, `estimated_price`, `sort_order` |

---

## 9. View Turunan

### `wedding_dashboard_stats`
Satu baris per pernikahan, dibaca sekali oleh beranda:

```
wedding_id, days_until_primary_event, primary_event_at,
checklist_total, checklist_done, checklist_overdue, checklist_due_this_month,
budget_total, budget_planned, budget_spent, budget_paid, budget_remaining,
guest_invitations, guest_headcount, guest_attending_people,
guest_invitations_sent, guest_pending,
seserahan_total, seserahan_purchased
```

### `checklist_category_progress`
`wedding_id, category_id, name, total_items, done_items, progress_percent`

### `budget_category_summary`
`wedding_id, category_id, name, planned_amount, spent_amount, paid_amount, usage_percent, is_over`

View mewarisi RLS dari tabel dasarnya (dibuat dengan `security_invoker = true`).

---

## 10. Kebijakan RLS

### Pola standar (berlaku untuk seluruh tabel domain)

```sql
create policy "member_read" on <tabel> for select
  using (public.is_wedding_member(wedding_id));

create policy "member_write" on <tabel> for insert
  with check (public.is_wedding_editor(wedding_id));

create policy "member_update" on <tabel> for update
  using (public.is_wedding_editor(wedding_id))
  with check (public.is_wedding_editor(wedding_id));

create policy "member_delete" on <tabel> for delete
  using (public.is_wedding_editor(wedding_id));
```

Fungsi bantu (`stable`, `security definer`, `search_path = public, pg_temp`):

| Fungsi | Arti |
|---|---|
| `is_wedding_member(uuid)` | pengguna saat ini punya baris di `wedding_members` untuk pernikahan tersebut |
| `is_wedding_editor(uuid)` | sama, dengan `role in ('owner','partner')` |
| `is_wedding_owner(uuid)` | `role = 'owner'` |

### Pengecualian

| Tabel | Kebijakan |
|---|---|
| `weddings` | select/update untuk anggota; delete hanya `owner` |
| `wedding_members` | select untuk sesama anggota; insert/delete hanya `owner` |
| Tabel `template_*` | select untuk pengguna terautentikasi; insert/update/delete dicabut lewat GRANT (aturan A6.2) |
| `guests`, `rsvp_responses` | akses publik **tidak** lewat kebijakan tabel, melainkan lewat dua RPC `SECURITY DEFINER` (§11) |

---

## 11. Fungsi Publik untuk RSVP

```sql
public.get_rsvp_context(p_token text) returns jsonb
```
Mengembalikan **hanya**: `guest_name`, `headcount`, `rsvp_status`, `attending_count`,
`groom_name`, `bride_name`, `event_name`, `event_starts_at`, `venue_name`,
`venue_maps_url`. Tidak mengembalikan `id`, nomor HP, atau data tamu lain (A5.11).

```sql
public.submit_rsvp(p_token text, p_status text, p_count int, p_message text) returns jsonb
```
Memvalidasi token & rentang `p_count` (0 ≤ count ≤ headcount), memperbarui `guests`,
menyisipkan `rsvp_responses`, dan menyisipkan `wishes` bila ada pesan.
Keduanya `security definer` dengan `search_path` terkunci, diberikan `execute` ke peran
`anon`.

`submit_rsvp` juga menolak lebih dari **10 jawaban per menit per tamu**. Batas ini hidup
di dalam fungsi, bukan di edge middleware: middleware pada hosting serverless berjalan
per-instance dan kehilangan hitungannya setiap instance baru dibuat.

---

## 12. Trigger

| Trigger | Fungsi |
|---|---|
| `on_auth_user_created` | Membuat baris `profiles` setiap kali akun auth dibuat |
| `set_updated_at` | Memperbarui `updated_at` pada setiap `UPDATE` (dipasang di semua tabel) |
| `guests_set_token` | Mengisi `rsvp_token` dengan 32 karakter acak saat insert |
| `checklist_set_completed_at` | Mengisi/mengosongkan `completed_at` saat `is_done` berubah |
| `enforce_single_primary_event` | Menjaga tepat satu `events.is_primary` per pernikahan |
| `enforce_member_limit` | Menolak anggota ke-3 pada paket Basic (A1.3) |

---

## 13. Data Seed

| Seed | Jumlah perkiraan | Sumber |
|---|---|---|
| Kategori checklist | 11 kategori | `db/seeds/01_checklist.sql` |
| Item checklist | 49 item dengan `days_before_wedding` | idem |
| Kategori anggaran | 11 kategori, porsi default menjumlah 100% | `db/seeds/02_budget.sql` |
| Item seserahan | 32 item dalam 9 kategori | `db/seeds/03_seserahan.sql` |

Seeding pengguna dijalankan oleh RPC `public.seed_wedding_defaults(p_wedding_id uuid)`
yang dipanggil satu kali di akhir onboarding, bersifat idempoten (tidak melakukan apa pun
bila pernikahan sudah punya item).

---

## 14. Retensi & Penghapusan

| Data | Retensi |
|---|---|
| Baris dengan `deleted_at` | Dihapus permanen 30 hari setelahnya oleh cron |
| Pernikahan pascaacara | Aktif 12 bulan setelah hari-H → arsip read-only → hapus di bulan ke-24 dengan 2 kali pemberitahuan email |
| Nomor HP tamu | Dihapus bersama pernikahan. Tidak pernah dibagikan ke layanan lain |
