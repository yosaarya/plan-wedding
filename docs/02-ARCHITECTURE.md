# Arsitektur Sistem — `plan-wedding`

| Field | Value |
|---|---|
| Versi | 2.0 — pemakaian pribadi |
| Status | Disetujui |
| Prinsip | Mobile-first, serverless, muat di paket gratis, satu bahasa (TypeScript), keamanan di lapisan data |

> Aplikasi dipakai berdua saja. Tidak ada lapisan penjualan: tanpa entitlement, tanpa
> webhook order, tanpa panel admin. Akun dibuat sekali lewat dashboard Supabase.

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
6. **Data harus bisa keluar kapan saja.** Ekspor CSV/JSON mandiri, karena kehilangan
   daftar tamu berarti mengulang kerja berjam-jam.

---

## 2. Tumpukan Teknologi

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, TypeScript strict) | RSC + Server Actions memangkas kebutuhan menulis API layer; hosting mudah |
| Bahasa | TypeScript 5.x, `strict: true` | Satu bahasa dari DB ke UI lewat tipe hasil-generate |
| Styling | **Tailwind CSS v4**, token desain sebagai `@theme` | Token di `globals.css` adalah satu-satunya sumber warna & ukuran; komponen tidak pernah menulis nilai mentah |
| Database | **PostgreSQL** via **Supabase** | RLS bawaan, auth terintegrasi, storage, biaya awal nol |
| Auth | **Supabase Auth** (email+password, magic link) | Cocok persis dengan alur "akun dibuat otomatis, aktivasi lewat email" |
| Storage | Supabase Storage (bucket privat) | Foto sampul, bukti nota |
| Hosting | **Vercel** (region `sin1` Singapura) | Latensi terendah dari Indonesia; paket hobby cukup |
| Email | Supabase Auth bawaan | Hanya untuk reset password. Tidak ada email transaksional lain di MVP |
| Validasi | **Zod** | Satu skema dipakai bersama oleh form di klien dan Server Action di server |
| Form | Server Action + `FormData`, divalidasi Zod | Tanpa pustaka form tambahan; form di aplikasi ini sederhana |
| Tes | Vitest (unit), psql (isolasi RLS) | Tes RLS ditulis sebagai SQL biasa dan dijalankan `./tests/rls/run.sh` |

### Alternatif yang dipertimbangkan dan ditolak

| Alternatif | Alasan ditolak |
|---|---|
| React Native / Flutter | Menambah 4+ minggu dan proses review store, sementara PWA memenuhi kebutuhan (A2HS sudah dijanjikan di halaman jualan) |
| Firebase / Firestore | Kueri agregat (total budget, statistik tamu) canggung tanpa SQL; aturan keamanan lebih sulit diuji daripada RLS |
| Backend terpisah (NestJS) | Overhead operasional tanpa manfaat pada skala ini |
| Analitik & error tracking (PostHog/Sentry) | Tidak ada pengguna untuk dianalisis. Bug dilaporkan langsung oleh kami berdua |
| Prisma sebagai satu-satunya akses data | Prisma memutus RLS jika memakai koneksi service role; kita memakai klien Supabase yang membawa JWT pengguna |

---

## 3. Diagram Konteks

```
┌──────────────┐   HTTPS   ┌──────────────────────────────────────┐
│ Browser kami │◄─────────►│      Next.js @ Vercel (sin1)         │
│ (PWA di HP)  │           │  ┌────────────────┬─────────────────┐│
└──────┬───────┘           │  │ RSC / Halaman  │ Server Actions  ││
       │                   │  ├────────────────┴─────────────────┤│
       │ wa.me deep link   │  │ Route Handlers: /api/export/*    ││
       ▼                   │  └──────────────────────────────────┘│
┌──────────────┐           └──────────────┬───────────────────────┘
│  WhatsApp    │                          │ JWT pengguna (RLS aktif)
│ (di HP kami) │                          ▼
└──────────────┘           ┌──────────────────────────────────┐
                           │  Supabase                        │
┌──────────────┐  RPC via  │  ├─ PostgreSQL (RLS)             │
│ Browser tamu │──anon────►│  ├─ Auth (2 akun, dibuat manual) │
│ /rsvp/{token}│           │  └─ Storage (foto sampul, nota)  │
└──────────────┘           └──────────────────────────────────┘
```

