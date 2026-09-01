# plan-wedding

Aplikasi web (PWA) berbahasa Indonesia untuk merapikan persiapan pernikahan kami berdua:
countdown hari-H, checklist persiapan, budget tracker, daftar tamu + RSVP + sebar
undangan lewat WhatsApp, dan checklist seserahan.

Dipakai berdua saja — dua akun, satu data pernikahan, bisa dibuka dari HP kapan saja.
Tidak ada sistem penjualan, langganan, atau panel admin.

> **Status:** kelima modul jalan. Siap dicoba dengan proyek Supabase sungguhan.
> Rincian per kebutuhan: [`docs/06-STATUS.md`](docs/06-STATUS.md).

---

## Dokumen

Baca berurutan:

| # | Dokumen | Isi |
|---|---|---|
| 1 | [`docs/01-PRD.md`](docs/01-PRD.md) | Masalah, ruang lingkup fitur per modul, alur pengguna, rencana kerja, risiko |
| 2 | [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md) | Tumpukan teknologi, struktur direktori, lapisan aplikasi, auth, keamanan, deployment |
| 3 | [`docs/03-DESIGN.md`](docs/03-DESIGN.md) | Token warna & tipografi, tata letak, katalog komponen, format id-ID, aksesibilitas |
| 4 | [`docs/04-RULES.md`](docs/04-RULES.md) | Aturan bisnis (A), rekayasa (B), konten (C), Definition of Done (D) |
| 5 | [`docs/05-SCHEMA.md`](docs/05-SCHEMA.md) | Model data, relasi, view turunan, kebijakan RLS, retensi |
| 6 | [`docs/06-STATUS.md`](docs/06-STATUS.md) | **Status per kebutuhan — apa yang sudah jadi dan apa yang belum** |
| 7 | [`docs/07-RUNBOOK.md`](docs/07-RUNBOOK.md) | Menyiapkan Supabase, deploy, cadangan, dan apa yang dilakukan saat rusak |

Nomor aturan seperti `A5.9` atau `B3.1` dirujuk langsung dari komentar di dalam SQL —
setiap keputusan di skema bisa ditelusuri ke alasannya.

**PRD adalah spesifikasi, bukan laporan.** Untuk tahu apa yang benar-benar sudah jalan,
baca `docs/06-STATUS.md` lebih dulu.

## Menjalankan aplikasi

```bash
npm install
cp .env.example .env.local     # isi URL & anon key proyek Supabase
npm run dev                    # http://localhost:3000
```

Seluruh pemeriksaan sekaligus:

```bash
npm run check                  # typecheck + lint + unit test
npm run test:rls               # asersi isolasi data (butuh Postgres lokal)
```

## Isi repositori

```
src/
  app/                17 rute. (auth) publik, (app) terproteksi, /rsvp/[token] publik
  components/         ui/ primitif, patterns/ BottomNav
  features/           Per domain: queries.ts, actions.ts, schema.ts, lib.ts
  lib/                supabase/, auth/, format/, whatsapp/, csv.ts, constants.ts
  proxy.ts            Penyegaran sesi + guard rute
.github/workflows/    CI: typecheck, lint, unit, RLS, build
db/
  schema.sql          Skema kanonik PostgreSQL: tabel, enum, trigger, view, RLS, RPC
  seeds/              Template checklist (49 item), kategori anggaran, seserahan (32 item)
  migrations/         Migrasi forward-only; schema.sql tetap mencerminkan bentuk akhir
tests/rls/
  isolation.sql       65 asersi: alur fungsional + isolasi data
  run.sh              Membangun ulang database bersih lalu menjalankan asersi
docs/                 Lihat tabel di atas
```

## Menyiapkan database

Langkah lengkap beserta yang harus dikerjakan tangan ada di
[`docs/07-RUNBOOK.md`](docs/07-RUNBOOK.md). Ringkasnya:

### Lokal (untuk menjalankan tes)

Butuh PostgreSQL 15+ — ekstensi `pgcrypto` dan `pg_trgm` ada di instalasi standar.

```bash
export PGHOST=/var/run/postgresql PGUSER=postgres
./tests/rls/run.sh
```

Runner membangun ulang database `plan_wedding_test`, memasang stub minimal yang meniru
objek bawaan Supabase (`auth.users`, `auth.uid()`, peran `anon`/`authenticated`/
`service_role`), memuat skema dan seed, lalu menjalankan seluruh asersi.

