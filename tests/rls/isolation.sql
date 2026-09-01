-- =============================================================================
-- Tes isolasi data & alur fungsional (aturan B5.2, B5.3)
--
-- Membuktikan: pengguna pernikahan A tidak dapat MEMBACA maupun MENULIS baris
-- milik pernikahan B, dan alur inti (seed → tamu → RSVP publik → statistik)
-- bekerja apa adanya.
--
-- Jalankan terhadap database yang sudah memuat db/schema.sql + db/seeds/*.sql:
--   psql -d wed -v ON_ERROR_STOP=1 -f tests/rls/isolation.sql
-- Keluar dengan error pada asersi pertama yang gagal.
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET on
\pset tuples_only on

create or replace function pg_temp.assert(p_condition boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_condition then
    raise notice 'PASS  %', p_label;
  else
    raise exception 'FAIL  %', p_label;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Persiapan: dua pengguna independen
-- -----------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'agus@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'budi@example.com');

do $$ begin perform pg_temp.assert(
  (select count(*) from public.profiles) = 2,
  'trigger on_auth_user_created membuat profil untuk tiap user auth'); end $$;

-- Entitlement dibuat lebih dulu oleh webhook, lalu ditautkan saat user muncul.
insert into public.entitlements (email, provider, external_order_id, product_code, amount)
values ('agus@example.com', 'lynk', 'ORDER-001', 'basic', 29000);

-- Idempotensi webhook (aturan A1.6): order id sama tidak boleh menggandakan hak.
do $$
begin
  begin
    insert into public.entitlements (email, provider, external_order_id, product_code, amount)
    values ('agus@example.com', 'lynk', 'ORDER-001', 'basic', 29000);
    perform pg_temp.assert(false, 'order duplikat seharusnya ditolak');
  exception when unique_violation then
    perform pg_temp.assert(true, 'A1.6 order duplikat ditolak unique constraint');
  end;
end $$;

-- -----------------------------------------------------------------------------
-- PENGGUNA A membangun pernikahannya
-- -----------------------------------------------------------------------------
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.weddings (id, owner_id, groom_name, bride_name, city, total_budget, estimated_guests)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'Agus', 'Siti', 'Sukabumi', 125000000, 300);

insert into public.wedding_members (wedding_id, user_id, role, accepted_at)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', 'owner', now());

insert into public.events (wedding_id, type, name, starts_at, venue_name, is_primary)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'akad', 'Akad Nikah',
        (now() + interval '103 days'), 'Masjid Agung Sukabumi', true);

do $$ begin perform pg_temp.assert(
  (select count(*) from public.weddings) = 1,
  'A dapat membaca pernikahannya sendiri'); end $$;

-- Tepat satu acara utama per pernikahan (aturan A2.2)
do $$
begin
  begin
    insert into public.events (wedding_id, type, name, starts_at, is_primary)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'resepsi', 'Resepsi', now(), true);
    perform pg_temp.assert(false, 'acara utama kedua seharusnya ditolak');
  exception when unique_violation then
    perform pg_temp.assert(true, 'A2.2 hanya satu acara utama per pernikahan');
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Seeding template
-- -----------------------------------------------------------------------------
select public.seed_wedding_defaults('aaaaaaaa-0000-0000-0000-000000000001');

do $$ begin
  perform pg_temp.assert(
    (select count(*) from public.checklist_categories) = 11,
    'seed membuat 11 kategori checklist');
  perform pg_temp.assert(
    (select count(*) from public.checklist_items) = 49,
    'seed membuat 49 item checklist');
  perform pg_temp.assert(
    (select count(*) from public.seserahan_items) = 32,
    'seed membuat 32 item seserahan');
  -- Alokasi kategori = 100% dari total budget
  perform pg_temp.assert(
    (select sum(planned_amount) from public.budget_categories) = 125000000,
    'A4.9 alokasi kategori menjumlah tepat ke total budget');
  -- Tenggat yang jatuh di masa lalu disimpan null, bukan tanggal lampau
  perform pg_temp.assert(
    (select count(*) from public.checklist_items where due_date < current_date) = 0,
    'A3.3 tidak ada tenggat di masa lalu hasil seeding');
  perform pg_temp.assert(
    (select count(*) from public.checklist_items where due_date is null) > 0,
    'A3.3 item yang tenggatnya sudah lewat diberi due_date null');
end $$;

-- Idempoten: pemanggilan kedua tidak menggandakan apa pun (aturan A3.1)
select public.seed_wedding_defaults('aaaaaaaa-0000-0000-0000-000000000001');
do $$ begin perform pg_temp.assert(
  (select count(*) from public.checklist_items) = 49,
  'A3.1 seed_wedding_defaults idempoten'); end $$;

-- completed_at diisi trigger, bukan klien
update public.checklist_items set is_done = true
where id in (select id from public.checklist_items limit 5);

do $$ begin
  perform pg_temp.assert(
    (select count(*) from public.checklist_items where is_done and completed_at is not null) = 5,
    'trigger mengisi completed_at saat item diselesaikan');
  update public.checklist_items set is_done = false where is_done;
  perform pg_temp.assert(
    (select count(*) from public.checklist_items where completed_at is not null) = 0,
    'trigger mengosongkan completed_at saat item dibatalkan');
end $$;

-- -----------------------------------------------------------------------------
-- Anggaran
-- -----------------------------------------------------------------------------
insert into public.expenses (wedding_id, category_id, title, amount, paid_amount, method)
select 'aaaaaaaa-0000-0000-0000-000000000001', id, 'DP Gedung', 30000000, 10000000, 'transfer'
from public.budget_categories where name = 'Venue & Sewa Gedung';

do $$
begin
  begin
    insert into public.expenses (wedding_id, title, amount, paid_amount)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'Salah input', 1000000, 5000000);
    perform pg_temp.assert(false, 'paid_amount > amount seharusnya ditolak');
  exception when check_violation then
    perform pg_temp.assert(true, 'A4.4 paid_amount tidak boleh melebihi amount');
  end;
  begin
    insert into public.expenses (wedding_id, title, amount)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'Nominal minus', -500);
    perform pg_temp.assert(false, 'nominal negatif seharusnya ditolak');
  exception when check_violation then
    perform pg_temp.assert(true, 'A4.2 nominal tidak boleh negatif');
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Tamu & RSVP
-- -----------------------------------------------------------------------------
insert into public.guest_groups (id, wedding_id, name, side)
values ('bbbbbbbb-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001', 'Keluarga', 'groom');

insert into public.guests (wedding_id, group_id, name, phone, headcount)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
        'Panji', '628123456789', 2),
       ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
        'Sindy PA', '628987654321', 3),
       ('aaaaaaaa-0000-0000-0000-000000000001', null, 'Acos', null, 1);

do $$ begin
  perform pg_temp.assert(
    (select count(*) from public.guests where length(rsvp_token) = 32) = 3,
    'A5.10 setiap tamu otomatis mendapat token RSVP 32 karakter');
  perform pg_temp.assert(
    (select count(distinct rsvp_token) from public.guests) = 3,
    'A5.10 token RSVP unik antar tamu');
end $$;

do $$
begin
  begin
    update public.guests set rsvp_status = 'attending', attending_count = 99
    where name = 'Panji';
    perform pg_temp.assert(false, 'attending_count > headcount seharusnya ditolak');
  exception when check_violation then
    perform pg_temp.assert(true, 'A5.8 attending_count tidak boleh melebihi headcount');
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Halaman RSVP publik: peran anon, tanpa sesi
-- -----------------------------------------------------------------------------
select rsvp_token as tok from public.guests where name = 'Panji' \gset

reset role;
set role anon;
set request.jwt.claim.sub = '';

do $$ begin perform pg_temp.assert(
  (select count(*) from public.guests) = 0,
  'A5.11 anon tidak dapat membaca tabel guests secara langsung'); end $$;

select public.submit_rsvp(:'tok', 'attending', 2, 'Selamat ya, semoga samawa!');

do $$
begin
  -- Token palsu tidak boleh membocorkan apa pun
  begin
    perform public.get_rsvp_context('token-palsu-yang-tidak-ada-sama-sekali');
    perform pg_temp.assert(false, 'token palsu seharusnya ditolak');
  exception when no_data_found then
    perform pg_temp.assert(true, 'A5.11 token RSVP tidak valid ditolak');
  end;
end $$;

set test.tok = :'tok';

do $$
declare ctx jsonb;
begin
  ctx := public.get_rsvp_context(current_setting('test.tok'));

  perform pg_temp.assert(ctx ->> 'guest_name' = 'Panji',
    'get_rsvp_context mengembalikan nama tamu yang benar');
  perform pg_temp.assert(ctx ->> 'groom_name' = 'Agus' and ctx ->> 'bride_name' = 'Siti',
    'get_rsvp_context mengembalikan nama pengantin');
  perform pg_temp.assert((ctx ->> 'attending_count')::int = 2,
    'get_rsvp_context mengembalikan jawaban RSVP terakhir');

  -- Yang TIDAK boleh bocor ke halaman publik (aturan A5.11).
  perform pg_temp.assert(not (ctx ? 'phone'),
    'A5.11 nomor HP tamu tidak bocor ke halaman RSVP publik');
  perform pg_temp.assert(not (ctx ? 'id') and not (ctx ? 'wedding_id'),
    'A5.11 id internal tidak bocor ke halaman RSVP publik');
  perform pg_temp.assert(
    not (ctx::text ilike '%Sindy%') and not (ctx::text ilike '%Acos%'),
    'A5.11 daftar tamu lain tidak bocor ke halaman RSVP publik');
  perform pg_temp.assert(not (ctx::text ilike '%budget%') and not (ctx::text ilike '%125000000%'),
    'A5.11 data anggaran tidak bocor ke halaman RSVP publik');
end $$;

-- Batas atas jumlah hadir ditegakkan di dalam RPC, bukan dipercaya dari klien
select public.submit_rsvp(:'tok', 'attending', 999, null);

reset role;
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$ begin
  perform pg_temp.assert(
    (select attending_count from public.guests where name = 'Panji') = 2,
    'A5.8 submit_rsvp membatasi attending_count ke headcount tamu');
  perform pg_temp.assert(
    (select count(*) from public.rsvp_responses) = 2,
    'A5.12 setiap jawaban RSVP tercatat di riwayat');
  perform pg_temp.assert(
    (select count(*) from public.wishes) = 1,
    'ucapan tersimpan hanya bila pesan diisi');
end $$;

-- -----------------------------------------------------------------------------
-- View dashboard
-- -----------------------------------------------------------------------------
do $$
declare s record;
begin
  select * into s from public.wedding_dashboard_stats;
  perform pg_temp.assert(s.days_until_primary_event = 103,
    'A2.3 countdown = selisih hari kalender (103 hari)');
  -- 2 + 3 + 1 = 6 kepala dari 3 undangan (aturan A5.1)
  perform pg_temp.assert(s.guest_headcount = 6,   'A5.1 guest_headcount menghitung kepala');
  perform pg_temp.assert(s.guest_invitations = 3, 'A5.1 guest_invitations menghitung undangan');
  -- "hadir" = jumlah orang, bukan jumlah baris (aturan A5.9)
  perform pg_temp.assert(s.guest_attending_people = 2, 'A5.9 hadir dihitung sebagai jumlah orang');
  perform pg_temp.assert(s.guest_pending = 2,     'sisa tamu tetap pending');
  -- terpakai vs terbayar dibedakan (aturan A4.3)
  perform pg_temp.assert(s.budget_spent = 30000000, 'A4.3 budget_spent = total biaya');
  perform pg_temp.assert(s.budget_paid  = 10000000, 'A4.3 budget_paid = yang sudah dibayar');
  perform pg_temp.assert(s.budget_remaining = 95000000, 'A4.6 sisa budget = total - terpakai');
end $$;

-- -----------------------------------------------------------------------------
-- ISOLASI: PENGGUNA B tidak boleh menyentuh apa pun milik A
-- -----------------------------------------------------------------------------
reset role;
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare t text;
        n bigint;
begin
  -- B belum punya pernikahan sama sekali: setiap tabel domain harus kosong baginya.
  foreach t in array array[
    'weddings','events','checklist_categories','checklist_items','budget_categories',
    'vendors','expenses','guest_groups','guests','rsvp_responses','wishes',
    'seserahan_items','milestones','wedding_settings'
  ] loop
    execute format('select count(*) from public.%I', t) into n;
    perform pg_temp.assert(n = 0, format('B5.2 BACA: %s tidak terlihat oleh pengguna lain', t));
  end loop;

  perform pg_temp.assert(
    (select count(*) from public.wedding_dashboard_stats) = 0,
    'B5.2 BACA: view dashboard tidak membocorkan pernikahan lain');
  perform pg_temp.assert(
    (select count(*) from public.entitlements) = 0,
    'A1.x entitlement pengguna lain tidak terlihat');
  perform pg_temp.assert(
    (select count(*) from public.profiles) = 1,
    'profil pengguna lain tidak terlihat');
end $$;

do $$
declare affected int;
begin
  -- TULIS: update dan delete harus menyentuh 0 baris (bukan error, tapi juga bukan efek).
  update public.guests set name = 'DIRETAS';
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'B5.2 TULIS: update tamu pernikahan lain tidak berefek');

  delete from public.checklist_items;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'B5.2 TULIS: delete checklist pernikahan lain tidak berefek');

  update public.weddings set total_budget = 0;
  get diagnostics affected = row_count;
  perform pg_temp.assert(affected = 0, 'B5.2 TULIS: update pernikahan lain tidak berefek');
end $$;

do $$
begin
  -- INSERT ke pernikahan orang lain harus ditolak policy.
  begin
    insert into public.guests (wedding_id, name)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'Tamu Selundupan');
    perform pg_temp.assert(false, 'insert ke pernikahan lain seharusnya ditolak');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'B5.2 TULIS: insert ke pernikahan lain ditolak RLS');
  end;

  -- Menyelinap jadi anggota pernikahan orang lain harus ditolak.
  begin
    insert into public.wedding_members (wedding_id, user_id, role)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
            '22222222-2222-2222-2222-222222222222', 'owner');
    perform pg_temp.assert(false, 'menambahkan diri ke pernikahan lain seharusnya ditolak');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'B5.2 TULIS: tidak bisa menambahkan diri sebagai anggota pernikahan lain');
  end;

  -- Seeding pernikahan orang lain harus ditolak.
  begin
    perform public.seed_wedding_defaults('aaaaaaaa-0000-0000-0000-000000000001');
    perform pg_temp.assert(false, 'seeding pernikahan lain seharusnya ditolak');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'B5.2 seed_wedding_defaults menolak non-anggota');
  end;

  -- Katalog & template read-only bagi pengguna (aturan A6.2).
  begin
    insert into public.product_catalog (name, category) values ('Produk Palsu', 'Skincare');
    perform pg_temp.assert(false, 'menulis katalog produk seharusnya ditolak');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'A6.2 katalog produk read-only bagi pengguna');
  end;

  -- Log webhook tidak boleh terbaca pengguna (aturan B4.3).
  begin
    perform count(*) from public.webhook_events;
    perform pg_temp.assert(false, 'membaca webhook_events seharusnya ditolak');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'B4.3 webhook_events hanya untuk service role');
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Batas 2 anggota penulis (aturan A1.3)
-- -----------------------------------------------------------------------------
reset role;
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.wedding_members (wedding_id, user_id, role, accepted_at)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222', 'partner', now());

do $$
begin
  begin
    insert into public.wedding_members (wedding_id, invited_email, role)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'orang.ketiga@example.com', 'partner');
    perform pg_temp.assert(false, 'anggota penulis ketiga seharusnya ditolak');
  exception when check_violation then
    perform pg_temp.assert(true, 'A1.3 paket Basic dibatasi 2 anggota dengan hak ubah');
  end;
end $$;

-- Setelah diundang, B kini melihat data pernikahan A — dan hanya itu.
reset role;
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$ begin
  perform pg_temp.assert(
    (select count(*) from public.guests) = 3,
    'anggota yang diundang dapat melihat daftar tamu');
  perform pg_temp.assert(
    (select count(*) from public.weddings) = 1,
    'anggota yang diundang melihat tepat satu pernikahan');
end $$;

reset role;
\echo ''
\echo '================================================'
\echo ' SELURUH ASERSI LULUS'
\echo '================================================'
