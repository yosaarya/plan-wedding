# Rules — Aturan Produk, Bisnis & Rekayasa

| Field | Value |
|---|---|
| Versi | 2.0 — pemakaian pribadi |
| Sifat | Normatif. "HARUS" = wajib, "TIDAK BOLEH" = larangan, "SEBAIKNYA" = anjuran kuat. |

Dokumen ini adalah rujukan saat terjadi perdebatan. Jika kode dan dokumen ini berbeda,
salah satunya bug — perbaiki, jangan diamkan.

**Penomoran aturan sengaja tidak diubah** meski isi A1 dirombak, karena nomornya dirujuk
langsung dari komentar di `db/schema.sql` dan `tests/rls/isolation.sql`.

---

## Bagian A — Aturan Bisnis (Business Rules)

### A1. Akses

| # | Aturan |
|---|---|
| A1.1 | Aplikasi dipakai oleh **dua akun**, dibuat sekali lewat dashboard Supabase. Tidak ada halaman pendaftaran mandiri. |
| A1.2 | Pendaftaran mandiri HARUS dimatikan di setelan Supabase Auth. Ini lapisan pertama; RLS adalah lapisan kedua yang tetap menahan meski setelan itu berubah. |
| A1.3 | Satu pernikahan memiliki **maksimum 2 anggota dengan hak tulis** (`owner` + `partner`). Ditegakkan trigger `enforce_member_limit`, bukan hanya UI. |
| A1.4 | Peran `viewer` (baca saja) tersedia di skema tapi tidak dipakai di MVP. Ia tidak dihitung dalam batas A1.3. |
| A1.5 | Reset password memakai magic link bawaan Supabase Auth. |
| A1.6 | Tidak ada peran admin dan tidak ada panel back office. Perawatan data yang jarang dilakukan lewat SQL editor Supabase. |

### A2. Data Pernikahan

| # | Aturan |
|---|---|
| A2.1 | Tanggal akad WAJIB diisi saat onboarding. Tanggal resepsi opsional; jika kosong, dianggap sama dengan akad. |
| A2.2 | Countdown dihitung terhadap **acara utama** (`is_primary = true`), default akad, dalam zona waktu pernikahan (default `Asia/Jakarta`). |
| A2.3 | Countdown dihitung dari **selisih hari kalender**, bukan selisih jam. H-1 tetap "1 hari lagi" pukul berapa pun. |
| A2.4 | Tanggal hari-H boleh berada di masa lalu (pengguna membeli setelah menikah, atau menunda). Sistem TIDAK BOLEH menolaknya; UI beralih ke mode pascaacara. |
| A2.5 | Mengubah tanggal hari-H TIDAK menggeser tenggat item checklist yang sudah ada. Sistem menawarkan "geser semua tenggat?" sebagai pilihan eksplisit. |
| A2.6 | Menghapus pernikahan adalah aksi `owner` saja, butuh mengetik ulang nama pasangan sebagai konfirmasi, dan bersifat soft delete 30 hari. |
| A2.7 | Data WAJIB bisa diekspor kapan saja tanpa bergantung pada layanan mana pun tetap hidup (CSV per tabel, atau JSON utuh). |

### A3. Checklist

| # | Aturan |
|---|---|
| A3.1 | Template checklist di-seed **satu kali** saat onboarding selesai. Perubahan template setelahnya TIDAK menyentuh pernikahan yang sudah ada. |
| A3.2 | Item hasil seed sepenuhnya milik pengguna: boleh diubah dan dihapus. |
| A3.3 | Tenggat item hasil seed dihitung mundur dari tanggal akad (mis. "Pesan katering" = H-120). Bila hasilnya sudah lewat, tenggat diisi `null`, bukan tanggal masa lalu. |
| A3.4 | Item "terlambat" = `due_date < hari ini` DAN `is_done = false`. |
| A3.5 | "Tugas Bulan Ini" = item belum selesai dengan tenggat di dalam bulan berjalan, **ditambah** seluruh item terlambat, diurutkan tenggat menaik, maksimum 5 di beranda. |
| A3.6 | Progres kategori = `item selesai / total item` dalam kategori. Kategori kosong menampilkan 0%, bukan 100%. |
| A3.7 | Menghapus kategori memindahkan itemnya ke kategori "Lain-lain", TIDAK menghapus item. |
| A3.8 | Kategori "Dokumen KUA" TIDAK BOLEH dihapus — statusnya sistem, karena punya konsekuensi administratif. |

