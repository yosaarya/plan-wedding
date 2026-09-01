# plan-wedding

Aplikasi web (PWA) berbahasa Indonesia untuk merapikan persiapan pernikahan:
countdown hari-H, checklist persiapan, budget tracker, daftar tamu + RSVP +
penyebaran undangan lewat WhatsApp, dan checklist seserahan.

Dijual sebagai produk digital sekali bayar. Setelah pembayaran, akun dibuat otomatis,
link aktivasi dikirim ke email, pembeli membuat password, lalu langsung memakai aplikasi.
Tanpa pendaftaran manual.

> **Status:** tahap perancangan. Repositori ini saat ini berisi dokumen perancangan,
> skema database yang sudah diuji, dan data seed. Kode aplikasi belum ada.

---

## Dokumen

Baca berurutan:

| # | Dokumen | Isi |
|---|---|---|
| 1 | [`docs/01-PRD.md`](docs/01-PRD.md) | Masalah, persona, ruang lingkup fitur (MoSCoW), metrik, alur pengguna, risiko, rencana rilis |
| 2 | [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md) | Tumpukan teknologi, struktur direktori, lapisan aplikasi, auth, integrasi, keamanan, deployment |
| 3 | [`docs/03-DESIGN.md`](docs/03-DESIGN.md) | Token warna & tipografi, tata letak, katalog komponen, format id-ID, aksesibilitas, nada bahasa |
| 4 | [`docs/04-RULES.md`](docs/04-RULES.md) | Aturan bisnis (A), aturan rekayasa (B), aturan konten (C), Definition of Done (D) |
| 5 | [`docs/05-SCHEMA.md`](docs/05-SCHEMA.md) | Penjelasan model data, relasi, view turunan, kebijakan RLS, retensi |

Nomor aturan seperti `A5.9` atau `B3.1` dirujuk langsung dari komentar di dalam SQL —
jadi setiap keputusan di skema bisa ditelusuri ke alasannya.

## Isi repositori

```
db/
  schema.sql          Skema kanonik PostgreSQL: tabel, enum, trigger, view, RLS, RPC
  seeds/              Template checklist (49 item), kategori anggaran, seserahan (32 item)
  migrations/         Migrasi forward-only (belum ada; schema.sql adalah baseline)
tests/rls/
  isolation.sql       66 asersi: alur fungsional + isolasi data antar pernikahan
  run.sh              Membangun ulang database bersih lalu menjalankan asersi
docs/                 Lihat tabel di atas
```

## Menjalankan skema secara lokal

Butuh PostgreSQL 15+ (`pgcrypto` dan `pg_trgm` tersedia di instalasi standar).

```bash
# Terhadap Postgres lokal
export PGHOST=/var/run/postgresql PGUSER=postgres
./tests/rls/run.sh
```

Runner akan membangun ulang database `plan_wedding_test`, memasang stub minimal yang
meniru objek bawaan Supabase (`auth.users`, `auth.uid()`, peran `anon`/`authenticated`/
`service_role`), memuat skema dan seed, lalu menjalankan seluruh asersi.

Terhadap proyek Supabase sungguhan, stub tidak diperlukan — jalankan `db/schema.sql`
lalu berkas di `db/seeds/` lewat SQL Editor atau Supabase CLI.

### Apa yang dibuktikan tes

- Alur inti: seeding template → tamu → RSVP publik lewat token → statistik dashboard.
- Batasan bisnis ditegakkan database, bukan hanya UI: `paid_amount ≤ amount`,
  `attending_count ≤ headcount`, nominal tidak negatif, satu acara utama per pernikahan,
  batas 2 anggota penulis, idempotensi webhook.
- **Isolasi data:** pengguna pernikahan lain tidak dapat membaca *maupun* menulis
  ke setiap tabel domain — diuji satu per satu, untuk SELECT, INSERT, UPDATE, dan DELETE.
- **Halaman RSVP publik** hanya mengembalikan kolom yang aman: tidak membocorkan nomor
  HP, id internal, daftar tamu lain, atau data anggaran.

## Keputusan yang sudah dikunci

- **Sekali bayar, bukan langganan.** Pernikahan terjadi sekali; churn setelah hari-H
  100%, sehingga langganan tidak masuk akal untuk pasar ini.
- **PWA, bukan aplikasi native.** Memangkas 4+ minggu dan proses review store, sementara
  "Add to Home Screen" sudah memenuhi janji di halaman jualan.
- **WhatsApp lewat `wa.me` deep link, bukan WA Business API.** Menghindari risiko nomor
  terblokir dan biaya per pesan; pengguna tetap mengirim dari nomornya sendiri.
- **Keamanan di lapisan database (RLS), bukan di lapisan aplikasi.** Bug di kode
  aplikasi tidak boleh bisa membocorkan data pernikahan orang lain.
- **Bukan pembuat undangan digital.** Produk ini *planner*; pasar e-invitation sudah
  jenuh. Kita hanya menyimpan URL undangan milik pengguna.

## Langkah berikutnya

1. Putuskan marketplace utama (Lynk.id vs Mayar) — menentukan format webhook order.
2. Scaffold Next.js sesuai struktur direktori di `docs/02-ARCHITECTURE.md` §4.
3. Kerjakan M0 (fondasi): auth, webhook order, email aktivasi, onboarding, seeding.

Pertanyaan terbuka lain ada di `docs/01-PRD.md` §11.
