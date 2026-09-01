# PRD — Aplikasi Persiapan Pernikahan (`plan-wedding`)

| Field | Value |
|---|---|
| Versi dokumen | 2.0 — pemakaian pribadi |
| Tanggal | 2026-09-01 |
| Pengguna | Dua orang: calon pengantin pria & wanita |
| Status | Disetujui, siap dikerjakan |

> **Perubahan dari v1.0.** Dokumen ini semula dirancang sebagai produk digital yang
> dijual. Diputuskan aplikasi hanya dipakai sendiri, sehingga seluruh lapisan penjualan
> dibuang: entitlement, webhook order marketplace, email aktivasi, halaman kirim-ulang,
> panel admin, harga, dan metrik bisnis. Lima modul intinya tidak berubah.

---

## 1. Ringkasan

Aplikasi web (PWA) berbahasa Indonesia untuk merapikan persiapan pernikahan kami berdua
dalam satu tempat, bisa dibuka dari HP kapan saja, dan datanya sama untuk kami berdua.

Lima modul: countdown hari-H, checklist persiapan, budget tracker, daftar tamu + RSVP +
sebar undangan lewat WhatsApp, dan checklist seserahan.

### 1.1 Masalah yang diselesaikan

Sekarang persiapan tersebar di banyak tempat:
- Daftar tamu di spreadsheet — susah dibuka dari HP, susah dipakai berdua bersamaan.
- Budget di catatan HP — jarang ter-update, jadi tidak pernah tahu sisa uang sebenarnya.
- Checklist di kertas dan kepala — sering ada yang terlewat, terutama dokumen KUA yang
  punya tenggat administratif.
- Sebar undangan: copy-paste pesan WhatsApp satu per satu ke ratusan kontak, tanpa catatan
  siapa yang sudah dikirim dan siapa yang sudah konfirmasi.
- Seserahan: tidak hafal standar isinya, belanja jadi mendadak.

### 1.2 Kenapa dibuat sendiri, bukan pakai aplikasi yang ada

Aplikasi wedding planner yang ada umumnya berlangganan, berbahasa Inggris, tidak mengenal
konteks Indonesia (dokumen KUA, mahar, seserahan, hantaran), dan daftar tamunya tidak
terhubung ke WhatsApp. Yang kami butuhkan spesifik dan jumlahnya sedikit — lebih cepat
dibuat sendiri dan datanya tetap milik kami.

### 1.3 Yang TIDAK dikerjakan

| Non-goal | Alasan |
|---|---|
| Sistem penjualan, akun berbayar, panel admin | Dipakai berdua. Akun dibuat sekali lewat dashboard Supabase. |
| Website undangan digital berdesain | Ini *planner*. Undangan digital dibuat/dibeli terpisah; aplikasi cukup menyimpan URL-nya untuk dipakai di pesan WhatsApp. |
| Blasting WhatsApp otomatis (WA Business API) | Risiko nomor terblokir dan berbiaya. Cukup `wa.me` deep link yang dibuka dan dikirim sendiri. |
| Aplikasi native di App Store / Play Store | PWA + "Add to Home Screen" sudah cukup. |
| Multi-bahasa | Hanya `id-ID`. |
| Katalog rekomendasi produk terkurasi | Butuh perawatan konten terus-menerus. Cukup tempel sendiri tautan tokonya di item seserahan. |
| Direktori vendor | Vendor dicatat sendiri seperlunya di modul anggaran. |

---

## 2. Pengguna

Dua orang, dengan pola pakai berbeda:

**Calon pengantin wanita** — pemegang kendali utama persiapan. Buka aplikasi hampir tiap
hari dari HP. Butuh: apa yang harus dikerjakan bulan ini, sisa budget, siapa yang belum
konfirmasi hadir.

**Calon pengantin pria** — terlibat sebagian (mahar, dokumen KUA, tamu dari pihaknya).
Buka aplikasi 1–2x seminggu. Butuh tampilan yang langsung ke intinya dan penanda mana
bagiannya (kolom "penanggung jawab" di checklist).

Keduanya punya akun sendiri dan melihat data pernikahan yang sama secara real-time.

**Pihak ketiga:** tamu undangan — hanya menyentuh halaman RSVP publik lewat tautan unik,
tanpa akun.

---

## 3. Ukuran Keberhasilan

Bukan metrik bisnis, tapi apakah aplikasinya benar-benar dipakai sampai hari-H:

