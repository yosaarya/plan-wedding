# PRD — Aplikasi Wedding Planner (Kode: `plan-wedding`)

| Field | Value |
|---|---|
| Versi dokumen | 1.0 |
| Tanggal | 2026-09-01 |
| Status | Draft untuk approval |
| Owner produk | — |
| Target rilis MVP | 8 minggu sejak kick-off |

---

## 1. Ringkasan Produk

Aplikasi web (PWA) berbahasa Indonesia untuk membantu calon pengantin merapikan seluruh
persiapan pernikahan dalam satu tempat: countdown hari-H, checklist persiapan, budget
tracker, daftar tamu + RSVP + penyebaran undangan lewat WhatsApp, dan checklist seserahan.

Produk dijual sebagai **produk digital sekali bayar** (one-time purchase) lewat marketplace
produk digital (Lynk.id / Mayar / Karyakarsa / Tokopedia). Setelah pembayaran, akun dibuat
otomatis, link aktivasi dikirim ke email pembeli, pembeli membuat password, lalu langsung
memakai aplikasi. **Tidak ada pendaftaran manual.**

### 1.1 Problem Statement

Calon pengantin di Indonesia mengelola persiapan nikah dengan alat yang terpencar:
- Daftar tamu di Excel/Google Sheets, sulit dibuka dari HP dan sulit dibagi ke pasangan.
- Budget di catatan HP, tidak pernah ter-update sehingga sering over budget.
- Checklist persiapan di note/kertas, tidak ada pengingat, sering ada yang terlewat
  (terutama dokumen KUA yang punya tenggat administratif).
- Penyebaran undangan manual: copy-paste pesan WhatsApp satu per satu ke ratusan kontak,
  tanpa catatan siapa yang sudah dikirim dan siapa yang sudah konfirmasi.
- Seserahan: tidak tahu standar isinya apa saja, belanja jadi mendadak dan mahal.

### 1.2 Solusi

Satu aplikasi mobile-first yang:
1. Menyatukan lima modul inti dalam satu data pernikahan yang bisa diakses berdua
   (calon pengantin pria & wanita) secara real-time.
2. Sudah berisi **template siap pakai** (checklist persiapan, kategori budget, daftar
   seserahan) sesuai konteks pernikahan Indonesia, sehingga pengguna tidak mulai dari nol.
3. Menghilangkan pekerjaan manual paling melelahkan: generate + kirim pesan undangan
   WhatsApp per tamu dengan nama yang dipersonalisasi dan link RSVP unik.

### 1.3 Non-Goals (eksplisit TIDAK dikerjakan)

| Non-goal | Alasan |
|---|---|
| Membuat website undangan digital / e-invitation berdesain | Pasar sudah sangat ramai & margin tipis; produk ini adalah *planner*, bukan *invitation builder*. Kita hanya menyimpan URL undangan milik pengguna. |
| Blasting WhatsApp otomatis (WA Business API / bot) | Risiko banned nomor, biaya per pesan, dan kompleksitas verifikasi. v1 memakai `wa.me` deep link (dibuka user, dikirim manual per tamu). |
| Marketplace vendor / booking vendor | Butuh supply-side ops. Ditunda ke v2. |
| Aplikasi native iOS/Android di store | PWA + "Add to Home Screen" cukup untuk value proposition dan mempercepat rilis. |
| Multi-bahasa | Target awal 100% pasar Indonesia. Struktur i18n disiapkan, konten hanya `id-ID`. |
| Pembayaran in-app | Transaksi terjadi di marketplace eksternal; aplikasi hanya menerima webhook/CSV. |

---

## 2. Target Pengguna

### 2.1 Persona Utama — "Siti", calon pengantin wanita, 26 th

- Bekerja kantoran, menikah 6–10 bulan lagi, budget Rp 80–250 juta.
- Pemegang kendali utama persiapan; suka hal rapi, aktif di Instagram & Pinterest.
- Selalu pegang HP; jarang buka laptop di luar jam kerja.
- **Job to be done:** "Aku mau tahu, kapan pun aku buka HP, apa yang harus aku kerjakan
  bulan ini, sisa uangku berapa, dan siapa saja yang belum konfirmasi datang."