### A4. Anggaran

| # | Aturan |
|---|---|
| A4.1 | Semua nominal disimpan sebagai **integer rupiah** (`bigint`). TIDAK BOLEH ada floating point. |
| A4.2 | Nominal TIDAK BOLEH negatif. Koreksi dilakukan dengan mengubah/menghapus pengeluaran, bukan memasukkan angka minus. |
| A4.3 | `total terpakai` = jumlah `amount` seluruh pengeluaran (termasuk yang belum dibayar). `total terbayar` = jumlah `paid_amount`. Keduanya ditampilkan terpisah — ini pembeda utama dari aplikasi catatan biasa. |
| A4.4 | `paid_amount` TIDAK BOLEH melebihi `amount` (dijaga CHECK constraint). |
| A4.5 | Status pembayaran diturunkan, bukan diinput: `paid_amount = 0` → *Belum bayar*; `0 < paid_amount < amount` → *DP*; `paid_amount = amount` → *Lunas*. |
| A4.6 | `sisa budget` = `total_budget − total terpakai`. Boleh negatif, dan saat negatif ditampilkan merah dengan label "Over budget". |
| A4.7 | Sistem memperingatkan, TIDAK memblokir, saat kategori atau total melebihi alokasi. |
| A4.8 | Menghapus kategori anggaran memindahkan pengeluarannya ke kategori "Lain-lain". |
| A4.9 | Total alokasi kategori boleh berbeda dari total budget; selisihnya ditampilkan sebagai "belum dialokasikan". |
| A4.10 | Semua agregasi dihitung di SQL. TIDAK BOLEH menjumlahkan uang di JavaScript setelah paginasi. |

### A5. Tamu, Undangan & RSVP

| # | Aturan |
|---|---|
| A5.1 | Satu baris tamu = satu undangan, dengan `headcount` (pax) ≥ 1. "280 kepala" adalah jumlah `headcount`, "196 undangan" adalah jumlah baris. Kedua angka HARUS dibedakan di UI. |
| A5.2 | Nama tamu wajib. Nomor HP opsional — tamu tanpa nomor tetap boleh dicatat (undangan cetak). |
| A5.3 | Tombol WhatsApp nonaktif bila nomor HP kosong atau tidak valid, disertai penjelasan singkat. |
| A5.4 | Normalisasi nomor Indonesia: hapus spasi/tanda hubung; `0…` → `62…`; `+62…` → `62…`; `8…` → `62 8…`. Panjang valid 10–15 digit. |
| A5.5 | Nomor HP duplikat memicu **peringatan**, bukan penolakan (beberapa tamu berbagi nomor keluarga). |
| A5.6 | `invitation_status`: `not_sent` → `sent`. Ditandai `sent` otomatis saat tombol WhatsApp ditekan, dan BOLEH diubah manual oleh pengguna. |
| A5.7 | `rsvp_status`: `pending` (default), `attending`, `not_attending`, `maybe`. |
| A5.8 | `attending_count` hanya berarti bila `rsvp_status = 'attending'`, dan TIDAK BOLEH melebihi `headcount`. |
| A5.9 | Statistik "hadir" pada dashboard menghitung **jumlah orang** (`sum(attending_count)`), bukan jumlah baris tamu. |
| A5.10 | Token RSVP: 32 karakter acak kriptografis, unik lintas seluruh sistem, dibuat saat tamu dibuat. |
| A5.11 | Halaman RSVP publik hanya mengekspos: nama tamu, nama pengantin, tanggal & lokasi acara, dan status RSVP saat ini. TIDAK BOLEH mengekspos daftar tamu lain, anggaran, atau nomor HP siapa pun. |
| A5.12 | Tamu BOLEH mengubah jawaban RSVP berkali-kali. Setiap jawaban dicatat di `rsvp_responses`; `guests` menyimpan jawaban terakhir. |
| A5.13 | Menghapus tamu bersifat soft delete 30 hari; tokennya langsung tidak berlaku. |
| A5.14 | Import CSV: baris tanpa nama dilewati; hasil import ditampilkan sebagai pratinjau dan HARUS dikonfirmasi sebelum disimpan. |
| A5.15 | Ucapan dari halaman RSVP di-render sebagai **teks biasa**, dibatasi 500 karakter, dan BOLEH disembunyikan oleh pemilik pernikahan. |

