-- Kategori anggaran default. default_share_percent dipakai untuk mengalokasikan
-- total_budget saat onboarding (lihat public.seed_wedding_defaults).
-- Total = 100.00.

insert into public.template_budget_categories (name, icon, default_share_percent, sort_order) values
  ('Venue & Sewa Gedung',  'map-pin',   20.00, 1),
  ('Katering',             'utensils',  25.00, 2),
  ('Dekorasi',             'flower',    12.00, 3),
  ('Dokumentasi',          'camera',    10.00, 4),
  ('Busana & Rias',        'shirt',      8.00, 5),
  ('Mahar & Seserahan',    'gift',       6.00, 6),
  ('Hiburan & MC',         'music',      5.00, 7),
  ('Souvenir',             'package',    4.00, 8),
  ('Undangan',             'mail',       3.00, 9),
  ('Administrasi & KUA',   'file-text',  2.00, 10),
  ('Cadangan',             'wallet',     5.00, 11);