### 2.2 Persona Pendamping — "Agus", calon pengantin pria, 28 th

- Terlibat sebagian: urusan mahar, dokumen KUA, dan daftar tamu dari pihaknya.
- Jarang membuka aplikasi (1–2x/minggu), butuh tampilan yang langsung to the point.
- **JTBD:** "Kasih tahu bagianku apa, jangan suruh aku baca semuanya."

### 2.3 Persona Sekunder — "Bu Tuti", ibu/keluarga (v2)

- Menyumbang daftar tamu (undangan keluarga besar), tidak paham aplikasi.
- Ditangani lewat fitur *import* dan *share read-only link*, bukan akun penuh.

### 2.4 Segmen yang TIDAK dilayani

Wedding organizer profesional yang menangani banyak klien sekaligus (butuh multi-tenant
per-project, invoicing, dan kontrak). Ditandai sebagai peluang v3 "WO Mode".

---

## 3. Kerangka Nilai & Metrik Sukses

### 3.1 North Star Metric

**Weekly Active Couples (WAC)** — jumlah pernikahan (bukan user) yang punya minimal satu
aksi tulis (centang checklist / tambah pengeluaran / update RSVP) dalam 7 hari terakhir.

### 3.2 KPI MVP (diukur 60 hari setelah rilis)

| Metrik | Definisi | Target |
|---|---|---|
| Activation rate | % pembeli yang menyelesaikan onboarding (set tanggal + nama) dalam 48 jam sejak pembelian | ≥ 75% |
| Time to first value | Median waktu dari login pertama sampai aksi tulis pertama | ≤ 5 menit |
| Guest list adoption | % pernikahan aktif dengan ≥ 20 tamu terinput | ≥ 55% |
| Budget adoption | % pernikahan aktif dengan ≥ 3 pengeluaran tercatat | ≥ 45% |
| WA invite usage | % pernikahan yang memakai tombol "Kirim WhatsApp" ≥ 10 kali | ≥ 35% |
| D30 retention | % pembeli yang membuka app di hari ke-30 | ≥ 40% |
| Refund rate | % refund atas total transaksi | ≤ 3% |
| Support ticket rate | Tiket per 100 pembeli (mayoritas diperkirakan "gagal terima email") | ≤ 8 |

### 3.3 Guardrail Metric

- p75 Largest Contentful Paint di 4G ≤ 2.5 s.
- Error rate API < 1% dari total request.
- Nol insiden kebocoran data lintas pernikahan (tamu satu pasangan terlihat pasangan lain).

---

## 4. Ruang Lingkup Fungsional

Prioritas memakai **MoSCoW**. MVP = seluruh *Must* + *Should* yang ditandai `v1`.

### 4.1 Modul 0 — Akses & Onboarding

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F0.1 | Sistem menerima notifikasi pembelian (webhook / import CSV) berisi email, nama, order id, produk, nominal | Must |
| F0.2 | Sistem membuat akun otomatis dari email pembeli dan mencatat *entitlement* (hak akses) | Must |
| F0.3 | Sistem mengirim email "Aktifkan akunmu" berisi magic link berumur 7 hari | Must |
| F0.4 | Pengguna membuat password pada halaman aktivasi; setelah itu login dengan email+password | Must |
| F0.5 | Login ulang tersedia lewat magic link ("Lupa password / kirim link ke email") | Must |
| F0.6 | Kirim ulang email aktivasi dari halaman publik dengan input email pembelian | Must |
| F0.7 | Onboarding 4 langkah: nama pasangan → tanggal akad & resepsi → estimasi jumlah tamu → total budget | Must |
| F0.8 | Setelah onboarding, sistem otomatis men-seed checklist, kategori budget, dan daftar seserahan dari template | Must |
| F0.9 | Pengguna dapat mengundang pasangan lewat email untuk mengakses pernikahan yang sama | Should `v1` |
| F0.10 | Prompt "Tambahkan ke Home Screen" (A2HS) muncul setelah kunjungan ke-2 | Should `v1` |

