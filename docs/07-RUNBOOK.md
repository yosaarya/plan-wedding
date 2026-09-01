# Runbook — Menyiapkan, Menjalankan, dan Merawat

| Field | Value |
|---|---|
| Untuk | Kalian berdua, dan siapa pun yang melanjutkan kode ini |
| Prasyarat | Node 22+, akun Supabase, akun Vercel (opsional), PostgreSQL 15+ untuk tes lokal |

Dokumen ini berisi langkah-langkah yang **harus dijalankan tangan** dan tidak bisa
diwakili kode. Kalau ada yang terlewat, aplikasinya tidak akan jalan atau — lebih buruk —
jalan tapi tidak aman.

---

## 1. Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL
npm run dev            # http://localhost:3000
```

Untuk lokal, isi `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Nilai ini dipakai untuk
membangun tautan RSVP di pesan WhatsApp — kalau salah, tautannya mengarah ke tempat yang
salah dan tamu tidak bisa konfirmasi.

---

## 2. Menyiapkan proyek Supabase (sekali saja)

Urutannya penting. Langkah 3 adalah yang paling sering terlupa dan paling berbahaya.

**1. Buat proyek.** Pilih region terdekat — Singapore (`ap-southeast-1`).

**2. Jalankan skema dan seed.** Buka SQL Editor, jalankan berurutan:

```
db/schema.sql
db/seeds/01_checklist.sql
db/seeds/02_budget.sql
db/seeds/03_seserahan.sql
```

Objek `auth.users` dan `auth.uid()` sudah disediakan Supabase, jadi stub yang dipakai
tes lokal tidak diperlukan di sini.

**3. Matikan pendaftaran mandiri.**
Authentication → Providers → Email → **Disable signup**.

> Tanpa ini, siapa pun yang tahu URL aplikasi kalian bisa membuat akun. RLS tetap
> menahan mereka dari melihat data kalian, tapi mereka bisa membuat pernikahan sendiri
> di dalam database kalian. Ini satu-satunya kontrol keamanan yang tidak bisa
> dipaksakan dari kode.

**4. Buat dua akun.** Authentication → Users → Add user. Isi email dan password,
centang *Auto Confirm User*. Ulangi untuk akun kedua.

**5. Ambil kunci.** Project Settings → API. Salin *Project URL* dan kunci *anon public*
ke `.env.local`.

> Kunci `service_role` **tidak dibutuhkan aplikasi ini** dan tidak boleh dimasukkan ke
> environment variable mana pun. Ia melewati RLS.

**6. Login dengan akun pertama**, isi onboarding sampai selesai. Ini yang membuat baris
`weddings`, keanggotaan `owner`, acara akad, dan seluruh isi checklist/anggaran/seserahan.

**7. Tautkan akun kedua sebagai `partner`.** Belum ada UI-nya (F0.7), jadi lewat SQL
Editor:

```sql
insert into public.wedding_members (wedding_id, user_id, role, accepted_at)
select w.id, u.id, 'partner', now()
from public.weddings w
cross join auth.users u
where u.email = 'email-pasangan@contoh.com'
  and w.deleted_at is null
limit 1;
```

Trigger `enforce_member_limit` akan menolak kalau sudah ada dua anggota penulis.

---

## 3. Deploy ke Vercel

1. Import repositori ini di Vercel.
2. Set environment variable untuk *Production* dan *Preview*:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` — URL produksi, mis. `https://nikah-kita.vercel.app`
3. Region: pilih Singapore (`sin1`).
4. Setelah deploy pertama, kembali ke Supabase → Authentication → URL Configuration,
   tambahkan URL produksi ke *Site URL* dan *Redirect URLs*. Tanpa ini, tautan reset
   password akan mengarah ke `localhost`.

**Kalau URL berubah**, `NEXT_PUBLIC_SITE_URL` harus ikut diubah. Tautan RSVP yang sudah
terlanjur dikirim ke tamu memakai URL lama, jadi hindari mengganti domain setelah
undangan disebar.

---

## 4. Pemeriksaan sebelum menyimpan perubahan