### A6. Seserahan

| # | Aturan |
|---|---|
| A6.1 | Daftar seserahan di-seed dari template saat onboarding, sama seperti checklist. |
| A6.2 | Tabel `template_*` bersifat read-only bagi aplikasi: ia bahan untuk seeding, bukan data harian. Mengubahnya dilakukan lewat migrasi, bukan lewat UI. |
| A6.3 | Tautan toko per item ditempel sendiri (`seserahan_items.product_url`). Tidak ada katalog terkurasi yang harus dirawat. |
| A6.4 | Menandai item seserahan "sudah dibeli" dengan harga aktual SEBAIKNYA menawarkan pencatatan otomatis ke kategori anggaran "Mahar & Seserahan" — sebagai tawaran, bukan otomatis diam-diam. |
| A6.5 | Harga hasil seed adalah **estimasi kasar**, WAJIB berlabel "estimasi" di UI supaya tidak dikira harga sebenarnya. |

### A7. Notifikasi

| # | Aturan |
|---|---|
| A7.1 | MVP tidak mengirim email apa pun selain reset password. |
| A7.2 | Bila pengingat mingguan jadi dibuat: maksimum **1 email per minggu**, dan TIDAK dikirim bila tidak ada tugas jatuh tempo. Email kosong lebih merugikan daripada tidak ada email. |
| A7.3 | Push notification TIDAK ada. |

## Bagian B — Aturan Rekayasa (Engineering Rules)

### B1. Umum

| # | Aturan |
|---|---|
| B1.1 | TypeScript `strict: true`. `any` dilarang; gunakan `unknown` + penyempitan tipe. |
| B1.2 | Setiap input eksternal (form, query param, baris CSV import, jawaban RSVP dari tamu) HARUS divalidasi di batas sistem — Zod untuk form dan payload, penjaga bertipe untuk query param. |
| B1.7 | Filter yang datang dari query string HARUS divalidasi **di lapisan kueri**, bukan hanya di halaman, supaya tidak ada pemanggil yang bisa melewatinya. Nilai yang tidak dikenali diabaikan, tidak diteruskan ke database: nilai enum atau UUID yang ngawur membuat Postgres menolak dan seluruh halaman gagal dimuat. |
| B1.3 | Tipe database dihasilkan otomatis dari skema (`types/database.ts`) dan TIDAK BOLEH diedit manual. |
| B1.4 | Tidak ada nilai ajaib. Konstanta domain (batas anggota, panjang token, ambang peringatan) hidup di `lib/constants.ts`. |
| B1.5 | Komentar menjelaskan **kenapa**, bukan **apa**. Kode yang butuh komentar "apa" biasanya perlu diberi nama lebih baik. |
| B1.6 | Nama variabel & fungsi dalam bahasa Inggris; teks yang dilihat pengguna dalam bahasa Indonesia dan hidup di `lib/strings/` atau langsung di komponen — TIDAK BOLEH dicampur ke dalam nama identifier. |

### B2. Batasan Arsitektur

| # | Aturan |
|---|---|
| B2.1 | Komponen klien TIDAK BOLEH mengambil data domain langsung dari Supabase. Baca lewat Server Component, tulis lewat Server Action. |
| B2.2 | Service role TIDAK dipakai di MVP — seluruh akses lewat JWT pengguna sehingga RLS selalu aktif. Bila nanti dibutuhkan, impornya dibatasi ke berkas itu saja lewat ESLint `no-restricted-imports`. |
| B2.3 | Setiap Server Action HARUS diawali `requireWedding()` (atau `requireSession()` untuk aksi tingkat akun) sebelum menyentuh data. |
| B2.4 | Setiap kueri terhadap tabel domain HARUS menyertakan `.eq('wedding_id', weddingId)` secara eksplisit, meskipun RLS sudah aktif. Pertahanan berlapis. |
| B2.5 | Logika bisnis murni tinggal di `features/*/lib.ts` tanpa impor React atau Supabase, agar dapat diuji tanpa mock. |
| B2.6 | Mutasi HARUS memanggil `revalidatePath` untuk setiap rute yang menampilkan data tersebut. |
| B2.7 | TIDAK BOLEH ada `useEffect` untuk mengambil data awal. |

