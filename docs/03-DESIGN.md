# Design System — `plan-wedding`

| Field | Value |
|---|---|
| Versi | 2.0 — pemakaian pribadi |
| Platform utama | Mobile web (PWA), 360–430 px |
| Bahasa | id-ID |
| Nada | Hangat, tenang, rapi. Bukan mewah-berlebihan, bukan korporat. |

---

## 1. Prinsip Desain

1. **Tenangkan, jangan bikin panik.** Persiapan nikah sudah membuat stres. Warna lembut,
   spasi lega, satu aksi utama per layar. Merah hanya untuk hal yang benar-benar salah.
2. **Angka besar, konteks kecil.** Sisa hari, sisa budget, jumlah tamu adalah alasan orang
   membuka aplikasi. Tampilkan sebagai angka besar, label di bawahnya kecil.
3. **Satu jempol.** Semua aksi utama berada di sepertiga bawah layar. Navigasi di bawah.
4. **Progres selalu terlihat.** Setiap modul menampilkan "sudah sejauh mana", karena rasa
   maju adalah nilai emosional utama produk ini.
5. **Kosong bukan berarti hampa.** Setiap keadaan kosong menjelaskan manfaat dan memberi
   satu tombol untuk mulai.
6. **Jangan pernah kehilangan kerja pengguna.** Konfirmasi untuk aksi merusak, undo untuk
   aksi cepat, autosave untuk form panjang.

---

## 2. Warna

### 2.1 Token dasar

```css
:root {
  /* Netral hangat — dasar seluruh antarmuka */
  --cream-50:  #FDF8F3;   /* latar aplikasi */
  --cream-100: #F8EFE4;   /* latar bagian sekunder */
  --cream-200: #EFE2D3;   /* garis pemisah lembut */
  --ink-900:   #2A2320;   /* teks utama */
  --ink-700:   #574C45;   /* teks sekunder */
  --ink-500:   #8B7F76;   /* teks tersier / placeholder */
  --ink-300:   #C4B8AE;   /* ikon nonaktif */
  --white:     #FFFFFF;   /* permukaan kartu */

  /* Terracotta — warna merek, dipakai untuk angka penting & aksen */
  --brand-50:  #FBF0EA;
  --brand-100: #F5DCCE;
  --brand-300: #DDA184;
  --brand-500: #C2703F;   /* warna merek utama */
  --brand-600: #A85C31;
  --brand-700: #86471F;   /* teks di atas brand-100 */

  /* Sage — aksi positif, konfirmasi, tombol beli */
  --sage-50:   #EAF6EF;
  --sage-500:  #2FA36B;
  --sage-600:  #248055;
  --sage-700:  #1B6341;

  /* Blush — aksen dekoratif (gradasi, ilustrasi). BUKAN untuk teks. */
  --blush-200: #FBD8DA;
  --blush-400: #F3A9B0;

  /* Semantik */
  --success:   var(--sage-600);
  --warning:   #C98A12;   /* mendekati/melewati alokasi budget */
  --danger:    #C0392B;   /* terlambat, hapus */
  --info:      #3A6EA5;
}
```

### 2.2 Peran warna

| Peran | Token | Catatan |
|---|---|---|
| Latar aplikasi | `--cream-50` | Bukan putih murni; menghangatkan seluruh tampilan |
| Permukaan kartu | `--white` | Elevasi lewat kontras dengan cream, bukan bayangan tebal |
| Teks utama | `--ink-900` | Kontras 13:1 di atas cream-50 |
| Teks sekunder | `--ink-700` | Kontras 6.4:1 |
| Angka countdown | `--brand-500` | Elemen paling menonjol di beranda |
| Tombol utama | `--sage-500`, teks putih | Satu-satunya warna aksi positif; dipakai hemat, satu per layar |
| Tombol sekunder | Garis `--brand-300`, teks `--brand-700` | — |
| Aksi merusak | `--danger` | Hanya di dalam dialog konfirmasi atau ikon hapus |
| Bar progres | Isi `--brand-500`, jalur `--cream-200` | Berubah `--warning` di 90–100%, `--danger` di > 100% |

### 2.3 Aturan wajib

- Rasio kontras teks minimum **4.5:1**; teks ≥ 24 px minimum **3:1**.
- Warna tidak pernah menjadi satu-satunya penanda status. Selalu disertai ikon atau label
  (mis. RSVP "Hadir" = titik hijau **dan** teks "Hadir").
- `--blush-*` dilarang untuk teks atau ikon fungsional.
- Mode gelap tidak ada di v1. Palet ditulis sebagai token agar mudah ditambahkan nanti.

---

## 3. Tipografi

