# Panduan kerja untuk agen & kontributor

Baca berkas ini sampai habis sebelum menulis kode. Isinya pendek dan setiap butirnya
pernah menjadi kesalahan nyata di proyek ini.

## Konteks dalam satu paragraf

Aplikasi web (PWA) berbahasa Indonesia untuk persiapan pernikahan, dipakai oleh **dua
orang** — calon pengantin — dan tidak dijual. Tidak ada pendaftaran mandiri,
entitlement, webhook order, langganan, atau panel admin. Kalau menemukan sisa rujukan
ke hal-hal itu, itu peninggalan rancangan lama: hapus. Lima modul: countdown, checklist,
anggaran, tamu/undangan/RSVP, seserahan.

RLS tetap wajib meski hanya berdua. Dua alasan, dan keduanya bukan soal jumlah pengguna:
anon key Supabase ada di dalam browser, dan daftar tamu berisi nomor HP ratusan orang
lain.

## Urutan membaca

| Kalau kamu mau tahu… | Baca |
|---|---|
| Apa yang sudah jadi dan apa yang belum | **`docs/06-STATUS.md`** — mulai dari sini |
| Cara menjalankan, deploy, atau memperbaiki yang rusak | `docs/07-RUNBOOK.md` |
| Kenapa sebuah keputusan diambil | `docs/01-PRD.md`, `docs/02-ARCHITECTURE.md` |
| Aturan yang mengikat | `docs/04-RULES.md` — rujukan saat ada keraguan |
| Warna, ukuran, komponen | `docs/03-DESIGN.md` |
| Bentuk data | `docs/05-SCHEMA.md`, `db/schema.sql` |

`docs/01-PRD.md` adalah **spesifikasi, bukan laporan**. Sebuah ID yang ada di sana belum
tentu sudah dikerjakan. `docs/06-STATUS.md` yang menyimpan keadaan sebenarnya.

Aturan bernomor (`A5.9`, `B3.1`) dirujuk dari komentar SQL dan sebaiknya dirujuk juga
dari komentar kode. Penomorannya stabil — jangan menomori ulang.

## Yang paling sering salah

- **Uang.** Selalu `bigint` rupiah utuh. Tidak pernah float. Tidak pernah dijumlahkan
  di JavaScript setelah paginasi — agregasi dilakukan di SQL (A4.1, A4.10, B6.2).
- **Tamu.** "Kepala" (`sum(headcount)`), "undangan" (jumlah baris), dan "hadir"
  (`sum(attending_count)`, jumlah **orang**) adalah tiga angka berbeda yang tidak boleh
  tertukar (A5.1, A5.9).
- **Isolasi data.** Setiap kueri tabel domain menyertakan `.eq('wedding_id', weddingId)`
  eksplisit *meskipun* RLS aktif. Pertahanan berlapis (B2.4).
- **Service role.** Tidak dipakai di aplikasi ini. Semua akses lewat JWT pengguna supaya
  RLS selalu aktif (B2.2). ESLint memblokir impornya.
- **Halaman RSVP publik.** Tidak pernah menyentuh tabel `guests` langsung; hanya lewat
  `get_rsvp_context` / `submit_rsvp` (A5.11). Menambah kolom ke kedua RPC itu wajib
  disertai asersi kebocoran di `tests/rls/isolation.sql`.
- **PII.** Nomor HP, email, dan nama tamu tidak pernah masuk log, pesan error, atau URL
  (B4.4).
- **Aksi menganggur.** Server Action yang ditulis wajib langsung punya pemanggil di UI
  dalam PR yang sama (B7.8). Aksi tanpa UI terlihat seperti fitur yang sudah jadi
  padahal tidak bisa dijangkau siapa pun — ini pernah terjadi tiga kali di sini.

## Pola kode

Setiap modul di `src/features/<domain>/`: `queries.ts` (baca, hanya dari Server
Component), `actions.ts` (`'use server'`, mutasi), `schema.ts` (Zod), `lib.ts` (logika
murni tanpa React/Supabase — di sinilah unit test hidup).

Server Action selalu: **validasi → otorisasi → tulis → revalidate**, diawali
`await requireWedding()`. Ia mengembalikan `{ error?: string }` alih-alih melempar,
supaya form bisa menampilkan pesannya.

Komponen klien tidak pernah mengambil data domain dari Supabase. Pengecualiannya hanya
autentikasi dan halaman RSVP publik, yang memang harus berjalan di browser.

## Mengubah database

- `db/schema.sql` adalah baseline bentuk akhir. Perubahan produksi lewat
  `db/migrations/NNNN_deskripsi.sql`, forward-only, satu perubahan per file, dan
  `db/schema.sql` ikut diperbarui agar tetap cocok.
- Tabel domain baru **wajib** punya `wedding_id`, RLS `enable` + `force`, empat kebijakan
  standar, dan asersi di `tests/rls/isolation.sql` (B3.1, B4.8, B5.2).
- Setelah mengubah skema: `npm run test:rls`

## Perintah

```bash
npm run dev
npm run check      # typecheck + lint + unit test
npm run test:rls   # asersi isolasi data (butuh PostgreSQL lokal)
npm run build
```

CI menjalankan kelimanya pada setiap PR.

## Yang belum diuji otomatis

Jangan mengira ada jaring pengaman yang sebenarnya tidak ada:

- **Tidak ada tes E2E.** Alur login → onboarding → tambah tamu → kirim WA → RSVP harus
  diperiksa manual (B5.3).
- **RPC belum diuji lewat PostgREST.** `get_rsvp_context` dan `submit_rsvp` diuji lewat
  psql, bukan jalur HTTP yang dipakai aplikasi. Halaman RSVP adalah yang pertama harus
  dicoba manual setelah deploy.
- **Komponen React tidak punya unit test.** Yang diuji hanya logika murni.

## Bahasa

- Nama variabel, fungsi, tabel, dan kolom: bahasa Inggris.
- Teks yang dilihat pengguna dan komentar dokumen: bahasa Indonesia sesuai
  `docs/04-RULES.md` Bagian C. Sapaan "kamu"/"kalian", bukan "Anda".
- Pesan commit: Conventional Commits berbahasa Inggris (`feat(guests): add csv import`).

## Definition of Done

Sepuluh butir di `docs/04-RULES.md` Bagian D. Yang paling sering terlewat: **butir 4**
(tes isolasi untuk tabel baru) dan **butir 8** (memperbarui `docs/06-STATUS.md`).