### B3. Database

| # | Aturan |
|---|---|
| B3.1 | Setiap tabel domain WAJIB punya kolom `wedding_id` dan RLS `ENABLE` + `FORCE`. |
| B3.2 | Kebijakan RLS ditolak secara default; akses diberikan hanya lewat keanggotaan di `wedding_members`. |
| B3.3 | Setiap tabel WAJIB punya `id uuid default gen_random_uuid()`, `created_at`, `updated_at` (dijaga trigger). |
| B3.4 | Foreign key ke `weddings` memakai `ON DELETE CASCADE`; ke tabel referensi memakai `ON DELETE SET NULL`. |
| B3.5 | Uang: `bigint` (rupiah utuh). Waktu: `timestamptz`. Tanggal kalender tanpa jam: `date`. Enum: tipe Postgres `enum`, bukan `text` bebas. |
| B3.6 | Migrasi bersifat maju saja, satu perubahan per file, dinamai `NNNN_deskripsi.sql`, dan TIDAK BOLEH diedit setelah masuk `main`. |
| B3.7 | Perubahan yang merusak dilakukan tiga tahap: tambah → backfill → hapus di rilis berikutnya. |
| B3.8 | Setiap kolom yang dipakai untuk filter atau join WAJIB punya indeks. Setiap indeks baru WAJIB punya alasan di komentar migrasi. |
| B3.9 | Fungsi `SECURITY DEFINER` HARUS menetapkan `search_path = public, pg_temp` dan menerima parameter tereksplisit. |

### B4. Keamanan

| # | Aturan |
|---|---|
| B4.1 | Rahasia tidak pernah masuk repositori. `SUPABASE_SERVICE_ROLE_KEY` TIDAK BOLEH punya prefiks `NEXT_PUBLIC_` — dan MVP ini tidak membutuhkannya sama sekali. |
| B4.2 | Pendaftaran mandiri HARUS dimatikan di Supabase Auth (aturan A1.2). |
| B4.3 | Halaman RSVP publik HANYA boleh mengakses data lewat `get_rsvp_context` / `submit_rsvp`. Menambah kolom ke kedua RPC itu WAJIB disertai asersi kebocoran di `tests/rls/isolation.sql`. |
| B4.4 | Nomor HP, email, dan nama tamu TIDAK BOLEH muncul di log runtime, pesan error, maupun URL. |
| B4.5 | `dangerouslySetInnerHTML` dilarang di seluruh basis kode. |
| B4.6 | Unggahan dibatasi tipe MIME dan ukuran, disimpan di bucket privat, diakses lewat signed URL berumur ≤ 60 menit. |
| B4.7 | Rate limit wajib pada submit RSVP: 10 per menit per tamu, ditegakkan **di dalam fungsi database** `submit_rsvp`. Bukan di edge middleware — middleware serverless berjalan per-instance dan kehilangan hitungannya, sehingga batas di sana mudah dilewati. |
| B4.8 | Setiap PR yang menyentuh RLS atau autentikasi WAJIB menyertakan tes isolasi data. |

### B5. Pengujian

| # | Aturan |
|---|---|
| B5.1 | Logika murni (perhitungan countdown, agregasi anggaran, normalisasi nomor, render template WA) WAJIB punya unit test. |
| B5.2 | Tes RLS WAJIB membuktikan: pengguna A tidak dapat membaca **maupun menulis** baris milik pernikahan B, untuk setiap tabel domain. |
| B5.3 | **Belum ditegakkan.** Belum ada tes E2E di proyek ini. Alur login → onboarding → tambah tamu → kirim WA → submit RSVP → statistik beranda berubah harus diperiksa **manual** setelah setiap perubahan yang menyentuh alur itu. Kalau Playwright nanti ditambahkan, alur inilah yang pertama ditulis. |
| B5.4 | Perbaikan bug WAJIB disertai tes yang gagal sebelum perbaikan. |
| B5.5 | Tidak ada patokan cakupan tes berupa angka; yang diwajibkan adalah B5.1, B5.2, dan B5.4. |
| B5.6 | Komponen React tidak wajib punya unit test. Logika yang layak diuji dipindahkan ke `features/*/lib.ts` supaya bisa diuji tanpa merender apa pun. |

