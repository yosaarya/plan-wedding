-- Template checklist persiapan pernikahan (konteks Indonesia).
-- days_before_wedding = tenggat dihitung mundur dari tanggal akad (aturan A3.3).

insert into public.template_checklist_categories (name, icon, is_system, sort_order) values
  ('Dokumen KUA',        'file-text',  true,  1),
  ('Venue & Tanggal',    'map-pin',    false, 2),
  ('Katering',           'utensils',   false, 3),
  ('Dekorasi',           'flower',     false, 4),
  ('Busana & Rias',      'shirt',      false, 5),
  ('Dokumentasi',        'camera',     false, 6),
  ('Mahar',              'gem',        false, 7),
  ('Seserahan',          'gift',       false, 8),
  ('Undangan',           'mail',       false, 9),
  ('Hiburan & Souvenir', 'music',      false, 10),
  ('Lain-lain',          'more-horizontal', false, 11);

insert into public.template_checklist_items (category_id, title, notes, days_before_wedding, priority, assigned_to, sort_order)
select c.id, v.title, v.notes, v.days, v.priority::task_priority, v.assignee::assignee, v.ord
from (values
  -- Dokumen KUA
  ('Dokumen KUA', 'Minta surat pengantar RT/RW (N1)', 'Bawa fotokopi KK dan KTP.', 90, 'high', 'both', 1),
  ('Dokumen KUA', 'Urus surat N1-N4 di kelurahan', null, 80, 'high', 'both', 2),
  ('Dokumen KUA', 'Siapkan fotokopi KTP, KK, akta lahir kedua mempelai', null, 80, 'high', 'both', 3),
  ('Dokumen KUA', 'Siapkan pas foto 2x3 dan 4x6 latar biru', 'Masing-masing 5 lembar.', 75, 'normal', 'both', 4),
  ('Dokumen KUA', 'Daftar nikah ke KUA', 'Minimal 10 hari kerja sebelum akad.', 45, 'high', 'both', 5),
  ('Dokumen KUA', 'Ikuti bimbingan perkawinan (bimwin)', null, 30, 'high', 'both', 6),
  ('Dokumen KUA', 'Konfirmasi jadwal & penghulu', null, 14, 'high', 'groom', 7),
  -- Venue & Tanggal
  ('Venue & Tanggal', 'Tentukan tanggal akad & resepsi', null, 300, 'high', 'both', 1),
  ('Venue & Tanggal', 'Survei minimal 3 venue', null, 270, 'high', 'both', 2),
  ('Venue & Tanggal', 'Booking venue & bayar DP', null, 240, 'high', 'both', 3),
  ('Venue & Tanggal', 'Cek fasilitas: parkir, listrik, ruang transit', null, 120, 'normal', 'both', 4),
  ('Venue & Tanggal', 'Technical meeting dengan pihak venue', null, 14, 'high', 'both', 5),
  -- Katering
  ('Katering', 'Tentukan estimasi jumlah porsi', null, 210, 'high', 'both', 1),
  ('Katering', 'Food tasting minimal 2 vendor', null, 180, 'normal', 'both', 2),
  ('Katering', 'Booking katering & bayar DP', null, 150, 'high', 'both', 3),
  ('Katering', 'Finalisasi menu & jumlah porsi', null, 30, 'high', 'both', 4),
  ('Katering', 'Konfirmasi ulang jumlah porsi setelah RSVP', null, 10, 'high', 'both', 5),
  -- Dekorasi
  ('Dekorasi', 'Tentukan tema & palet warna', null, 200, 'normal', 'bride', 1),
  ('Dekorasi', 'Survei vendor dekorasi', null, 180, 'normal', 'both', 2),
  ('Dekorasi', 'Booking dekorasi & bayar DP', null, 150, 'high', 'both', 3),
  ('Dekorasi', 'Approve desain pelaminan & backdrop', null, 45, 'normal', 'both', 4),
  -- Busana & Rias
  ('Busana & Rias', 'Tentukan konsep busana akad & resepsi', null, 180, 'normal', 'both', 1),
  ('Busana & Rias', 'Booking MUA', 'Cek portofolio dan tanya biaya trial.', 150, 'high', 'bride', 2),
  ('Busana & Rias', 'Fitting baju pertama', null, 90, 'normal', 'both', 3),
  ('Busana & Rias', 'Trial makeup', null, 60, 'normal', 'bride', 4),
  ('Busana & Rias', 'Fitting baju terakhir', null, 21, 'high', 'both', 5),
  ('Busana & Rias', 'Siapkan busana keluarga inti', null, 45, 'normal', 'both', 6),
  -- Dokumentasi
  ('Dokumentasi', 'Booking fotografer & videografer', null, 180, 'high', 'both', 1),
  ('Dokumentasi', 'Jadwalkan prewedding', null, 120, 'normal', 'both', 2),
  ('Dokumentasi', 'Buat shot list foto keluarga', null, 21, 'normal', 'both', 3),
  -- Mahar
  ('Mahar', 'Diskusikan bentuk & nilai mahar', null, 120, 'high', 'both', 1),
  ('Mahar', 'Beli mahar', null, 60, 'high', 'groom', 2),
  ('Mahar', 'Bingkai / kemas mahar', null, 30, 'normal', 'groom', 3),
  -- Seserahan
  ('Seserahan', 'Susun daftar isi seserahan', null, 90, 'normal', 'both', 1),
  ('Seserahan', 'Belanja seserahan', null, 45, 'normal', 'groom', 2),
  ('Seserahan', 'Booking jasa hantaran / kemas seserahan', null, 30, 'normal', 'both', 3),
  -- Undangan
  ('Undangan', 'Susun daftar tamu bersama keluarga', null, 120, 'high', 'both', 1),
  ('Undangan', 'Tentukan undangan digital dan/atau cetak', null, 90, 'normal', 'both', 2),
  ('Undangan', 'Cetak undangan fisik', null, 60, 'normal', 'both', 3),
  ('Undangan', 'Sebar undangan', null, 35, 'high', 'both', 4),
  ('Undangan', 'Follow up tamu yang belum konfirmasi', null, 14, 'normal', 'both', 5),
  -- Hiburan & Souvenir
  ('Hiburan & Souvenir', 'Booking MC', null, 120, 'normal', 'both', 1),
  ('Hiburan & Souvenir', 'Booking musik / band', null, 120, 'normal', 'both', 2),
  ('Hiburan & Souvenir', 'Pilih & pesan souvenir', null, 90, 'normal', 'bride', 3),
  ('Hiburan & Souvenir', 'Susun rundown acara', null, 30, 'high', 'both', 4),
  -- Lain-lain
  ('Lain-lain', 'Siapkan kotak angpau & buku tamu', null, 21, 'normal', 'both', 1),
  ('Lain-lain', 'Tentukan penerima tamu & among tamu', null, 21, 'normal', 'both', 2),
  ('Lain-lain', 'Siapkan seragam panitia keluarga', null, 30, 'low', 'both', 3),
  ('Lain-lain', 'Booking kamar pengantin / honeymoon', null, 60, 'low', 'both', 4)
) as v(cat, title, notes, days, priority, assignee, ord)
join public.template_checklist_categories c on c.name = v.cat;
