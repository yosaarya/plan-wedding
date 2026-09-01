# Arsitektur Sistem — `plan-wedding`

| Field | Value |
|---|---|
| Versi | 1.0 |
| Status | Usulan untuk approval |
| Prinsip | Mobile-first, serverless, biaya rendah, satu bahasa (TypeScript), keamanan di lapisan data |

---

## 1. Prinsip Arsitektur

1. **Keamanan ditegakkan di database, bukan di aplikasi.** Setiap tabel milik pengguna
   dilindungi Row Level Security. Bug di kode aplikasi tidak boleh bisa membocorkan data
   pernikahan lain.
2. **Boring technology.** Satu tim kecil (1–3 orang). Pilih tumpukan yang dokumentasinya
   melimpah dan operasionalnya mendekati nol.
3. **Server-first rendering, klien tipis.** Data dibaca di server (React Server
   Components), mutasi lewat Server Actions. Tidak ada state management global yang berat.
4. **Optimistic UI untuk aksi mikro.** Centang checklist dan ubah RSVP harus terasa
   instan; rekonsiliasi terjadi di belakang.
5. **Satu sumber kebenaran per pernikahan.** Semua tabel domain membawa `wedding_id`.
6. **Integrasi eksternal selalu punya jalur cadangan manual.** Webhook gagal → import CSV.

---

## 2. Tumpukan Teknologi

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 15** (App Router, TypeScript strict) | RSC + Server Actions memangkas kebutuhan menulis API layer; hosting mudah |
| Bahasa | TypeScript 5.x, `strict: true` | Satu bahasa dari DB ke UI lewat tipe hasil-generate |
| Styling | **Tailwind CSS v4** + komponen sendiri di atas **Radix UI primitives** | Kontrol penuh atas tampilan (produk ini menjual estetika), aksesibilitas dari Radix |
| Database | **PostgreSQL** via **Supabase** | RLS bawaan, auth terintegrasi, storage, biaya awal nol |
| Auth | **Supabase Auth** (email+password, magic link) | Cocok persis dengan alur "akun dibuat otomatis, aktivasi lewat email" |
| Storage | Supabase Storage (bucket privat) | Foto sampul, bukti nota |
| Email transaksional | **Resend** + React Email | Deliverability baik, template sebagai komponen React |
| Hosting | **Vercel** (region `sin1` Singapura) | Latensi terendah untuk pengguna Indonesia |
| Job terjadwal | Vercel Cron | Pengingat mingguan, arsip data |
| Analitik | PostHog (self-host/cloud) | Funnel aktivasi & event produk |
| Error tracking | Sentry | — |
| Validasi | **Zod** | Satu skema untuk validasi form dan payload webhook |
| Tabel & form | React Hook Form + Zod resolver | — |
| Tes | Vitest (unit), Playwright (E2E), pgTAP (RLS) | — |

### Alternatif yang dipertimbangkan dan ditolak

| Alternatif | Alasan ditolak |
|---|---|
| React Native / Flutter | Menambah 4+ minggu dan proses review store, sementara PWA memenuhi kebutuhan (A2HS sudah dijanjikan di halaman jualan) |
| Firebase / Firestore | Kueri agregat (total budget, statistik tamu) canggung tanpa SQL; aturan keamanan lebih sulit diuji daripada RLS |
| Backend terpisah (NestJS) | Overhead operasional tanpa manfaat pada skala ini |
| Prisma sebagai satu-satunya akses data | Prisma memutus RLS jika memakai koneksi service role; kita memakai klien Supabase yang membawa JWT pengguna |

---

## 3. Diagram Konteks