### 4.2 Modul 1 — Beranda & Countdown

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F1.1 | Kartu countdown: sisa hari menuju akad/resepsi, tanggal lengkap berbahasa Indonesia | Must |
| F1.2 | Ringkasan cepat: sisa hari, sisa minggu, sisa jam, lokasi kota | Must |
| F1.3 | Kartu "Tugas Bulan Ini": maksimal 5 item checklist dengan tenggat di bulan berjalan + link "Lihat semua" | Must |
| F1.4 | Kartu Anggaran: bar progres terpakai vs total, nominal terpakai, sisa | Must |
| F1.5 | Kartu Tamu: total kepala, sudah konfirmasi hadir, undangan terkirim, pending | Must |
| F1.6 | Kartu Milestone: 3 tenggat besar terdekat (lamaran, prewedding, fitting, akad) | Should `v1` |
| F1.7 | Salam personal "Halo, {nama pria} & {nama wanita}" | Must |
| F1.8 | Penanganan tanggal hari-H yang sudah lewat: countdown berubah menjadi mode "Terima kasih" + ringkasan | Should `v1` |
| F1.9 | Lonceng notifikasi in-app | Could |

### 4.3 Modul 2 — Checklist Persiapan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F2.1 | Checklist ter-seed otomatis, dikelompokkan per kategori: Venue, Vendor, Busana & Rias, Dokumen KUA/Catatan Sipil, Mahar, Seserahan, Dekorasi, Katering, Dokumentasi, Souvenir, Lain-lain | Must |
| F2.2 | Centang/uncheck item, dengan waktu penyelesaian tercatat | Must |
| F2.3 | Tambah, ubah, hapus item buatan sendiri | Must |
| F2.4 | Setiap item punya: judul, catatan, tenggat, prioritas (rendah/normal/tinggi), penanggung jawab (pria/wanita/berdua) | Must |
| F2.5 | Filter: semua / belum selesai / selesai / jatuh tempo bulan ini / terlambat | Must |
| F2.6 | Progress bar per kategori dan progres keseluruhan (%) | Must |
| F2.7 | Tambah kategori sendiri | Should `v1` |
| F2.8 | Item checklist dapat ditautkan ke pengeluaran di modul budget | Could |
| F2.9 | Urutkan ulang item (drag) | Could |

### 4.4 Modul 3 — Budget Tracker

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F3.1 | Set total budget pernikahan (mata uang IDR) | Must |
| F3.2 | Kategori anggaran ter-seed (Venue, Katering, Dekorasi, Dokumentasi, Busana & Rias, MUA, Hiburan, Souvenir, Mahar & Seserahan, Administrasi, Cadangan) dengan alokasi rencana | Must |
| F3.3 | Catat pengeluaran: judul, kategori, nominal, tanggal, metode bayar, catatan | Must |
| F3.4 | Status pembayaran per pengeluaran: DP / Lunas / Belum bayar, beserta nominal terbayar | Must |
| F3.5 | Ringkasan: total budget, total rencana, total terpakai, total terbayar, sisa budget | Must |
| F3.6 | Peringatan visual saat kategori melebihi alokasi, dan saat total terpakai > total budget | Must |
| F3.7 | Ubah & hapus pengeluaran | Must |
| F3.8 | Rincian per kategori (klik kategori → daftar pengeluarannya) | Must |
| F3.9 | Unggah foto bukti/nota per pengeluaran | Should `v1` |
| F3.10 | Ekspor CSV pengeluaran | Should `v1` |
| F3.11 | Catat pemasukan (amplop/sumbangan keluarga) | Could |