| Ukuran | Target |
|---|---|
| Menggantikan spreadsheet daftar tamu sepenuhnya | Seluruh tamu ada di aplikasi, spreadsheet tidak dibuka lagi |
| Tidak ada tugas persiapan yang terlewat tenggatnya | Nol item "terlambat" yang tidak disadari |
| Tahu sisa budget kapan saja tanpa menghitung ulang | Angka sisa budget selalu akurat |
| Sebar undangan tanpa copy-paste manual | Semua undangan WhatsApp dikirim lewat tombol di aplikasi |
| Tetap enak dipakai saat data penuh | 300+ tamu tetap ringan dibuka di HP |

---

## 4. Ruang Lingkup Fungsional

Prioritas: **Must** (harus ada sebelum dipakai serius), **Should** (dikerjakan setelah
Must jalan), **Could** (kalau sempat).

### 4.1 Modul 0 — Akses & Onboarding

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F0.1 | Dua akun dibuat sekali lewat dashboard Supabase (bukan lewat halaman daftar) | Must |
| F0.2 | Login dengan email + password | Must |
| F0.3 | Lupa password lewat magic link ke email | Must |
| F0.4 | Halaman pendaftaran publik **ditutup** — tidak ada orang lain yang bisa bikin akun | Must |
| F0.5 | Onboarding 4 langkah: nama pasangan → tanggal akad & resepsi → perkiraan jumlah tamu → total budget | Must |
| F0.6 | Setelah onboarding, checklist, kategori anggaran, dan daftar seserahan ter-seed otomatis dari template | Must |
| F0.7 | Akun kedua ditautkan ke pernikahan yang sama sebagai `partner` | Must |
| F0.8 | Prompt "Tambahkan ke Home Screen" (A2HS) | Should |

### 4.2 Modul 1 — Beranda & Countdown

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F1.1 | Kartu countdown: sisa hari menuju acara utama, tanggal lengkap berbahasa Indonesia | Must |
| F1.2 | Ringkasan cepat: sisa bulan, minggu, hari, kota | Must |
| F1.3 | Kartu "Tugas Bulan Ini": maksimal 5 item dengan tenggat bulan berjalan + semua yang terlambat | Must |
| F1.4 | Kartu Anggaran: bar progres terpakai vs total, nominal terpakai, sisa | Must |
| F1.5 | Kartu Tamu: total kepala, sudah konfirmasi hadir, undangan terkirim, pending | Must |
| F1.6 | Salam personal "Halo, {pria} & {wanita}" | Must |
| F1.7 | Kartu Milestone: 3 tenggat besar terdekat | Should |
| F1.8 | Mode pascaacara setelah hari-H lewat: countdown berganti ringkasan | Should |

### 4.3 Modul 2 — Checklist Persiapan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F2.1 | Checklist ter-seed dalam 11 kategori: Dokumen KUA, Venue & Tanggal, Katering, Dekorasi, Busana & Rias, Dokumentasi, Mahar, Seserahan, Undangan, Hiburan & Souvenir, Lain-lain | Must |
| F2.2 | Centang/batalkan item, waktu penyelesaian tercatat otomatis | Must |
| F2.3 | Tambah, ubah, hapus item sendiri | Must |
| F2.4 | Tiap item punya: judul, catatan, tenggat, prioritas, penanggung jawab (pria/wanita/berdua) | Must |
| F2.5 | Filter: semua / belum selesai / selesai / jatuh tempo bulan ini / terlambat | Must |
| F2.6 | Progres per kategori dan progres keseluruhan | Must |
| F2.7 | Tambah kategori sendiri | Should |
| F2.8 | Tautkan item checklist ke pengeluaran di modul anggaran | Could |

### 4.4 Modul 3 — Budget Tracker

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F3.1 | Set total budget pernikahan | Must |
| F3.2 | 11 kategori anggaran ter-seed dengan alokasi rencana dari porsi default | Must |
| F3.3 | Catat pengeluaran: judul, kategori, nominal, tanggal, metode bayar, catatan | Must |
| F3.4 | Nominal terbayar per pengeluaran, sehingga status DP / Lunas / Belum bayar terlihat | Must |
| F3.5 | Ringkasan: total budget, total rencana, total terpakai, total terbayar, sisa | Must |
| F3.6 | Peringatan visual saat kategori atau total melebihi alokasi | Must |
| F3.7 | Ubah & hapus pengeluaran | Must |
| F3.8 | Rincian per kategori | Must |
| F3.9 | Catat vendor seperlunya (nama, kontak, harga penawaran, status booking) | Should |
| F3.10 | Unggah foto nota | Should |
| F3.11 | Ekspor CSV pengeluaran | Should |