Tidak ada layanan pihak ketiga lain. Tamu tidak pernah menyentuh database secara
langsung — hanya lewat dua fungsi RPC yang mengembalikan kolom terbatas (§6.4).

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
│   │   │   └── lupa-password/
│   │   ├── (app)/                 # area terproteksi, memakai bottom nav
│   │   │   ├── layout.tsx         # guard sesi + guard pernikahan
│   │   │   ├── beranda/
│   │   │   ├── checklist/
│   │   │   ├── anggaran/
│   │   │   ├── tamu/
│   │   │   ├── seserahan/
│   │   │   └── profil/
│   │   ├── onboarding/
│   │   ├── rsvp/[token]/          # PUBLIK, tanpa login
│   │   └── api/
│   │       └── export/[resource]/ # unduh CSV/JSON untuk cadangan
│   ├── components/
│   │   ├── ui/                    # primitif: Button, Card, Sheet, Input, ...
│   │   ├── patterns/              # StatTile, ProgressBar, EmptyState, ...
│   │   └── features/              # komponen per modul
│   ├── features/                  # logika per domain (lihat §5)
│   │   ├── wedding/
│   │   ├── checklist/
│   │   ├── budget/
│   │   ├── guests/
│   │   └── seserahan/
│   ├── proxy.ts                   # penyegaran sesi + guard rute (dulu middleware.ts)
│   ├── lib/
│   │   ├── supabase/              # klien server, klien browser, penyegar sesi
│   │   ├── auth/                  # requireSession, requireWedding
│   │   ├── format/                # tanggal & mata uang id-ID
│   │   ├── whatsapp/              # normalisasi nomor, render template, deep link
│   │   └── validation/            # skema Zod bersama
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
3. Klien service-role (`supabaseAdmin`) **tidak dipakai sama sekali** di MVP ini — seluruh
   akses lewat JWT pengguna sehingga RLS selalu aktif. Bila suatu saat dibutuhkan (mis.
   cron pengingat), impornya dibatasi ke berkas itu saja lewat ESLint `no-restricted-imports`.
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
| `anon` | Satu baris tamu | Halaman RSVP publik lewat token |

### 6.2 Penyiapan akun (sekali saja)

Tidak ada halaman pendaftaran. Dua akun dibuat sekali lewat dashboard Supabase
(Authentication → Add user), lalu:

1. Akun pertama login → belum punya pernikahan → diarahkan ke `/onboarding`.
2. Onboarding membuat baris `weddings`, baris `wedding_members` dengan peran `owner`,
   baris `events` untuk akad, lalu memanggil `seed_wedding_defaults()`.
3. Akun kedua ditambahkan ke `wedding_members` sebagai `partner` — lewat halaman Profil
   oleh `owner`, atau sekali lewat SQL editor Supabase.
4. Setelahnya keduanya login biasa dengan email + password.

Reset password memakai magic link bawaan Supabase Auth (`resetPasswordForEmail`).

**Pendaftaran mandiri harus dimatikan** di Supabase (Authentication → Providers →
Email → *Disable signup*), supaya tidak ada orang lain yang bisa membuat akun. Ini
lapisan pertama; RLS tetap menjadi lapisan kedua kalau setelan itu berubah.

### 6.3 Guard

- `src/proxy.ts` — menyegarkan sesi, memblokir rute non-publik tanpa sesi. (Next 16 mengganti nama konvensi `middleware` menjadi `proxy`.)
- `requireSession()` — melempar `UnauthorizedError` bila tidak ada sesi.
- `requireWedding()` — mengambil `wedding_id` aktif dari keanggotaan; melempar bila tidak ada.
- Tidak ada guard entitlement atau admin — keduanya tidak ada di aplikasi ini.

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
                                       ├─ budget_categories ──── expenses ─ vendors
                                       ├─ guest_groups ───────── guests ─┬─ rsvp_responses
                                       │                                 └─ wishes
                                       ├─ seserahan_items
                                       ├─ milestones
                                       └─ wedding_settings (template WA, URL undangan)

Global (tanpa wedding_id, read-only bagi pengguna):
   template_checklist_categories / template_checklist_items
   template_budget_categories
   template_seserahan_items
