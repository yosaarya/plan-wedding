# Migrasi

Kosong secara sengaja. `db/schema.sql` adalah **baseline**: jalankan berkas itu untuk
membangun database dari nol.

Setelah skema dipakai di produksi, setiap perubahan masuk sebagai berkas baru di sini:

- Dinamai `NNNN_deskripsi.sql` dengan nomor berurutan (`0001_add_vendor_notes.sql`).
- Forward-only. Tidak ada berkas `down`.
- Tidak boleh diedit setelah masuk `main` — perbaikan dilakukan lewat migrasi berikutnya.
- Perubahan yang merusak dipecah tiga tahap: tambah kolom → backfill → hapus kolom lama
  pada rilis berikutnya.
- Migrasi dan kode yang membutuhkannya berada dalam PR yang sama.

`db/schema.sql` diperbarui agar tetap mencerminkan bentuk akhir setelah setiap migrasi.

Rujukan: `docs/04-RULES.md` aturan B3.6, B3.7, B7.5.