### 4.5 Modul 4 — Daftar Tamu, Undangan & RSVP

Modul terpenting: paling banyak datanya dan paling melelahkan kalau manual.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F4.1 | Tambah tamu: nama, nomor HP, jumlah kepala (pax), pihak, grup, alamat, catatan | Must |
| F4.2 | Grup tamu sendiri (Keluarga, Teman Kuliah, Kantor, Tetangga, dll.) dengan warna | Must |
| F4.3 | Statistik header: total kepala, total undangan, hadir, terkirim, pending | Must |
| F4.4 | Pencarian tamu berdasarkan nama/nomor | Must |
| F4.5 | Filter berdasarkan grup, pihak, status RSVP, status kirim | Must |
| F4.6 | Status RSVP: Pending / Hadir / Tidak hadir / Mungkin + jumlah orang yang datang | Must |
| F4.7 | Tombol "Kirim WhatsApp": membuka `wa.me` dengan pesan berisi nama tamu dan tautan RSVP unik | Must |
| F4.8 | Template pesan yang bisa diedit, dengan placeholder `{nama}`, `{pria}`, `{wanita}`, `{tanggal}`, `{link}` | Must |
| F4.9 | Otomatis menandai "terkirim" setelah tombol WA ditekan, tetap bisa diubah manual | Must |
| F4.10 | Halaman RSVP publik per tamu (tautan token, tanpa login): hadir/tidak, jumlah orang, ucapan | Must |
| F4.11 | Ubah & hapus tamu | Must |
| F4.12 | Import tamu: tempel daftar nama (satu per baris) atau unggah CSV, dengan pratinjau | Must |
| F4.13 | Ekspor daftar tamu ke CSV | Should |
| F4.14 | Mode kirim beruntun: buka WA satu per satu dengan penanda posisi terakhir | Should |
| F4.15 | Buku ucapan dari halaman RSVP | Should |
| F4.16 | Peringatan nomor HP duplikat saat menambah tamu | Should |

### 4.6 Modul 5 — Checklist Seserahan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F5.1 | Daftar ter-seed dalam 9 kategori: Alat Salat, Pakaian, Sepatu & Tas, Skincare, Make-up, Perhiasan, Alat Mandi, Makanan & Buah, Perlengkapan Tidur | Must |
| F5.2 | Centang sudah dibeli, catat harga aktual | Must |
| F5.3 | Tambah/ubah/hapus item sendiri | Must |
| F5.4 | Tempel tautan toko per item, supaya tinggal klik saat mau beli | Must |
| F5.5 | Total estimasi vs total aktual, dan tawaran mencatatnya ke kategori anggaran "Mahar & Seserahan" | Should |
| F5.6 | Kelompokkan per hantaran (nampan ke-N) | Could |

### 4.7 Modul 6 — Profil & Pengaturan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F6.1 | Ubah data pernikahan: nama, tanggal, lokasi, kota, foto sampul | Must |
| F6.2 | Simpan URL undangan digital, dipakai di template WA | Must |
| F6.3 | Ubah template pesan WhatsApp | Must |
| F6.4 | Ubah nama & password akun | Must |
| F6.5 | Ekspor seluruh data pernikahan (JSON) sebagai cadangan | Should |
| F6.6 | Pengingat email mingguan: aktif/nonaktif | Could |

---

## 5. Alur Utama

### 5.1 Pemakaian pertama

```
Akun dibuat sekali lewat dashboard Supabase (dua email)
  └─ Login → belum punya pernikahan → /onboarding
       ├─ nama pasangan
       ├─ tanggal akad (wajib) & resepsi (opsional)
       ├─ perkiraan jumlah tamu
       └─ total budget
            └─ seed_wedding_defaults() → checklist, kategori anggaran, seserahan terisi
                 └─ Beranda
```

Akun kedua ditautkan sebagai `partner` ke pernikahan yang sama, lalu langsung melihat
data yang sudah ada.

### 5.2 Sebar undangan

```
Tamu ditambahkan (satu per satu atau import daftar)
  └─ Tombol "Kirim WhatsApp"
       ├─ template pesan di-render (nama tamu + tautan RSVP unik)
       ├─ buka wa.me di tab baru → kirim dari WhatsApp sendiri
       └─ tamu ditandai "terkirim"
            └─ Tamu klik tautan → /rsvp/{token}
                 └─ pilih hadir/tidak + jumlah orang + ucapan
                      └─ statistik di beranda ikut berubah
```