```

**Kunci desain:** setiap tabel domain membawa `wedding_id` secara langsung (denormalisasi
sengaja) agar kebijakan RLS berupa satu predikat sederhana dan indeks tetap efisien.

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

Hanya satu, dan tanpa API.

### 9.1 WhatsApp

Deep link dibuat di klien, dibuka di tab baru, lalu pesan dikirim sendiri dari WhatsApp
milik kami:

```
https://wa.me/{nomor E.164 tanpa +}?text={encodeURIComponent(pesan)}
```

Normalisasi nomor Indonesia sebelum dipakai: `0812…` / `+62812…` / `62812…` → `62812…`.
Nomor tidak valid membuat tombol nonaktif dengan penjelasan, bukan error.

Template pesan disimpan di `wedding_settings.whatsapp_template` dan dapat diedit dari
halaman Profil. Placeholder yang didukung: `{nama}`, `{pria}`, `{wanita}`, `{tanggal}`,
`{link}`.

Alasan tidak memakai WhatsApp Business API: berbiaya, butuh verifikasi bisnis, dan
mengirim ratusan pesan dari nomor baru berisiko diblokir. Deep link membuat pesan
terkirim dari nomor pribadi kami sendiri, persis seperti mengetik manual — hanya tanpa
copy-paste.

### 9.2 Email

Hanya reset password, memakai layanan bawaan Supabase Auth. Tidak ada email
transaksional lain di MVP. Bila pengingat mingguan (F6.6) jadi dikerjakan, ia memakai
Vercel Cron + satu penyedia email, dan itu satu-satunya penambahan.

## 10. Keamanan

Meski hanya dipakai berdua, dua hal membuat keamanan tetap serius: **anon key Supabase
ada di dalam browser**, dan **kami menyimpan nomor HP ratusan orang lain**.

| Area | Kontrol |
|---|---|
| Isolasi data | RLS `ENABLE` + `FORCE` di seluruh tabel domain; ditolak secara default. Ini yang menahan anon key publik, bukan kode aplikasi |
| Pendaftaran | Signup mandiri dimatikan di Supabase; akun dibuat manual |
| Rahasia | Hanya di environment variable; `SUPABASE_SERVICE_ROLE_KEY` tidak pernah berprefiks `NEXT_PUBLIC_` (dan MVP ini tidak membutuhkannya sama sekali) |
| Token RSVP | 32 karakter acak kriptografis, unik, bukan turunan dari `id` tamu |
| Halaman RSVP publik | Hanya lewat dua RPC `SECURITY DEFINER` yang mengembalikan kolom terbatas — tidak pernah menyentuh tabel `guests` langsung |
| Rate limit | Submit RSVP 10/menit per tamu, ditegakkan di dalam fungsi `submit_rsvp` sehingga tidak bergantung pada instance edge; login memakai batas bawaan Supabase |
| Unggahan | Hanya `image/jpeg|png|webp`, maksimum 5 MB, bucket privat, diakses lewat signed URL ≤ 60 menit |
| XSS | Tidak ada `dangerouslySetInnerHTML`; ucapan tamu di-render sebagai teks biasa |
| Header | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin` |
| PII | Nomor HP dan nama tamu tidak pernah masuk log atau pesan error |

## 11. Pemantauan

Seperlunya saja — tidak ada pengguna lain yang perlu dijaga pengalamannya.

- Log runtime Vercel untuk menelusuri error saat ada yang aneh.
- Supabase dashboard untuk kesehatan database dan pemakaian kuota.
- Backup: point-in-time recovery bawaan Supabase, ditambah ekspor CSV/JSON manual
  sebelum tiap perubahan besar. Ekspor mandiri ini yang paling penting — ia tidak
  bergantung pada layanan mana pun tetap hidup.

## 12. Deployment & Lingkungan

| Lingkungan | Branch | Database |
|---|---|---|
| Production | `main` | Proyek Supabase `prod` |
| Local | — | Supabase CLI (Docker), atau Postgres lokal + stub di `tests/rls/run.sh` |

Tidak ada lingkungan staging terpisah: perubahan diuji lokal, dan tes isolasi
(`./tests/rls/run.sh`) harus lulus sebelum skema diterapkan ke produksi.

**Migrasi:** hanya maju (forward-only), satu file per perubahan, dinamai
`NNNN_deskripsi.sql`. Perubahan yang merusak dilakukan dalam dua tahap (tambah kolom
baru → backfill → hapus kolom lama pada rilis berikutnya).

**Backup:** point-in-time recovery bawaan Supabase, ditambah ekspor manual sebelum
perubahan besar.

## 13. Jalur Evolusi

| Kemungkinan | Penambahan | Dampak arsitektur |
|---|---|---|
| Acara adat berbilang | Menampilkan siraman, midodareni, ngunduh mantu | Tabel `events` sudah menampungnya — hanya pekerjaan UI |
| Pengingat mingguan | Email tugas jatuh tempo | Vercel Cron + satu penyedia email |
| Antrean tulis offline | Mencatat saat sinyal hilang | Service worker + IndexedDB |
| Ekspor PDF rundown | Untuk dibagikan ke keluarga & vendor | Renderer PDF di route handler |
| Akses lihat-saja untuk keluarga | Peran `viewer` | Enum `member_role` sudah punya `viewer`; batas 2 anggota hanya berlaku untuk peran penulis |


| Versi | Penambahan | Dampak arsitektur |
|---|---|---|
| v1.1 | Antrean tulis offline, ekspor PDF, buku ucapan | Service worker + IndexedDB; renderer PDF di route handler |
| v1.2 | Multi-acara adat (siraman, midodareni) | Tabel `events` sudah ada di skema v1 — tanpa migrasi struktural |
| v2 | Direktori vendor + booking | Tabel global `vendors_directory` terpisah dari `vendors` milik pengguna |
| v3 | Mode Wedding Organizer (banyak klien) | `wedding_members` sudah memisahkan user dari wedding — tinggal menambah entitas `organizations` |