### 4.5 Modul 4 — Daftar Tamu, Undangan & RSVP

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F4.1 | Tambah tamu: nama, nomor HP, jumlah kepala (pax), pihak (pria/wanita), grup, alamat, catatan | Must |
| F4.2 | Grup tamu buatan sendiri (Keluarga, Teman Kuliah, Kantor, Tetangga, Bridesmaid, dll.) dengan warna | Must |
| F4.3 | Statistik header: total kepala, total undangan, hadir, terkirim, pending | Must |
| F4.4 | Pencarian tamu berdasarkan nama/nomor | Must |
| F4.5 | Filter berdasarkan grup, pihak (pria/wanita), status RSVP, status kirim | Must |
| F4.6 | Status RSVP per tamu: Pending / Hadir / Tidak hadir / Mungkin, plus jumlah orang yang benar-benar datang | Must |
| F4.7 | Tombol "Kirim WhatsApp": membuka `wa.me` dengan template pesan berisi nama tamu dan link undangan/RSVP | Must |
| F4.8 | Template pesan undangan yang bisa diedit, dengan placeholder `{nama}`, `{pria}`, `{wanita}`, `{tanggal}`, `{link}` | Must |
| F4.9 | Menandai undangan "sudah terkirim" otomatis setelah tombol WA ditekan | Must |
| F4.10 | Halaman RSVP publik per tamu (token unik, tanpa login): konfirmasi hadir/tidak, jumlah orang, ucapan | Must |
| F4.11 | Ubah & hapus tamu | Must |
| F4.12 | Import tamu dari CSV / tempel daftar nama (satu nama per baris) | Should `v1` |
| F4.13 | Ekspor daftar tamu ke CSV | Should `v1` |
| F4.14 | Kirim WA massal berurutan (buka satu per satu dengan penanda posisi terakhir) | Should `v1` |
| F4.15 | Buku ucapan: daftar ucapan dari halaman RSVP | Should `v1` |
| F4.16 | Deteksi duplikat nomor HP saat menambah tamu | Could |
| F4.17 | Check-in tamu di hari-H via scan QR | Won't (v1) |

### 4.6 Modul 5 — Checklist Seserahan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F5.1 | Daftar seserahan ter-seed per kategori standar: Alat Salat, Pakaian, Sepatu & Tas, Skincare, Make-up, Perhiasan, Alat Mandi, Makanan/Buah, Perlengkapan Tidur | Must |
| F5.2 | Centang item yang sudah dibeli, catat harga aktual | Must |
| F5.3 | Tambah/ubah/hapus item seserahan sendiri | Must |
| F5.4 | Rekomendasi produk per item (nama produk, kisaran harga, gambar, link marketplace) dari katalog yang kami kurasi | Must |
| F5.5 | Total estimasi vs total aktual belanja seserahan, tersinkron ke kategori budget "Mahar & Seserahan" | Should `v1` |
| F5.6 | Kelompokkan per "hantaran ke-N" (nampan 1..N) | Could |

### 4.7 Modul 6 — Profil & Pengaturan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F6.1 | Ubah data pernikahan: nama, tanggal akad/resepsi, lokasi, kota, foto sampul | Must |
| F6.2 | Ubah nama & password akun | Must |
| F6.3 | Kelola anggota (undang pasangan, cabut akses) | Should `v1` |
| F6.4 | Simpan URL undangan digital milik pengguna (dipakai di template WA) | Must |
| F6.5 | Pengingat: aktif/nonaktif email pengingat mingguan | Should `v1` |
| F6.6 | Halaman bantuan & kontak WhatsApp admin | Must |
| F6.7 | Hapus akun & seluruh data (hak subjek data) | Must |
| F6.8 | Ekspor seluruh data pernikahan (JSON/ZIP) | Should `v1` |

---

## 5. Alur Pengguna Utama

### 5.1 Alur Pembelian → Aktivasi (kritis untuk konversi)

```
Marketplace (Lynk/Mayar)
  └─ Pembeli bayar
       └─ Webhook POST /api/webhooks/order  ──> verifikasi signature
            ├─ upsert user (email pembeli)         [status: pending_activation]
            ├─ insert entitlement (produk, order_id, lifetime)
            └─ kirim email "Aktifkan Akunmu" (magic link, exp 7 hari)
                 └─ Pembeli klik link → /aktivasi?token=...
                      ├─ token valid   → form buat password → sesi login dibuat → /onboarding
                      └─ token invalid → /aktivasi/kirim-ulang (input email pembelian)
```