```
                    ┌───────────────────────────┐
                    │   Marketplace Digital     │
                    │   (Lynk.id / Mayar)       │
                    └────────────┬──────────────┘
                                 │ webhook order.paid (HMAC)
                                 ▼
┌──────────┐   HTTPS   ┌─────────────────────────────────────┐
│ Browser  │◄─────────►│        Next.js @ Vercel (sin1)      │
│ (PWA)    │           │  ┌──────────────┬─────────────────┐ │
│ Mobile   │           │  │ RSC / Pages  │ Server Actions  │ │
└────┬─────┘           │  ├──────────────┴─────────────────┤ │
     │                 │  │ Route Handlers                 │ │
     │ wa.me link      │  │  /api/webhooks/order           │ │
     ▼                 │  │  /api/cron/reminders           │ │
┌──────────┐           │  │  /api/export/*                 │ │
│ WhatsApp │           │  └────────────────────────────────┘ │
│ (klien   │           └───────┬──────────────┬──────────────┘
│  user)   │                   │              │
└──────────┘        JWT user   │              │ service role
                    (RLS aktif)│              │ (khusus webhook/cron)
                               ▼              ▼
                    ┌──────────────────────────────────┐
                    │  Supabase                        │
                    │  ├─ PostgreSQL (RLS)             │
                    │  ├─ Auth (users, sessions)       │
                    │  └─ Storage (foto, nota)         │
                    └──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐   ┌──────────────┐
                    │ Resend (email)      │   │ PostHog      │
                    └─────────────────────┘   │ Sentry       │
                                              └──────────────┘
```

---

## 4. Struktur Direktori

```
plan-wedding/
├── docs/                          # dokumen ini
├── db/
│   ├── schema.sql                 # skema kanonik (referensi)
│   ├── migrations/                # migrasi berurutan, dijalankan di CI
│   └── seeds/                     # template checklist, budget, seserahan
├── src/
│   ├── app/
│   │   ├── (marketing)/           # landing, harga, bantuan, kebijakan privasi
│   │   ├── (auth)/
│   │   │   ├── masuk/
│   │   │   ├── aktivasi/          # buat password dari magic link
│   │   │   └── aktivasi/kirim-ulang/
│   │   ├── (app)/                 # area terproteksi, memakai bottom nav
│   │   │   ├── layout.tsx         # guard sesi + guard entitlement
│   │   │   ├── beranda/
│   │   │   ├── checklist/
│   │   │   ├── anggaran/
│   │   │   ├── tamu/
│   │   │   ├── seserahan/
│   │   │   └── profil/
│   │   ├── onboarding/
│   │   ├── rsvp/[token]/          # PUBLIK, tanpa login
│   │   ├── admin/                 # panel back office, guard peran admin
│   │   └── api/
│   │       ├── webhooks/order/
│   │       ├── cron/reminders/
│   │       └── export/[resource]/
│   ├── components/
│   │   ├── ui/                    # primitif: Button, Card, Sheet, Input, ...
│   │   ├── patterns/              # StatTile, ProgressBar, EmptyState, ...
│   │   └── features/              # komponen per modul
│   ├── features/                  # logika per domain (lihat §5)
│   │   ├── wedding/
│   │   ├── checklist/
│   │   ├── budget/
│   │   ├── guests/
│   │   ├── seserahan/
│   │   └── billing/
│   ├── lib/
│   │   ├── supabase/              # klien server, klien browser, klien admin
│   │   ├── auth/                  # requireSession, requireWedding
│   │   ├── format/                # tanggal & mata uang id-ID
│   │   ├── whatsapp/              # pembuat deep link & render template
│   │   └── validation/            # skema Zod bersama
│   ├── emails/                    # template React Email
│   └── types/database.ts          # hasil generate dari skema Supabase
├── public/                        # ikon PWA, manifest
├── tests/
│   ├── e2e/                       # Playwright
│   └── rls/                       # tes isolasi data
└── CLAUDE.md                      # aturan kerja untuk agen & kontributor
```

---

## 5. Lapisan Aplikasi

Setiap modul di `src/features/<domain>/` memakai struktur seragam:

```
features/guests/
├── queries.ts     # baca data. Hanya dipanggil dari Server Component.
├── actions.ts     # 'use server'. Mutasi. Selalu: validasi → otorisasi → tulis → revalidate.
├── schema.ts      # skema Zod (dipakai bersama form klien & action server)
├── types.ts       # tipe turunan
└── lib.ts         # logika murni (hitung statistik, render template WA) — mudah diuji
```

### Aturan tak boleh dilanggar

1. Komponen klien **tidak pernah** memanggil Supabase langsung untuk data domain.
   Baca lewat RSC, tulis lewat Server Action.
2. Setiap Server Action diawali `const { user, weddingId } = await requireWedding()`.
3. Klien service-role (`supabaseAdmin`) hanya boleh diimpor di `app/api/webhooks/*`,
   `app/api/cron/*`, dan `app/admin/*`. Dijaga oleh aturan ESLint `no-restricted-imports`.
4. Perhitungan uang memakai **integer rupiah** (`bigint` di DB, `number` di TS).
   Tidak ada floating point untuk nominal.

### Anatomi Server Action (pola wajib)

```ts
'use server'

export async function updateGuestRsvp(input: unknown) {
  // 1. Validasi bentuk
  const data = updateRsvpSchema.parse(input)

  // 2. Otorisasi — melempar jika tidak ada sesi/akses
  const { supabase, weddingId } = await requireWedding()

  // 3. Tulis. RLS adalah jaring pengaman kedua; filter eksplisit adalah yang pertama.
  const { error } = await supabase
    .from('guests')
    .update({ rsvp_status: data.status, attending_count: data.attendingCount })
    .eq('id', data.guestId)
    .eq('wedding_id', weddingId)

  if (error) throw new AppError('GUEST_UPDATE_FAILED', error.message)

  // 4. Segarkan cache
  revalidatePath('/tamu')
  revalidatePath('/beranda')
}
```

---

## 6. Autentikasi & Otorisasi

### 6.1 Model peran

| Peran | Cakupan | Hak |
|---|---|---|
| `owner` | Satu pernikahan | Semua, termasuk mengundang/mencabut anggota dan menghapus pernikahan |
| `partner` | Satu pernikahan | Baca & tulis semua modul; tidak bisa menghapus pernikahan |
| `viewer` | Satu pernikahan | Baca saja (untuk keluarga, v1.1) |
| `admin` | Global | Panel back office; **tidak** membaca isi data pernikahan kecuali untuk dukungan atas permintaan tertulis |
| `anon` | Satu baris tamu | Halaman RSVP publik lewat token |

### 6.2 Alur aktivasi (implementasi)

1. Webhook memanggil `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true })`.
   Idempoten: bila email sudah ada, ambil user yang ada.
2. Insert baris `entitlements` dengan kunci unik `(provider, external_order_id)` — pemanggilan
   webhook berulang tidak menggandakan data.
3. `supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })` → URL aktivasi.
4. Resend mengirim email dengan URL tersebut. Umur token 7 hari.
5. Halaman `/aktivasi` menukar token menjadi sesi, lalu menampilkan form set password
   (`supabase.auth.updateUser({ password })`).
6. Middleware mengarahkan pengguna tanpa pernikahan ke `/onboarding`.

### 6.3 Guard

- `middleware.ts` — menyegarkan sesi, memblokir `(app)/*` tanpa sesi.
- `requireSession()` — melempar `UnauthorizedError` bila tidak ada sesi.
- `requireWedding()` — mengambil `wedding_id` aktif dari keanggotaan; melempar bila tidak ada.
- `requireEntitlement()` — memblokir bila entitlement dicabut (refund).
- `requireAdmin()` — memeriksa klaim `app_metadata.role === 'admin'`.

### 6.4 Akses publik RSVP

Halaman `/rsvp/[token]` tidak boleh membaca tabel `guests` secara langsung.
Ia memanggil dua fungsi Postgres `SECURITY DEFINER`:

- `public.get_rsvp_context(p_token text)` → mengembalikan hanya kolom yang aman
  (nama tamu, nama pengantin, tanggal, lokasi, status RSVP saat ini).
- `public.submit_rsvp(p_token text, p_status text, p_count int, p_message text)` → menulis
  jawaban dan mencatat ucapan.

Token: 32 karakter acak kriptografis, unik, dan **bukan** turunan dari `id` tamu.
Rate limit 10 permintaan/menit per IP di edge middleware.

---

## 7. Model Data (ringkas)

Detail lengkap ada di `docs/05-SCHEMA.md` dan `db/schema.sql`.

```
auth.users
   └─ profiles (1:1)
        └─ wedding_members (n) ──┐
                                 ▼
                            weddings ──┬─ events (akad, resepsi, siraman, ...)
                                       ├─ checklist_categories ─ checklist_items
                                       ├─ budget_categories ──── expenses
                                       ├─ vendors ──────────────┘ (opsional)
                                       ├─ guest_groups ───────── guests ─ rsvp_responses
                                       ├─ seserahan_items ─────── (ref) product_catalog
                                       ├─ milestones
                                       └─ settings (template WA, URL undangan)

Global (tanpa wedding_id):
   template_checklists / template_checklist_items
   template_budget_categories
   template_seserahan_items
   product_catalog
   entitlements (per user)
   webhook_events (log mentah)
```

**Kunci desain:** setiap tabel domain membawa `wedding_id` secara langsung (denormalisasi
sengaja) agar kebijakan RLS berupa satu predikat sederhana dan indeks tetap efisien.

---

## 8. Strategi Data & Kinerja

| Kebutuhan | Pendekatan |
|---|---|
| Statistik beranda (total kepala, hadir, terkirim) | View `wedding_dashboard_stats` yang mengagregasi per `wedding_id`; dibaca dalam satu round-trip |
| Daftar 300+ tamu di HP | Paginasi 50/halaman + pencarian sisi server dengan indeks `pg_trgm` pada `guests.name` |
| Progres checklist | Kolom terhitung di view, bukan di klien |
| Total anggaran | Agregat SQL (`sum`), tidak pernah menjumlahkan di JavaScript |
| Caching | RSC dengan `revalidatePath` setelah mutasi; tidak ada cache lintas pengguna untuk data pernikahan |
| Optimistic UI | `useOptimistic` untuk centang checklist dan ubah RSVP |
| Impor 300 tamu | Satu `insert` batch dalam transaksi, chunk 500 baris |

---

## 9. Integrasi Eksternal

### 9.1 Webhook order

`POST /api/webhooks/order`

- Verifikasi HMAC-SHA256 dari header `X-Signature` memakai `ORDER_WEBHOOK_SECRET`,
  dibandingkan dengan `timingSafeEqual`.
- Simpan payload mentah ke `webhook_events` **sebelum** diproses (untuk replay).
- Proses idempoten dengan kunci `(provider, external_order_id)`.
- Selalu balas `200` setelah payload tersimpan; kegagalan pemrosesan diselesaikan lewat
  antrean retry, bukan dengan membuat marketplace mengirim ulang.
- Adapter per provider di `features/billing/providers/{lynk,mayar}.ts` yang menormalkan
  payload ke bentuk `NormalizedOrder`.

### 9.2 WhatsApp

Tidak ada integrasi API. Deep link dibuat di klien:

```
https://wa.me/{nomor E.164 tanpa +}?text={encodeURIComponent(pesan)}
```

Normalisasi nomor Indonesia: `0812…` / `+62812…` / `62812…` → `62812…`.
Nomor tidak valid → tombol dinonaktifkan dengan penjelasan, bukan error.

### 9.3 Email (Resend)

