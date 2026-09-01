# Status Implementasi

| Field | Value |
|---|---|
| Diperbarui | 2026-09-01 |
| Terhadap commit | lihat `git log -1` |

Dokumen ini memetakan **setiap ID kebutuhan di `docs/01-PRD.md`** ke keadaan kodenya
sekarang. Gunanya satu: mencegah dokumen dan kode saling menjauh diam-diam.

**Aturan yang menjaganya tetap benar:** B7.7 (PR yang mengubah cakupan sebuah ID wajib
memperbarui barisnya di sini) dan B7.8 (Server Action wajib punya pemanggil UI di PR yang
sama). Keduanya di `docs/04-RULES.md`.

**Cara merawatnya.** Setiap kali sebuah kebutuhan selesai dikerjakan, ubah barisnya di
sini dalam PR yang sama. Kalau kamu menambah kebutuhan baru, beri ID baru di PRD dan
tambahkan barisnya di sini. Berkas ini yang dibaca lebih dulu sebelum menaksir "sudah
sampai mana".

Arti lambang:

| Lambang | Arti |
|---|---|
| ✅ | Selesai dan bisa dipakai |
| 🟡 | Sebagian — inti jalan, ada bagian yang belum |
| ⬜ | Belum dikerjakan |
| ⚙️ | Bukan kode: setelan di dashboard Supabase atau langkah manual |

---

## Ringkasan

| Modul | ✅ | 🟡 | ⬜ | Catatan |
|---|---|---|---|---|
| Akses & Onboarding | 7 | 0 | 1 | Menambah akun kedua masih lewat SQL |
| Beranda | 5 | 2 | 1 | Milestone belum ada |
| Checklist | 7 | 0 | 1 | Tautan ke pengeluaran belum |
| Anggaran | 7 | 1 | 3 | Vendor, unggah nota, ekspor belum |
| Tamu & Undangan | 14 | 1 | 2 | Yang paling lengkap |
| Seserahan | 5 | 1 | 1 | Sinkron ke anggaran belum |
| Profil | 3 | 1 | 2 | Ganti password & ekspor JSON belum |

Seluruh **Must** di PRD sudah ✅ atau 🟡. Yang ⬜ semuanya berprioritas *Should* atau
*Could*, kecuali dua yang dijelaskan di bawah.

---

## Modul 0 — Akses & Onboarding

| ID | Kebutuhan | Status | Keterangan |
|---|---|---|---|
| F0.1 | Akun dibuat lewat dashboard Supabase | ⚙️ | Langkahnya di `docs/07-RUNBOOK.md` §2. Tidak ada halaman pendaftaran di kode, dan itu memang disengaja |
| F0.2 | Login email + password | ✅ | `src/app/(auth)/masuk/` |
| F0.3 | Lupa password lewat magic link | ✅ | `src/app/(auth)/lupa-password/`. Sengaja selalu menampilkan pesan sama, berhasil atau tidak, supaya tidak membocorkan email mana yang terdaftar |
| F0.4 | Pendaftaran publik ditutup | ⚙️ | **Wajib dimatikan manual** di Supabase. Tidak ada kode yang bisa memaksakannya — lihat RUNBOOK §2 langkah 3 |
| F0.5 | Onboarding | ✅ | `src/app/onboarding/`. Satu halaman berisi tiga kelompok pertanyaan, bukan empat layar terpisah — untuk lima isian, satu halaman lebih cepat |
| F0.6 | Seeding template otomatis | ✅ | RPC `seed_wedding_defaults`, idempoten |
| F0.7 | Akun kedua sebagai `partner` | ⬜ | Belum ada UI. Sementara lewat SQL — perintahnya ada di RUNBOOK §2 langkah 6 |
| F0.8 | Prompt "Tambahkan ke Home Screen" | 🟡 | Manifest dan ikon lengkap sehingga A2HS bawaan browser berfungsi. Prompt kustom belum ada |

## Modul 1 — Beranda & Countdown

| ID | Kebutuhan | Status | Keterangan |
|---|---|---|---|
| F1.1 | Kartu countdown | ✅ | Menangani hari-H dan tanggal yang sudah lewat |
| F1.2 | Ringkasan cepat | 🟡 | Baru chip kota. Chip sisa bulan/minggu/jam belum |
| F1.3 | Tugas Bulan Ini, maksimal 5 | ✅ | Tenggat bulan ini digabung seluruh yang terlambat |
| F1.4 | Kartu Anggaran | ✅ | |
| F1.5 | Kartu Tamu | ✅ | Membedakan kepala, undangan, dan orang yang hadir |
| F1.6 | Salam personal | ✅ | |
| F1.7 | Kartu Milestone | ⬜ | Tabel `milestones` ada di skema tapi belum disentuh kode sama sekali |
| F1.8 | Mode pascaacara | 🟡 | Countdown berubah jadi "N hari yang lalu". Ringkasan "Terima kasih" belum |

## Modul 2 — Checklist