**Kegagalan yang harus ditangani:**
- Email masuk spam → sediakan halaman `/aktivasi/kirim-ulang` yang di-link dari halaman
  terima kasih marketplace, dan tampilkan instruksi "cek folder spam/promosi".
- Email pembelian salah ketik → admin dapat memindahkan entitlement ke email lain lewat
  panel admin (F7.3).
- Webhook gagal/telat → tersedia import CSV order manual di panel admin (F7.2).
- Pembeli membeli 2x → entitlement kedua diabaikan (idempotent by `external_order_id`).

### 5.2 Alur Onboarding (target < 90 detik)

1. "Siapa nama kalian?" → nama pria, nama wanita
2. "Kapan hari bahagianya?" → tanggal akad (wajib), tanggal resepsi (opsional, default = akad)
3. "Perkiraan berapa tamu?" → angka (dipakai untuk rekomendasi budget)
4. "Berapa budget kalian?" → nominal (boleh dilewati, bisa diisi nanti)
5. Loading "Menyiapkan checklist kalian…" → seed template → masuk ke Beranda

### 5.3 Alur Sebar Undangan

```
Tamu ditambahkan/diimport
  └─ Buka detail tamu → tombol "Kirim WhatsApp"
       ├─ sistem me-render template pesan (nama tamu + link RSVP unik)
       ├─ buka https://wa.me/62xxxx?text=<pesan ter-encode> di tab baru
       └─ sistem menandai invitation_status = 'sent', invitation_sent_at = now()
            └─ Tamu klik link → /rsvp/{token}
                 └─ pilih Hadir/Tidak + jumlah orang + ucapan
                      └─ update rsvp_status; statistik beranda ikut berubah
```

### 5.4 Alur Harian (returning user)

Buka app → Beranda → lihat sisa hari & tugas bulan ini → centang 1–2 tugas →
(opsional) catat pengeluaran baru → tutup. **Target: selesai dalam < 60 detik.**

---

## 6. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Performa | LCP p75 ≤ 2.5 s pada koneksi 4G; interaksi centang checklist terasa instan (optimistic UI, < 100 ms) |
| Mobile-first | Dirancang untuk lebar 360–430 px; desktop hanya penyesuaian (max-width terpusat) |
| Offline | PWA dengan app shell ter-cache; data terakhir bisa dibaca offline; aksi tulis offline diantre (v1.1) |
| Ketersediaan | 99.5% bulanan |
| Keamanan | Isolasi data per pernikahan wajib (Row Level Security di database, bukan hanya di aplikasi); halaman RSVP publik hanya boleh mengakses satu baris tamu lewat token acak 32 karakter |
| Privasi | Data tamu (nama + nomor HP) adalah data pribadi pihak ketiga; wajib ada kebijakan privasi, retensi, dan penghapusan; tunduk pada UU PDP No. 27/2022 |
| Aksesibilitas | Kontras teks ≥ 4.5:1, target sentuh ≥ 44×44 px, dukungan screen reader untuk aksi utama |
| Bahasa | Seluruh antarmuka `id-ID`; format tanggal "Minggu, 22 November 2026"; format uang "Rp 49.700.000" |
| Zona waktu | Semua tanggal hari-H disimpan dengan zona waktu pernikahan (default `Asia/Jakarta`) |
| Kompatibilitas | Chrome/Safari Android & iOS 2 versi terakhir |
| Skala v1 | 5.000 pernikahan, rata-rata 300 tamu → ~1,5 juta baris tamu; dalam batas wajar Postgres single-instance |

---

## 7. Kebutuhan Admin (Back Office)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F7.1 | Dashboard: jumlah pembeli, aktivasi, pernikahan aktif | Should `v1` |
| F7.2 | Import order manual dari CSV marketplace | Must |
| F7.3 | Cari pembeli by email, kirim ulang email aktivasi, pindahkan entitlement | Must |
| F7.4 | Kelola template checklist & katalog rekomendasi seserahan | Must |
| F7.5 | Nonaktifkan akses (refund/chargeback) | Should `v1` |