### 5.3 Pemakaian harian

Buka aplikasi → beranda → lihat sisa hari & tugas bulan ini → centang satu-dua tugas →
kalau ada, catat pengeluaran baru → tutup. Target: selesai di bawah satu menit.

---

## 6. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Mobile-first | Dirancang untuk lebar 360–430 px; desktop cukup dipusatkan dengan max-width |
| Performa | Ringan di 4G; centang checklist terasa instan (optimistic UI) |
| Skala nyata | ~300–400 tamu, ~200 item checklist, ~100 pengeluaran. Kecil — tapi daftar tamu tetap dipaginasi supaya enak di HP |
| PWA | Bisa ditambahkan ke Home Screen; app shell ter-cache sehingga tetap terbuka saat sinyal jelek |
| Keamanan | RLS tetap wajib meski hanya berdua: anon key Supabase ada di dalam browser, jadi database harus menolak akses dengan sendirinya. Halaman RSVP publik hanya boleh melihat satu baris tamu lewat token acak |
| Privasi | Nomor HP ratusan tamu adalah data pribadi orang lain. Tidak masuk log; tidak dibagikan; dihapus setelah tidak diperlukan |
| Cadangan | Ekspor CSV/JSON mandiri, karena kehilangan daftar tamu berarti mengulang kerja berjam-jam |
| Bahasa | Seluruh antarmuka `id-ID`; tanggal "Minggu, 22 November 2026"; uang "Rp 49.700.000" |
| Zona waktu | `Asia/Jakarta` |
| Biaya | Harus muat di paket gratis Supabase + Vercel |

---

## 7. Rencana Kerja

Tidak ada tenggat rilis; urutannya dipilih supaya bagian yang paling melelahkan kalau
manual selesai lebih dulu.

| Tahap | Isi | Selesai bila |
|---|---|---|
| **T0 — Fondasi** | Skema DB + RLS, login, guard sesi, onboarding, seeding template | Bisa login, isi onboarding, dan melihat checklist yang sudah terisi |
| **T1 — Tamu & undangan** | Daftar tamu, grup, filter, pencarian, import, deep link WA, halaman RSVP publik | 300 tamu bisa diinput dan disebar tanpa error; RSVP masuk dan statistik berubah |
| **T2 — Checklist & anggaran** | Kedua modul beserta ringkasannya | Progres dan sisa budget akurat |
| **T3 — Beranda** | Kartu countdown, tugas bulan ini, ringkasan anggaran & tamu | Beranda menjawab tiga pertanyaan harian tanpa pindah halaman |
| **T4 — Seserahan & rapikan** | Modul seserahan, profil, PWA/A2HS, ekspor data | Bisa dipasang di Home Screen dan data bisa dicadangkan |

Skema database, seed, dan tes isolasi **sudah selesai dan lulus** — itu prasyarat T0.

---

## 8. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kehilangan data tamu | Tinggi — mengulang kerja berjam-jam | Backup harian Supabase, soft delete 30 hari, ekspor CSV mandiri |
| Nomor HP tamu bocor | Tinggi — data pribadi orang lain | RLS, halaman RSVP publik lewat RPC yang tidak mengembalikan nomor HP, tidak ada PII di log |
| Aplikasi belum jadi saat sudah butuh dipakai | Sedang | Urutan kerja mendahulukan modul tamu; sampai T1 selesai, spreadsheet tetap dipakai sebagai cadangan |
| Kuota paket gratis terlampaui | Rendah | Skala data kecil; foto dibatasi ukurannya |
| Ditinggal setengah jadi | Sedang | Tiap tahap berdiri sendiri dan langsung berguna, jadi berhenti di tahap mana pun tetap menyisakan sesuatu yang terpakai |

---

## 9. Pertanyaan Terbuka

1. Perlukah dukungan acara adat berbilang (siraman, midodareni, ngunduh mantu)? Tabel
   `events` sudah menampungnya — tinggal ditampilkan di UI kalau memang dipakai.
2. Undangan digitalnya nanti pakai apa? Menentukan bentuk tautan `{link}` di pesan
   WhatsApp: tautan RSVP aplikasi ini, atau URL undangan yang mengarah balik ke sini.
3. Berapa lama data disimpan setelah hari-H sebelum dihapus?