| Peran | Font | Ukuran / Line-height | Weight |
|---|---|---|---|
| Display (angka countdown) | Fraunces | 64 / 68 | 600 |
| H1 (judul halaman) | Fraunces | 24 / 32 | 600 |
| H2 (judul kartu) | Plus Jakarta Sans | 18 / 26 | 700 |
| H3 (label bagian) | Plus Jakarta Sans | 15 / 22 | 700 |
| Body | Plus Jakarta Sans | 15 / 24 | 400 |
| Body kecil | Plus Jakarta Sans | 13 / 20 | 400 |
| Caption / meta | Plus Jakarta Sans | 12 / 16 | 500 |
| Angka statistik | Plus Jakarta Sans | 22 / 28 | 700, `font-variant-numeric: tabular-nums` |
| Tombol | Plus Jakarta Sans | 15 / 20 | 600 |

**Aturan:**
- Fraunces hanya untuk nama pasangan, judul halaman, dan angka countdown. Sisanya
  Plus Jakarta Sans.
- Ukuran teks minimum 12 px; input form minimum **16 px** agar iOS tidak auto-zoom.
- Tanpa teks kapital penuh kecuali label chip ≤ 3 kata.
- Nominal uang selalu `tabular-nums` supaya kolom angka rata.

---

## 4. Spasi, Radius, Bayangan

```
Spasi (kelipatan 4):  4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56
Padding halaman:      16 px kiri-kanan
Jarak antar kartu:    12 px
Padding dalam kartu:  16 px
Radius:               sm 8 · md 12 · lg 16 · xl 20 · full 999
Bayangan:
  card   0 1px 2px rgba(42,35,32,.04), 0 4px 12px rgba(42,35,32,.05)
  raised 0 2px 4px rgba(42,35,32,.06), 0 12px 24px rgba(42,35,32,.08)
  none   untuk elemen di dalam kartu (pakai border --cream-200)
```

Kartu memakai radius `xl` (20) — bentuk membulat menegaskan nada hangat.
Tombol memakai radius `full`.

---

## 5. Tata Letak

### 5.1 Kerangka aplikasi

```
┌─────────────────────────────┐
│  Header (sticky, 56px)      │  judul + aksi kanan
├─────────────────────────────┤
│                             │
│  Konten                     │  padding 16px, scroll
│  max-width 480px, terpusat  │
│                             │
│  (padding-bottom 88px agar  │
│   tidak tertutup nav)       │
├─────────────────────────────┤
│  Bottom Nav (fixed, 64px)   │  + safe-area-inset-bottom
└─────────────────────────────┘
```

### 5.2 Bottom navigation (5 item, sesuai desain referensi)

| Ikon | Label | Rute |
|---|---|---|
| Rumah | Beranda | `/beranda` |
| Ceklis | Checklist | `/checklist` |
| Dompet | Anggaran | `/anggaran` |
| Amplop | Undangan | `/tamu` |
| Orang | Profil | `/profil` |

- Item aktif: ikon terisi + label `--brand-600`. Nonaktif: ikon garis + `--ink-500`.
- Tinggi 64 px, target sentuh penuh setinggi bar.
- Seserahan diakses dari Checklist dan dari beranda, bukan tab tersendiri (5 tab adalah
  batas kenyamanan di layar 360 px).

### 5.3 Aksi utama

Tombol tambah (`+`) melayang di kanan bawah, 16 px di atas bottom nav, ukuran 56 px,
warna `--brand-500`. Ada di halaman Checklist, Anggaran, Tamu, dan Seserahan.

---

## 6. Komponen Inti

Setiap komponen ditandai keadaannya: **[ada]** sudah dibangun, **[inline]** ada tapi
ditulis langsung di halamannya belum jadi komponen bersama, **[belum]** masih rencana.
Jangan menganggap yang bertanda *belum* sudah tersedia.

### 6.1 Card **[ada]** — `components/ui/card.tsx`

Permukaan putih, radius 20, padding 16, bayangan `card`.
Varian: `default`, `outlined` (border cream-200, tanpa bayangan), `accent` (latar
`--brand-50` untuk kartu countdown).

### 6.2 CountdownCard **[inline]** — di `app/(app)/beranda/page.tsx`

```
┌──────────────────────────────────────┐
│           Minggu, 22 Nov 2026        │  caption, ink-500
│                                      │
│                 103                  │  display 64, brand-500
│              hari lagi               │  body, ink-700
│                                      │
│  ┌────┐ ┌─────┐ ┌──────┐ ┌────────┐  │  chips
│  │3 bln│ │1 mgg│ │103 hr│ │Sukabumi│  │
│  └────┘ └─────┘ └──────┘ └────────┘  │
└──────────────────────────────────────┘
```