---

## 8. Monetisasi & Paket

| Paket | Harga | Isi |
|---|---|---|
| **Rangkai Basic** | Rp 29.000 (coret 55.000) | Seluruh modul MVP, 1 pernikahan, 2 anggota, tamu tanpa batas, akses seumur hidup produk v1 |
| **Rangkai Plus** (v1.1) | Rp 79.000 | + ekspor PDF rundown, + buku ucapan bertema, + backup otomatis, + prioritas support |

Alasan sekali bayar: pasar Indonesia untuk produk sekali pakai (nikah sekali) menolak
langganan; churn setelah hari-H 100% sehingga model langganan tidak masuk akal.

**Definisi "seumur hidup"** harus dinyatakan di halaman penjualan: akses berlaku selama
layanan berjalan, minimal 24 bulan sejak pembelian.

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Email aktivasi masuk spam → pembeli komplain / refund | Tinggi | Domain email terverifikasi (SPF/DKIM/DMARC), halaman kirim-ulang mandiri, instruksi di halaman terima kasih marketplace, tombol "chat admin" |
| Pengguna kehilangan data tamu (hasil kerja berjam-jam) | Tinggi | Backup harian point-in-time, soft delete 30 hari, fitur ekspor CSV |
| Kebocoran data lintas pernikahan | Kritis | RLS wajib di semua tabel + tes otomatis kebocoran di CI |
| Ketergantungan pada satu marketplace | Sedang | Abstraksi provider order; import CSV sebagai jalur cadangan |
| `wa.me` dianggap merepotkan (harus klik per tamu) | Sedang | Mode "kirim beruntun" dengan penanda posisi; edukasi bahwa ini menghindari nomor terblokir |
| Penyalahgunaan: satu akun dipakai ramai-ramai | Rendah | Batas 2 anggota per pernikahan; harga rendah membuat pembajakan tidak menarik |
| Beban puncak di musim nikah (Juni–Desember) | Sedang | Arsitektur serverless yang menskala otomatis; monitoring kuota database |

---

## 10. Rencana Rilis

| Fase | Durasi | Isi | Kriteria selesai |
|---|---|---|---|
| **M0 — Fondasi** | Minggu 1–2 | Skema DB + RLS, auth, webhook order, email aktivasi, onboarding, seeding template | Pembeli uji coba bisa bayar → aktif → melihat beranda kosong terisi template |
| **M1 — Modul Inti** | Minggu 3–5 | Beranda, Checklist, Budget | Ketiga modul lulus uji fungsional & tes RLS |
| **M2 — Tamu & Undangan** | Minggu 5–7 | Daftar tamu, grup, filter, WA deep link, halaman RSVP publik, import/ekspor CSV | 300 tamu bisa diinput & disebar tanpa error; halaman RSVP publik lolos uji keamanan token |
| **M3 — Seserahan & Polish** | Minggu 7–8 | Seserahan + katalog rekomendasi, PWA/A2HS, profil, panel admin, analitik | Lighthouse PWA ≥ 90, seluruh KPI instrumented |
| **Beta tertutup** | Minggu 8 | 20 pasangan sungguhan | ≥ 15 dari 20 menyelesaikan onboarding tanpa bantuan |
| **Rilis publik** | Minggu 9 | — | — |

---

## 11. Pertanyaan Terbuka

1. Marketplace mana yang jadi kanal utama (Lynk.id vs Mayar)? Menentukan format webhook.
2. Apakah rekomendasi produk seserahan memakai link afiliasi? Jika ya, perlu pengungkapan
   afiliasi di UI dan pencatatan klik.
3. Berapa lama data disimpan setelah hari-H? Usulan: aktif 12 bulan setelah hari-H, lalu
   arsip read-only, hapus permanen setelah 24 bulan dengan pemberitahuan email.
4. Perlukah dukungan pernikahan adat dengan banyak acara (siraman, midodareni, ngunduh
   mantu)? Usulan: v1.1 lewat tabel `events` yang sudah disiapkan di skema.
