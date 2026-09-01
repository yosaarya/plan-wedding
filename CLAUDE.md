# Panduan kerja untuk agen & kontributor

Repositori ini punya dokumen perancangan yang bersifat **normatif**. Baca sebelum menulis kode.

## Sebelum mulai

1. `docs/04-RULES.md` adalah rujukan saat ada keraguan. Aturan bernomor (`A5.9`, `B3.1`)
   dirujuk dari komentar SQL dan sebaiknya dirujuk juga dari komentar kode.
2. `docs/02-ARCHITECTURE.md` §4–5 menetapkan struktur direktori dan pola lapisan.
   Jangan menciptakan struktur baru tanpa alasan yang ditulis.
3. `docs/03-DESIGN.md` menetapkan token dan komponen. Jangan menulis nilai warna,
   ukuran font, atau format tanggal/uang secara langsung di komponen.

## Yang paling sering salah

- **Uang.** Selalu `bigint` rupiah utuh. Tidak pernah float. Tidak pernah dijumlahkan
  di JavaScript setelah paginasi — agregasi dilakukan di SQL (aturan A4.1, A4.10, B6.2).
- **Tamu.** "Kepala" (`sum(headcount)`) dan "undangan" (jumlah baris) adalah dua angka
  berbeda dan tidak boleh tertukar. "Hadir" adalah jumlah orang, bukan jumlah baris
  (aturan A5.1, A5.9).
- **Isolasi data.** Setiap kueri tabel domain menyertakan `.eq('wedding_id', weddingId)`
  secara eksplisit *meskipun* RLS aktif. Pertahanan berlapis (aturan B2.4).
- **Service role.** Tidak dipakai di aplikasi ini. Semua akses lewat JWT pengguna supaya
  RLS selalu aktif (aturan B2.2).
- **Halaman RSVP publik.** Tidak pernah menyentuh tabel `guests` langsung; hanya lewat
  `get_rsvp_context` / `submit_rsvp` (aturan A5.11).
- **PII.** Nomor HP, email, dan nama tamu tidak pernah masuk log, Sentry, atau properti
  event analitik (aturan B4.4).

## Mengubah database

- Skema hidup di `db/schema.sql` sebagai baseline. Perubahan produksi lewat
  `db/migrations/NNNN_deskripsi.sql`, forward-only, satu perubahan per file.
- Tabel domain baru **wajib** punya `wedding_id`, RLS `enable` + `force`, empat kebijakan
  standar, dan asersi di `tests/rls/isolation.sql`. PR tanpa asersi isolasi tidak boleh
  di-merge (aturan B3.1, B4.8, B5.2).
- Setelah mengubah skema, jalankan: `./tests/rls/run.sh`

## Konteks

Aplikasi ini dipakai oleh dua orang — calon pengantin — bukan dijual. Tidak ada
pendaftaran mandiri, entitlement, webhook order, atau panel admin. Kalau menemukan
sisa rujukan ke hal-hal itu di kode atau dokumen, itu peninggalan rancangan lama:
hapus.

RLS tetap wajib meski hanya berdua — anon key Supabase ada di dalam browser, dan kami
menyimpan nomor HP ratusan tamu.

## Bahasa

- Nama variabel, fungsi, tabel, dan kolom: bahasa Inggris.
- Teks yang dilihat pengguna, komentar dokumen, dan pesan commit deskriptif untuk
  produk: bahasa Indonesia sesuai `docs/04-RULES.md` Bagian C.
- Pesan commit mengikuti Conventional Commits berbahasa Inggris
  (`feat(guests): add csv import`).

## Definition of Done

Sepuluh poin di `docs/04-RULES.md` Bagian D. Fitur belum selesai sampai semuanya
terpenuhi — termasuk keadaan kosong, keadaan error, dan tes isolasi untuk tabel baru.