Keadaan khusus:
- H-0: angka diganti teks "Hari ini!" dengan animasi lembut.
- Setelah hari-H: kartu berubah menjadi "Selamat menempuh hidup baru" + ringkasan tamu hadir.
- Tanggal belum diisi: tombol "Atur tanggal pernikahan".

### 6.3 StatTile **[ada]** — `components/ui/stat-tile.tsx`

Petak statistik (dipakai di header daftar tamu: 280 kepala · 2 hadir · 0 terkirim ·
278 pending). Angka 22/700 tabular, label 12/500 `--ink-500`. Empat kolom sama lebar,
gap 8. Setiap petak adalah tombol yang menerapkan filter terkait.

### 6.4 ProgressBar **[ada]** — `components/ui/progress-bar.tsx`

Tinggi 8, radius full, jalur `--cream-200`. Selalu berpasangan dengan label persentase
atau nominal. Ubah warna sesuai ambang: < 90% brand, 90–100% warning, > 100% danger.

### 6.5 ChecklistItem **[ada]** — `app/(app)/checklist/checklist-item.tsx`

```
┌──────────────────────────────────────┐
│ ☐  Prewedding                        │
│    🕐 15 Agu · Tinggi · Berdua       │
└──────────────────────────────────────┘
```
Kotak centang 24 px, target sentuh 44 px. Item selesai: teks `--ink-500` dengan coretan,
kotak terisi `--sage-500`. Optimistic: centang berubah seketika; jika gagal, nilainya
kembali dan pesan error muncul di bawah baris.

Penghapusan memakai `DeleteButton` (§6.11), bukan geser ke kiri — gestur geser tidak
punya padanan di desktop dan tidak terlihat oleh pembaca layar.

### 6.6 GuestRow **[ada]** — `app/(app)/tamu/guest-row.tsx`

```
┌──────────────────────────────────────┐
│ (P)  Panji            2 pax          │
│      Pending      [✎] [WA] [🗑]      │
└──────────────────────────────────────┘
```
Avatar huruf awal dengan warna dari grup. Badge status: Pending (cream-200/ink-700),
Hadir (sage-50/sage-700), Tidak hadir (ink-300/ink-700), Terkirim (brand-50/brand-700).

### 6.7 Chip filter **[ada]** — `app/(app)/tamu/filter-chips.tsx`

Baris chip yang bisa digeser horizontal di bawah kolom pencarian. Chip aktif: latar
`--brand-500`, teks putih. Chip dengan hitungan menampilkan angka di dalamnya
("Lunas 220"). Tinggi 32, radius full, padding 12.

### 6.8 Form tambah/ubah **[ada, bukan sheet]**

Rancangan awal memakai bottom sheet. Yang dibangun memakai dua pola yang lebih sederhana,
dan keduanya sudah memenuhi tujuan aslinya — mempertahankan konteks daftar:

- **Kartu yang mengembang di tempat** untuk isian pendek: tambah tugas, catat
  pengeluaran, tambah barang seserahan. Tombol `+` melayang berubah menjadi kartu form
  di aliran halaman.
- **Halaman tersendiri** untuk isian panjang: tambah/ubah tamu, import daftar nama.
  Punya URL sendiri sehingga bisa dibagikan dan tombol kembali bekerja wajar.

Bottom sheet dengan fokus terkunci dan gestur geser **belum dibangun**. Kalau nanti
dikerjakan, ia menggantikan pola pertama, bukan yang kedua.

### 6.9 EmptyState **[ada]** — `components/ui/empty-state.tsx`

Ilustrasi garis sederhana (blush + cream) + judul + satu kalimat manfaat + satu tombol.
Contoh: "Belum ada tamu — Tambahkan tamu untuk mulai menyebar undangan lewat WhatsApp.
[Tambah tamu] [Import dari file]".

### 6.10 Toast **[belum]**

Rencana: muncul di atas bottom nav, durasi 4 detik, satu baris teks + opsi "Urungkan"
untuk aksi hapus.

Sementara ini umpan balik memakai dua cara yang lebih sederhana: pesan error muncul di
tempat (`role="alert"` di dekat form atau baris yang bersangkutan), dan konfirmasi
simpan muncul sebagai teks `role="status"`. Karena "Urungkan" belum ada, setiap
penghapusan memakai konfirmasi dua langkah lebih dulu (§6.11).

### 6.11 DeleteButton **[ada]** — `components/ui/delete-button.tsx`

Tombol `×` di ujung baris. Sekali tekan berubah menjadi pasangan "Batal / Hapus",
sehingga tidak ada penghapusan yang terjadi dari satu ketukan tak sengaja. Dipakai untuk
baris di dalam daftar; penghapusan yang lebih berat (tamu, pernikahan) memakai dialog
tersendiri yang menjelaskan akibatnya.