| Template | Pemicu |
|---|---|
| `AktivasiAkun` | Webhook order sukses |
| `KirimUlangAktivasi` | Permintaan dari halaman publik (rate limit 3/jam/email) |
| `PengingatMingguan` | Cron Senin 08:00 WIB, berisi tugas jatuh tempo minggu ini |
| `RingkasanHariH` | Cron, H-7 |

---

## 10. Keamanan

| Area | Kontrol |
|---|---|
| Isolasi data | RLS `ENABLE` + `FORCE` di seluruh tabel domain; ditolak secara default |
| Rahasia | Hanya di environment variable; `SUPABASE_SERVICE_ROLE_KEY` tidak pernah punya prefiks `NEXT_PUBLIC_` |
| Webhook | Verifikasi HMAC + toleransi timestamp 5 menit untuk mencegah replay |
| Token RSVP | 32 karakter acak, unik, dapat di-rotasi per tamu |
| Rate limit | Login 5/menit/IP, kirim ulang aktivasi 3/jam/email, submit RSVP 10/menit/IP |
| Unggahan | Hanya `image/jpeg|png|webp`, maksimum 5 MB, disimpan di bucket privat, diakses lewat signed URL 60 menit |
| XSS | Tidak ada `dangerouslySetInnerHTML`; ucapan tamu di-render sebagai teks biasa |
| Header | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin` |
| Audit | Tabel `activity_log` untuk aksi destruktif (hapus tamu massal, hapus pernikahan) |
| PII | Nomor HP tamu tidak pernah masuk log, analitik, atau pesan error |

---

## 11. Observabilitas

| Sinyal | Alat | Ambang alarm |
|---|---|---|
| Error aplikasi | Sentry | > 1% request 5 menit |
| Webhook gagal | Sentry + email admin | Satu kali gagal langsung memberi tahu |
| Funnel aktivasi | PostHog | Aktivasi < 70% dalam 24 jam |
| Kinerja | Vercel Analytics | LCP p75 > 2.5 s |
| Kesehatan DB | Supabase metrics | Koneksi > 70% kuota |

Event produk yang wajib dikirim: `order_received`, `activation_email_sent`,
`account_activated`, `onboarding_completed`, `checklist_item_completed`,
`expense_created`, `guest_created`, `guest_bulk_imported`, `whatsapp_invite_opened`,
`rsvp_submitted`, `seserahan_item_completed`, `a2hs_installed`.

---

## 12. Deployment & Lingkungan

| Lingkungan | Branch | Database |
|---|---|---|
| Production | `main` | Proyek Supabase `prod` |
| Preview | setiap PR | Proyek Supabase `staging` (data anonim) |
| Local | — | Supabase CLI (Docker) |

**Pipeline CI (wajib hijau sebelum merge):** typecheck → lint → unit test → tes RLS →
build → E2E Playwright pada preview.

**Migrasi:** hanya maju (forward-only), satu file per perubahan, dinamai
`NNNN_deskripsi.sql`, dijalankan otomatis saat deploy. Perubahan yang merusak dilakukan
dalam dua tahap (tambah kolom baru → backfill → hapus kolom lama pada rilis berikutnya).

**Backup:** point-in-time recovery 7 hari + dump harian ke object storage, retensi 30 hari.
Uji restore dilakukan setiap kuartal.

---

## 13. Jalur Evolusi

| Versi | Penambahan | Dampak arsitektur |
|---|---|---|
| v1.1 | Antrean tulis offline, ekspor PDF, buku ucapan | Service worker + IndexedDB; renderer PDF di route handler |
| v1.2 | Multi-acara adat (siraman, midodareni) | Tabel `events` sudah ada di skema v1 — tanpa migrasi struktural |
| v2 | Direktori vendor + booking | Tabel global `vendors_directory` terpisah dari `vendors` milik pengguna |
| v3 | Mode Wedding Organizer (banyak klien) | `wedding_members` sudah memisahkan user dari wedding — tinggal menambah entitas `organizations` |