| ID | Kebutuhan | Status | Keterangan |
|---|---|---|---|
| F2.1 | 11 kategori ter-seed | ✅ | 49 item, `db/seeds/01_checklist.sql` |
| F2.2 | Centang / batalkan | ✅ | Optimistic; `completed_at` diisi trigger database |
| F2.3 | Tambah, ubah, hapus item | ✅ | Ubah dibuka dengan menekan judul item |
| F2.4 | Judul, catatan, tenggat, prioritas, PJ | ✅ | Bisa diisi saat menambah dan diubah setelahnya |
| F2.5 | Filter | ✅ | Tersimpan di URL |
| F2.6 | Progres per kategori & keseluruhan | ✅ | Lewat view `checklist_category_progress` |
| F2.7 | Tambah kategori sendiri | ✅ | Lewat tombol di form tambah tugas |
| F2.8 | Tautkan item ke pengeluaran | ⬜ | Kolom `expense_id` ada di skema, belum dipakai |

## Modul 3 — Anggaran

| ID | Kebutuhan | Status | Keterangan |
|---|---|---|---|
| F3.1 | Set total budget | ✅ | Di halaman Profil |
| F3.2 | 11 kategori ter-seed dengan alokasi | ✅ | Porsi default menjumlah tepat 100% |
| F3.3 | Catat pengeluaran | ✅ | |
| F3.4 | Nominal terbayar → status DP/Lunas | ✅ | Status diturunkan, tidak disimpan |
| F3.5 | Ringkasan | ✅ | Memisahkan terpakai dari terbayar |
| F3.6 | Peringatan melebihi alokasi | ✅ | |
| F3.7 | Ubah & hapus pengeluaran | ✅ | Ubah dibuka dengan menekan judul pengeluaran |
| F3.8 | Rincian per kategori | 🟡 | Bar per kategori ✅, dan alokasinya bisa diubah di tempat. Halaman detail berisi daftar pengeluaran per kategori belum |
| F3.9 | Catat vendor | ⬜ | Tabel `vendors` ada di skema, belum disentuh kode |
| F3.10 | Unggah foto nota | ⬜ | Kolom `receipt_path` ada; Supabase Storage belum dipakai sama sekali |
| F3.11 | Ekspor CSV pengeluaran | ⬜ | Baru daftar tamu yang bisa diekspor |

## Modul 4 — Tamu, Undangan & RSVP

| ID | Kebutuhan | Status | Keterangan |
|---|---|---|---|
| F4.1 | Tambah tamu | ✅ | |
| F4.2 | Grup tamu | ✅ | `/tamu/grup`. Warna grup belum dipakai di UI |
| F4.3 | Statistik header | ✅ | |
| F4.4 | Pencarian nama/nomor | ✅ | Di server, memakai indeks trigram |
| F4.5 | Filter grup/pihak/RSVP/kirim | ✅ | Tersimpan di URL |
| F4.6 | Status RSVP + jumlah orang | ✅ | |
| F4.7 | Tombol Kirim WhatsApp | ✅ | Nonaktif dengan penjelasan bila nomor kosong/tidak valid |
| F4.8 | Template pesan bisa diedit | ✅ | Di Profil, dengan pratinjau |
| F4.9 | Tandai terkirim otomatis | ✅ | Optimistic; hanya menaikkan status, tidak pernah menurunkan |
| F4.10 | Halaman RSVP publik | ✅ | Lewat RPC saja, tidak menyentuh tabel `guests` |
| F4.11 | Ubah & hapus tamu | ✅ | Hapus bersifat soft delete 30 hari |
| F4.12 | Import daftar nama | 🟡 | Tempel teks ✅ dengan pratinjau. **Unggah berkas CSV belum** |
| F4.13 | Ekspor CSV | ✅ | `/api/export/tamu` |
| F4.14 | Mode kirim beruntun | ⬜ | |
| F4.15 | Buku ucapan | ⬜ | Ucapan **tersimpan** di tabel `wishes` lewat halaman RSVP, tapi belum ada halaman untuk membacanya |
| F4.16 | Peringatan nomor duplikat | ✅ | Memperingatkan, tidak menolak |

## Modul 5 — Seserahan

| ID | Kebutuhan | Status | Keterangan |
|---|---|---|---|
| F5.1 | 9 kategori ter-seed | ✅ | 32 item |
| F5.2 | Centang dibeli + harga aktual | ✅ | Input harga muncul setelah dicentang |
| F5.3 | Tambah, ubah, hapus | 🟡 | Tambah, hapus, dan ubah harga aktual ✅. Mengubah nama/kategori/tautan belum |
| F5.4 | Tautan toko per item | ✅ | Ditempel sendiri; tidak ada katalog terkurasi |
| F5.5 | Total estimasi vs aktual | 🟡 | Perbandingannya ✅. Sinkron otomatis ke kategori anggaran belum |
| F5.6 | Kelompok per nampan | ⬜ | Kolom `tray_number` ada, belum dipakai |