```bash
npm run check      # typecheck + lint + unit test
npm run test:rls   # asersi isolasi data — butuh PostgreSQL lokal
npm run build
```

`npm run test:rls` membangun ulang database `plan_wedding_test` dari nol setiap kali.
Ia memakai `PGHOST`/`PGPORT`/`PGUSER` dari environment:

```bash
export PGHOST=/var/run/postgresql PGUSER=postgres
./tests/rls/run.sh
```

CI di `.github/workflows/ci.yml` menjalankan kelimanya pada setiap PR.

**Setelah mengubah `db/schema.sql`, `npm run test:rls` wajib dijalankan.** Ini
satu-satunya yang membuktikan tidak ada kebocoran data antar pernikahan.

---

## 5. Mengubah database

1. Tulis migrasi baru: `db/migrations/NNNN_deskripsi.sql`, nomor berurutan.
2. Perbarui `db/schema.sql` agar tetap mencerminkan bentuk akhir.
3. Kalau menambah tabel domain: wajib ada `wedding_id`, RLS `enable` + `force`, empat
   kebijakan standar, dan asersi isolasi di `tests/rls/isolation.sql`.
4. `npm run test:rls`
5. Jalankan migrasinya di SQL Editor Supabase.

Migrasi tidak dijalankan otomatis saat deploy — itu keputusan sadar, karena dengan dua
pengguna, menjalankan SQL secara sengaja lebih aman daripada otomasi yang bisa salah
waktu.

---

## 6. Cadangan

Dua lapis, dan yang kedua yang benar-benar penting:

1. **Supabase** menyimpan backup harian otomatis di paket berbayar. Di paket gratis,
   jangan mengandalkannya.
2. **Ekspor sendiri.** Profil → "Unduh daftar tamu (CSV)". Lakukan setiap kali selesai
   menambah banyak tamu. Berkas ini tetap bisa dibuka meski Supabase, Vercel, dan
   aplikasi ini semuanya hilang.

Untuk cadangan menyeluruh, jalankan di SQL Editor lalu simpan hasilnya:

```sql
select json_agg(t) from public.guests t where deleted_at is null;
select json_agg(t) from public.checklist_items t;
select json_agg(t) from public.expenses t;
select json_agg(t) from public.seserahan_items t;
```

---

## 7. Kalau ada yang rusak

| Gejala | Kemungkinan sebab |
|---|---|
| Terus diarahkan ke `/masuk` | Cookie sesi tidak tersegarkan. Cek `NEXT_PUBLIC_SUPABASE_URL` benar dan `src/proxy.ts` tidak diubah |
| Terus diarahkan ke `/onboarding` padahal sudah pernah isi | Baris `wedding_members` untuk user itu belum ada. Lihat §2 langkah 7 |
| Halaman kosong / "Gagal membaca…" | Kebijakan RLS menolak. Jalankan `npm run test:rls`; kalau lulus, berarti keanggotaannya yang belum ada |
| Tombol WA nonaktif | Nomor HP kosong atau tidak dikenali. Format yang diterima ada di `src/lib/whatsapp/phone.ts` |
| Tautan RSVP mengarah ke `localhost` | `NEXT_PUBLIC_SITE_URL` belum diisi di Vercel |
| Tamu bilang "undangan tidak ditemukan" | Tamunya terhapus (soft delete), atau tokennya salah salin |
| Tamu tidak bisa kirim RSVP berulang | Batas 10 per menit per tamu. Tunggu satu menit |
| Email reset password tidak sampai | Cek folder spam. Paket gratis Supabase punya kuota email harian yang kecil |

---

## 8. Setelah hari-H

Tidak ada penghapusan otomatis. Yang perlu dilakukan sendiri:

1. Ekspor daftar tamu dan ucapan sebagai kenang-kenangan.
2. Kalau proyek Supabase mau ditutup, ekspor dulu — **daftar tamu berisi nomor HP
   ratusan orang lain**, dan menyimpannya tanpa alasan lebih lama dari perlu bukan hal
   yang baik. Hapus proyeknya kalau sudah tidak dibutuhkan.