### B6. Kinerja

| # | Aturan |
|---|---|
| B6.1 | Daftar berpotensi panjang (tamu, pengeluaran) WAJIB dipaginasi di server, 50 baris per halaman. |
| B6.2 | Agregat dihitung di database. |
| B6.3 | Dilarang membuat pola N+1 di Server Component. Gunakan join atau satu kueri view. |
| B6.4 | Gambar melalui `next/image`; foto sampul dipangkas maksimum 1600 px sisi terpanjang. |
| B6.5 | Bundle JavaScript rute `(app)` sebaiknya di bawah 200 KB gzip. **Belum pernah diukur** — jangan mengutip aturan ini seolah sudah dipenuhi. |
| B6.6 | Aksi mikro (centang, ubah RSVP) memakai `useOptimistic`. |

### B7. Alur Kerja Git

| # | Aturan |
|---|---|
| B7.1 | Branch: `feat/…`, `fix/…`, `chore/…`, `docs/…`. |
| B7.2 | Pesan commit memakai Conventional Commits berbahasa Inggris (`feat(guests): add csv import`). |
| B7.3 | Commit menjelaskan apa yang berubah dan kenapa. Untuk perubahan UI, sertakan tangkapan layar di PR bila memakai PR. |
| B7.4 | Merge ke `main` hanya bila CI hijau: typecheck, lint, unit test, `./tests/rls/run.sh`, dan build. Dijalankan `.github/workflows/ci.yml` pada setiap PR. |
| B7.5 | Migrasi database dan kode yang membutuhkannya HARUS berada dalam PR yang sama. |
| B7.6 | Dokumen di `docs/` HARUS ikut diperbarui dalam PR yang mengubah perilaku yang didokumentasikan. |

---

## Bagian C — Aturan Konten & Bahasa

| # | Aturan |
|---|---|
| C1 | Seluruh teks antarmuka berbahasa Indonesia, sapaan "kamu"/"kalian". |
| C2 | Tanggal ditulis lengkap berbahasa Indonesia ("Minggu, 22 November 2026"), tidak pernah `2026-11-22` di antarmuka pengguna. |
| C3 | Mata uang selalu berformat `Rp 49.700.000` (tanpa desimal, pemisah titik). Format ringkas `Rp 49,7 jt` hanya di kartu ringkasan. |
| C4 | Pesan error menyebutkan langkah berikutnya, bukan kode teknis. Kode error hanya untuk log. |
| C5 | Tidak ada istilah teknis di antarmuka: "Simpan" bukan "Submit", "Daftar tamu" bukan "Guest list", "Sudah kirim" bukan "Sent". |
| C6 | Aksi merusak diberi label eksplisit ("Hapus 12 tamu") dan butuh konfirmasi. |
| C7 | Emoji hanya di judul kategori seserahan dan email. |

---

## Bagian D — Definition of Done

Sebuah fitur dianggap selesai bila **seluruh** poin terpenuhi:

1. Berfungsi di layar 360 px dan 430 px.
2. Punya keadaan kosong, keadaan memuat, dan keadaan error.
3. Aksi merusak punya konfirmasi; aksi cepat punya "Urungkan".
4. Kebijakan RLS ada dan diuji untuk tabel baru mana pun.
5. Angka uang memakai integer dan diformat lewat `lib/format`.
6. Teks berbahasa Indonesia dan sesuai Bagian C.
7. Unit test untuk logika murni sudah ada.
8. `docs/` diperbarui bila perilaku yang didokumentasikan berubah, termasuk baris
   terkait di `docs/06-STATUS.md`.
9. Tidak ada PII (nomor HP, nama tamu) di log.
10. Bisa dipakai dengan satu tangan di HP — aksi utama berada dalam jangkauan jempol.

Butir 4 dan 8 yang paling sering terlewat. Butir 8 adalah alasan `docs/06-STATUS.md`
ada: tanpanya, dokumen perlahan berubah menjadi daftar keinginan yang dikira kenyataan.