## Modul 6 — Profil & Pengaturan

| ID | Kebutuhan | Status | Keterangan |
|---|---|---|---|
| F6.1 | Ubah data pernikahan | 🟡 | Nama, kota, budget, acara utama ✅. **Foto sampul belum** (Storage belum dipakai) |
| F6.2 | Simpan URL undangan digital | ✅ | |
| F6.3 | Ubah template WhatsApp | ✅ | Dengan pratinjau memakai fungsi render yang sama dengan tombol WA |
| F6.4 | Ubah nama & password akun | ⬜ | Sementara lewat "Lupa password" atau dashboard Supabase |
| F6.5 | Ekspor seluruh data (JSON) | ⬜ | Baru CSV daftar tamu |
| F6.6 | Pengingat email mingguan | ⬜ | Kolom `reminder_email_enabled` ada; tidak ada cron dan tidak ada penyedia email |

---

## Dua hal yang perlu diingat

**1. Pendaftaran mandiri (F0.4) tidak bisa dipaksakan dari kode.**
Kalau setelan itu lupa dimatikan di Supabase, siapa pun yang tahu URL-nya bisa membuat
akun. Mereka tidak akan bisa melihat data kalian — RLS menahan itu, dan tesnya
membuktikannya — tapi mereka bisa membuat pernikahan sendiri di database kalian.
Periksa setelan ini setiap kali membuat ulang proyek Supabase.

**2. Supabase Storage belum dipakai sama sekali.**
Kolom `cover_image_path` dan `receipt_path` ada di skema tapi tidak ada kode yang
menulisnya, dan **belum ada bucket yang dibuat**. Sebelum mengerjakan F3.10 atau F6.1
bagian foto, bucket privat beserta kebijakannya harus dibuat lebih dulu — itu pekerjaan
tersendiri, bukan sekadar menambah input file.

---

## Kalau melanjutkan, kerjakan dengan urutan ini

Diurutkan menurut manfaat nyata dibagi usaha, bukan menurut nomor ID.

| # | Kerjakan | Kenapa duluan | Perkiraan |
|---|---|---|---|
| 1 | **Coba seluruh alur di Supabase sungguhan** (RUNBOOK §2) | Belum pernah dijalankan di luar tes. Halaman RSVP yang paling rawan — RPC-nya baru diuji lewat psql, bukan lewat PostgREST | Setengah hari |
| 2 | F0.7 — tambah akun kedua lewat UI | Sekarang harus lewat SQL. Ini satu-satunya langkah penyiapan yang butuh buka SQL Editor | Kecil |
| 3 | F4.15 — halaman buku ucapan | Datanya **sudah terkumpul** di tabel `wishes` setiap kali tamu mengisi RSVP. Tanpa halaman ini, ucapan yang masuk tidak pernah terbaca | Kecil |
| 4 | F6.5 — ekspor JSON menyeluruh | Cadangan sekarang baru daftar tamu. Checklist dan anggaran belum bisa diselamatkan | Kecil |
| 5 | F1.7 — kartu milestone | Beranda terasa kurang tanpa pandangan jangka panjang | Sedang |
| 6 | F4.14 — mode kirim WhatsApp beruntun | Baru terasa perlu saat menyebar ratusan undangan sekaligus | Sedang |
| 7 | F3.9 — catatan vendor | Berguna saat sudah mulai membandingkan penawaran | Sedang |
| 8 | F3.10, F6.1 — unggah gambar | **Butuh menyiapkan bucket Supabase Storage lebih dulu**, jadi bukan pekerjaan sekali duduk | Besar |
| 9 | Tes E2E (B5.3) | Bernilai kalau kode ini masih dikembangkan berbulan-bulan | Besar |

Butir 1 mendahului semuanya. Sebelum aplikasinya benar-benar dipakai dengan data
sungguhan, menambah fitur adalah menumpuk pekerjaan di atas asumsi yang belum terbukti.

---

## Yang ada di skema tapi belum disentuh kode

Bukan kesalahan — semuanya sengaja disiapkan lebih dulu supaya penambahannya nanti tidak
perlu migrasi struktural. Tapi jangan mengira fitur-fitur ini sudah jalan hanya karena
tabelnya ada:

| Tabel / kolom | Untuk | Terkait |
|---|---|---|
| `milestones` | Kartu milestone di beranda | F1.7 |
| `vendors` | Catatan vendor & harga penawaran | F3.9 |
| `wishes` | Halaman buku ucapan (datanya sudah terkumpul) | F4.15 |
| `events` selain acara utama | Acara adat berbilang | PRD §9 no. 1 |
| `seserahan_items.tray_number` | Pengelompokan per hantaran | F5.6 |
| `checklist_items.expense_id` | Tautan checklist ke anggaran | F2.8 |
| `expenses.receipt_path`, `weddings.cover_image_path` | Unggahan gambar | F3.10, F6.1 |
| `member_role = 'viewer'` | Akses lihat-saja untuk keluarga | Belum ada di PRD |