### Supabase (untuk dipakai sungguhan)

1. Buat proyek Supabase baru.
2. Jalankan `db/schema.sql` lewat SQL Editor, lalu berkas di `db/seeds/` berurutan.
   Stub tidak diperlukan — objek `auth.*` sudah ada.
3. **Matikan pendaftaran mandiri:** Authentication → Providers → Email → *Disable signup*.
   Tanpa ini, siapa pun yang tahu URL-nya bisa membuat akun. Ini satu-satunya kontrol
   keamanan yang tidak bisa dipaksakan dari kode.
4. Buat dua akun lewat Authentication → Add user.
5. Login dengan akun pertama, isi onboarding.
6. Tautkan akun kedua sebagai `partner` lewat SQL — belum ada UI-nya. Perintahnya ada di
   RUNBOOK §2 langkah 7.

## Kenapa RLS, padahal cuma dipakai berdua

Dua alasan, dan keduanya bukan soal jumlah pengguna:

1. **Anon key Supabase ada di dalam browser.** Ia memang dirancang untuk publik. Yang
   menahan orang mengambil seluruh isi database dengan key itu adalah RLS, bukan kode
   aplikasi.
2. **Kami menyimpan nomor HP ratusan orang lain.** Daftar tamu adalah data pribadi milik
   keluarga dan teman, bukan milik kami.

Karena itu halaman RSVP publik pun tidak menyentuh tabel `guests` sama sekali — ia hanya
memanggil dua fungsi yang mengembalikan kolom terbatas.

### Apa yang dibuktikan tes

- Alur inti: seeding template → tamu → RSVP publik lewat token → statistik dashboard.
- Batasan bisnis ditegakkan database, bukan hanya UI: `paid_amount ≤ amount`,
  `attending_count ≤ headcount`, nominal tidak negatif, satu acara utama per pernikahan,
  batas 2 anggota penulis.
- **Isolasi data:** pengguna pernikahan lain tidak dapat membaca *maupun* menulis ke
  setiap tabel domain — diuji satu per satu untuk SELECT, INSERT, UPDATE, dan DELETE.
- **Halaman RSVP publik** tidak membocorkan nomor HP, id internal, daftar tamu lain,
  maupun data anggaran.

## Keputusan yang sudah dikunci

- **Dipakai berdua, bukan produk.** Akun dibuat manual; tidak ada pendaftaran, harga,
  atau panel admin.
- **PWA, bukan aplikasi native.** "Add to Home Screen" sudah cukup.
- **WhatsApp lewat `wa.me` deep link, bukan WA Business API.** Pesan terkirim dari nomor
  pribadi kami sendiri — sama seperti mengetik manual, hanya tanpa copy-paste.
- **Bukan pembuat undangan digital.** Aplikasi ini *planner*; ia hanya menyimpan URL
  undangan untuk dipakai di pesan WhatsApp.
- **Keamanan di lapisan database (RLS).** Lihat bagian di atas.
- **Tanpa katalog produk terkurasi.** Tautan toko ditempel sendiri per item seserahan.

## Urutan pengerjaan

Dipilih supaya bagian yang paling melelahkan kalau manual selesai lebih dulu.

| Tahap | Isi |
|---|---|
| ~~T0~~ | ~~Fondasi: login, guard sesi, onboarding, seeding~~ — selesai |
| ~~T1~~ | ~~Tamu & undangan: daftar, filter, import, deep link WA, halaman RSVP publik~~ — selesai |
| ~~T2~~ | ~~Checklist & anggaran~~ — selesai |
| ~~T3~~ | ~~Beranda: countdown, tugas bulan ini, ringkasan~~ — selesai |
| ~~T4~~ | ~~Seserahan, profil, PWA/A2HS, ekspor data~~ — selesai |

Yang belum dikerjakan tercatat lengkap di [`docs/06-STATUS.md`](docs/06-STATUS.md).
Yang terbesar: kartu milestone, buku ucapan, catatan vendor, unggah foto nota, ekspor
JSON menyeluruh, dan menambah akun kedua lewat UI (sementara lewat SQL).

Tiap tahap berdiri sendiri dan langsung berguna, jadi berhenti di tahap mana pun tetap
menyisakan sesuatu yang terpakai.