---

## 7. Format Data (id-ID)

| Jenis | Format | Contoh |
|---|---|---|
| Tanggal panjang | `EEEE, d MMMM yyyy` | Minggu, 22 November 2026 |
| Tanggal pendek | `d MMM` | 15 Agu |
| Uang | `Rp` + pemisah titik, tanpa desimal | Rp 49.700.000 |
| Uang ringkas | Untuk kartu ringkasan | Rp 49,7 jt |
| Jumlah tamu | angka + satuan | 280 kepala · 2 pax |
| Sisa waktu | angka + satuan | 103 hari lagi |
| Persen | bulat | 40% |

Semua diimplementasikan di `lib/format/` — komponen dilarang memformat sendiri.

---

## 8. Gerak

| Interaksi | Durasi | Easing |
|---|---|---|
| Sheet naik/turun | 280 ms | `cubic-bezier(.32,.72,0,1)` |
| Toast | 200 ms | ease-out |
| Centang checklist | 150 ms | ease-out |
| Bar progres | 400 ms | ease-in-out |
| Pindah halaman | 200 ms fade | ease |

Hormati `prefers-reduced-motion: reduce` — matikan transform, sisakan perubahan opasitas.

---

## 9. Aksesibilitas

- Target sentuh minimum 44 × 44 px.
- Cincin fokus terlihat: outline 2 px `--brand-500`, offset 2 px. Tidak pernah
  `outline: none` tanpa pengganti.
- Setiap ikon-tombol punya `aria-label` berbahasa Indonesia.
- Bar progres memakai `role="progressbar"` dengan `aria-valuenow/min/max`.
- Perubahan status (RSVP tersimpan, tugas selesai) diumumkan lewat `aria-live="polite"`.
- Form: label selalu terlihat (bukan hanya placeholder); pesan error terkait lewat
  `aria-describedby`.
- Urutan heading logis, satu `h1` per halaman.

---

## 10. Nada Bahasa

- Sapaan "kamu"/"kalian", bukan "Anda". Hangat tapi tidak lebay.
- Tanpa jargon teknis. "Simpan", bukan "Submit". "Daftar tamu", bukan "Guest list".
- Pesan error menjelaskan langkah berikutnya: "Nomor HP belum lengkap. Contoh: 081234567890."
- Emoji dipakai sangat terbatas: hanya di judul kategori seserahan dan template pesan WhatsApp.
- Notifikasi memakai kalimat aktif: "3 tugas jatuh tempo minggu ini."

---

## 11. Aset & PWA

| Aset | Spesifikasi |
|---|---|
| Ikon aplikasi | 192, 384, 512 px + maskable 512 (padding aman 10%) |
| Splash | Latar `--cream-50`, logo terpusat |
| `theme_color` | `#FDF8F3` |
| `background_color` | `#FDF8F3` |
| `display` | `standalone` |
| Ilustrasi | SVG garis satu warna `--brand-300` + isian `--blush-200` |
| Foto | `next/image`, format WebP, `loading="lazy"`, rasio 16:9 untuk sampul |

---

## 12. Peta Layar

Rute yang **sudah ada** (17 rute; jalankan `npm run build` untuk daftar terkini):

| Rute | Isi |
|---|---|
| `/beranda` | Salam · countdown · tugas bulan ini · anggaran · tamu |
| `/checklist` | Progres keseluruhan · chip filter · daftar per kategori · FAB tambah |
| `/anggaran` | Ringkasan · bar per kategori · pengeluaran terbaru · FAB |
| `/tamu` | StatTile · pencarian · chip filter · daftar · FAB |
| `/tamu/[id]` | Status RSVP · ubah data · hapus |
| `/tamu/tambah` | Form tamu baru |
| `/tamu/import` | Tempel daftar nama · pratinjau · konfirmasi |
| `/tamu/grup` | Buat & lihat grup |
| `/seserahan` | Progres belanja · daftar per kategori · FAB |
| `/profil` | Data pernikahan · acara utama · template WA · cadangan · keluar |
| `/rsvp/[token]` | PUBLIK — nama pengantin · tanggal & lokasi · pilihan hadir · ucapan |
| `/onboarding` | Tiga kelompok pertanyaan dalam satu halaman |
| `/masuk`, `/lupa-password` | Autentikasi |
| `/api/export/tamu` | Unduh CSV |

Yang **belum ada** dan disebut di rancangan awal: halaman detail kategori checklist,
halaman detail kategori anggaran, dan halaman buku ucapan. Status lengkap per kebutuhan
ada di `docs/06-STATUS.md`.
