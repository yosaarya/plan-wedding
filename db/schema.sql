-- =============================================================================
-- plan-wedding — Skema kanonik PostgreSQL / Supabase
-- Versi 2.0 — pemakaian pribadi (dua akun, tanpa lapisan penjualan)
--
-- File ini adalah bentuk akhir skema yang diharapkan. Perubahan produksi
-- dilakukan lewat db/migrations/NNNN_*.sql (forward-only, aturan B3.6).
-- Referensi aturan: docs/04-RULES.md, docs/05-SCHEMA.md
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =============================================================================
-- 1. ENUM
-- =============================================================================

create type member_role         as enum ('owner', 'partner', 'viewer');
create type event_type          as enum ('akad','resepsi','lamaran','siraman',
                                         'midodareni','ngunduh_mantu','pengajian','lainnya');
create type task_priority       as enum ('low', 'normal', 'high');
create type assignee            as enum ('groom', 'bride', 'both');
create type party_side          as enum ('groom', 'bride', 'both');
create type rsvp_status         as enum ('pending', 'attending', 'not_attending', 'maybe');
create type invitation_status   as enum ('not_sent', 'sent', 'opened');
create type invitation_channel  as enum ('whatsapp', 'printed', 'other');
create type vendor_status       as enum ('shortlist', 'contacted', 'booked', 'rejected');
create type payment_method      as enum ('cash', 'transfer', 'ewallet', 'card', 'other');

-- =============================================================================
-- 2. UTILITAS
-- =============================================================================

-- Menjaga updated_at pada setiap UPDATE (aturan B3.3).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Token RSVP: 32 karakter acak kriptografis, bukan turunan dari id (aturan A5.10).
create or replace function public.generate_rsvp_token()
returns text language sql volatile as $$
  select translate(encode(gen_random_bytes(24), 'base64'), '+/=', 'xyz')::text
$$;

-- =============================================================================
-- 3. PROFIL
-- =============================================================================

create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  full_name         text,
  phone             text,
  avatar_url        text,
  active_wedding_id uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (lower(email));

-- =============================================================================
-- 4. PERNIKAHAN & KEANGGOTAAN
-- =============================================================================

create table public.weddings (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null references public.profiles(id) on delete cascade,
  groom_name              text not null,
  bride_name              text not null,
  groom_nickname          text,
  bride_nickname          text,
  city                    text,
  timezone                text not null default 'Asia/Jakarta',
  total_budget            bigint not null default 0 check (total_budget >= 0),
  currency                text not null default 'IDR',
  estimated_guests        int check (estimated_guests is null or estimated_guests >= 0),
  cover_image_path        text,
  invitation_url          text,
  onboarding_completed_at timestamptz,
  deleted_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index weddings_owner_idx on public.weddings (owner_id) where deleted_at is null;

alter table public.profiles
  add constraint profiles_active_wedding_fkey
  foreign key (active_wedding_id) references public.weddings(id) on delete set null;

create table public.wedding_members (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  invited_email text,
  role          member_role not null default 'partner',
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (user_id is not null or invited_email is not null)
);

create unique index wedding_members_user_key
  on public.wedding_members (wedding_id, user_id) where user_id is not null;
create unique index wedding_members_email_key
  on public.wedding_members (wedding_id, lower(invited_email)) where invited_email is not null;
create index wedding_members_user_idx on public.wedding_members (user_id);

-- =============================================================================
-- 5. FUNGSI OTORISASI (poros seluruh RLS)
-- =============================================================================

create or replace function public.is_wedding_member(p_wedding_id uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.wedding_members m
    where m.wedding_id = p_wedding_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_wedding_editor(p_wedding_id uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.wedding_members m
    where m.wedding_id = p_wedding_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'partner')
  );
$$;

create or replace function public.is_wedding_owner(p_wedding_id uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.wedding_members m
    where m.wedding_id = p_wedding_id and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- =============================================================================
-- 6. ACARA
-- =============================================================================

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references public.weddings(id) on delete cascade,
  type            event_type not null default 'akad',
  name            text not null,
  starts_at       timestamptz,
  ends_at         timestamptz,
  venue_name      text,
  venue_address   text,
  venue_maps_url  text,
  is_primary      boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Tepat satu acara utama per pernikahan; jadi acuan countdown (aturan A2.2).
create unique index events_primary_key
  on public.events (wedding_id) where is_primary;
create index events_wedding_idx on public.events (wedding_id, starts_at);

-- =============================================================================
-- 7. CHECKLIST
-- =============================================================================

create table public.checklist_categories (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name       text not null,
  icon       text,
  sort_order int not null default 0,
  is_system  boolean not null default false,   -- mis. "Dokumen KUA" (aturan A3.8)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index checklist_categories_wedding_idx
  on public.checklist_categories (wedding_id, sort_order);

create table public.checklist_items (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid not null references public.weddings(id) on delete cascade,
  category_id      uuid references public.checklist_categories(id) on delete set null,
  title            text not null,
  notes            text,
  due_date         date,
  priority         task_priority not null default 'normal',
  assigned_to      assignee not null default 'both',
  is_done          boolean not null default false,
  completed_at     timestamptz,
  expense_id       uuid,                       -- FK ditambahkan setelah tabel expenses
  template_item_id uuid,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Menopang "Tugas Bulan Ini" dan deteksi terlambat (aturan A3.4, A3.5).
create index checklist_items_due_idx on public.checklist_items (wedding_id, is_done, due_date);
create index checklist_items_category_idx on public.checklist_items (category_id);

-- =============================================================================
-- 8. ANGGARAN
-- =============================================================================

create table public.budget_categories (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid not null references public.weddings(id) on delete cascade,
  name           text not null,
  planned_amount bigint not null default 0 check (planned_amount >= 0),
  icon           text,
  color          text,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index budget_categories_wedding_idx on public.budget_categories (wedding_id, sort_order);

create table public.vendors (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  name         text not null,
  category     text,
  contact_name text,
  phone        text,
  instagram    text,
  quoted_price bigint check (quoted_price is null or quoted_price >= 0),
  status       vendor_status not null default 'shortlist',
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index vendors_wedding_idx on public.vendors (wedding_id, status);

create table public.expenses (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid not null references public.weddings(id) on delete cascade,
  category_id      uuid references public.budget_categories(id) on delete set null,
  vendor_id        uuid references public.vendors(id) on delete set null,
  title            text not null,
  amount           bigint not null default 0 check (amount >= 0),
  paid_amount      bigint not null default 0 check (paid_amount >= 0),
  transaction_date date not null default current_date,
  due_date         date,
  method           payment_method,
  receipt_path     text,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Status bayar diturunkan dari kedua kolom ini, tidak disimpan (aturan A4.5).
  constraint expenses_paid_within_amount check (paid_amount <= amount)
);

create index expenses_wedding_idx  on public.expenses (wedding_id, transaction_date desc);
create index expenses_category_idx on public.expenses (category_id);

alter table public.checklist_items
  add constraint checklist_items_expense_fkey
  foreign key (expense_id) references public.expenses(id) on delete set null;

-- =============================================================================
-- 9. TAMU, UNDANGAN & RSVP
-- =============================================================================

create table public.guest_groups (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name       text not null,
  color      text,
  side       party_side not null default 'both',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guest_groups_wedding_idx on public.guest_groups (wedding_id, sort_order);

create table public.guests (
  id                 uuid primary key default gen_random_uuid(),
  wedding_id         uuid not null references public.weddings(id) on delete cascade,
  group_id           uuid references public.guest_groups(id) on delete set null,
  name               text not null,
  phone              text,                       -- ternormalisasi 62xxx (aturan A5.4)
  address            text,
  side               party_side not null default 'both',
  headcount          int not null default 1 check (headcount >= 1),
  invitation_status  invitation_status not null default 'not_sent',
  invitation_channel invitation_channel,
  invitation_sent_at timestamptz,
  rsvp_status        rsvp_status not null default 'pending',
  attending_count    int not null default 0 check (attending_count >= 0),
  responded_at       timestamptz,
  rsvp_token         text not null unique default public.generate_rsvp_token(),
  note               text,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Jumlah yang datang tidak mungkin melebihi kepala yang diundang (aturan A5.8).
  constraint guests_attending_within_headcount check (attending_count <= headcount)
);

create index guests_wedding_idx      on public.guests (wedding_id) where deleted_at is null;
create index guests_rsvp_idx         on public.guests (wedding_id, rsvp_status) where deleted_at is null;
create index guests_invitation_idx   on public.guests (wedding_id, invitation_status) where deleted_at is null;
create index guests_group_idx        on public.guests (group_id);
create index guests_phone_idx        on public.guests (wedding_id, phone) where phone is not null;
-- Pencarian nama di daftar 300+ tamu (aturan B6.1).
create index guests_name_trgm_idx    on public.guests using gin (name gin_trgm_ops);

create table public.rsvp_responses (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references public.weddings(id) on delete cascade,
  guest_id        uuid not null references public.guests(id) on delete cascade,
  status          rsvp_status not null,
  attending_count int not null default 0 check (attending_count >= 0),
  message         text,
  source          text not null default 'public_page',  -- public_page | manual
  ip_hash         text,                                  -- hash, bukan IP mentah (aturan B4.4)
  created_at      timestamptz not null default now()
);

-- Menopang paginasi riwayat sekaligus penghitungan rate limit di submit_rsvp.
create index rsvp_responses_guest_idx on public.rsvp_responses (guest_id, created_at desc);

create table public.wishes (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  guest_id     uuid references public.guests(id) on delete set null,
  display_name text not null,
  message      text not null check (char_length(message) <= 500),
  is_hidden    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index wishes_wedding_idx on public.wishes (wedding_id, created_at desc);

-- =============================================================================
-- 10. SESERAHAN
-- =============================================================================

create table public.seserahan_items (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references public.weddings(id) on delete cascade,
  category        text not null,
  name            text not null,
  quantity        int not null default 1 check (quantity >= 1),
  estimated_price bigint check (estimated_price is null or estimated_price >= 0),
  actual_price    bigint check (actual_price is null or actual_price >= 0),
  is_purchased    boolean not null default false,
  purchased_at    timestamptz,
  tray_number     int,
  product_url     text,                            -- tautan toko, ditempel sendiri
  expense_id      uuid references public.expenses(id) on delete set null,
  note            text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index seserahan_items_wedding_idx on public.seserahan_items (wedding_id, category, sort_order);

-- =============================================================================
-- 11. PENDUKUNG
-- =============================================================================

create table public.milestones (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  title       text not null,
  target_date date,
  is_done     boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index milestones_wedding_idx on public.milestones (wedding_id, target_date);

create table public.wedding_settings (
  wedding_id             uuid primary key references public.weddings(id) on delete cascade,
  whatsapp_template      text not null default
    'Assalamualaikum, {nama} 🌸' || chr(10) || chr(10) ||
    'Dengan penuh syukur, kami {pria} & {wanita} mengundang kamu untuk hadir di hari bahagia kami pada {tanggal}.' || chr(10) || chr(10) ||
    'Detail undangan & konfirmasi kehadiran: {link}' || chr(10) || chr(10) ||
    'Merupakan kehormatan bagi kami bila kamu berkenan hadir. Terima kasih 🙏',
  reminder_email_enabled boolean not null default true,
  show_wishes_publicly   boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- =============================================================================
-- 12. TABEL TEMPLATE (global, read-only bagi pengguna)
-- =============================================================================

create table public.template_checklist_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text,
  is_system  boolean not null default false,
  sort_order int not null default 0
);

create table public.template_checklist_items (
  id                   uuid primary key default gen_random_uuid(),
  category_id          uuid not null references public.template_checklist_categories(id) on delete cascade,
  title                text not null,
  notes                text,
  days_before_wedding  int,           -- tenggat dihitung mundur dari hari-H (aturan A3.3)
  priority             task_priority not null default 'normal',
  assigned_to          assignee not null default 'both',
  sort_order           int not null default 0
);

create table public.template_budget_categories (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  icon                  text,
  default_share_percent numeric(5,2) not null default 0,
  sort_order            int not null default 0
);

create table public.template_seserahan_items (
  id              uuid primary key default gen_random_uuid(),
  category        text not null,
  name            text not null,
  estimated_price bigint,
  sort_order      int not null default 0
);

-- =============================================================================
-- 13. TRIGGER
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','weddings','wedding_members','events',
    'checklist_categories','checklist_items','budget_categories','vendors','expenses',
    'guest_groups','guests','wishes','seserahan_items',
    'milestones','wedding_settings'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- completed_at mengikuti is_done, tidak pernah diisi manual dari klien.
create or replace function public.checklist_sync_completed_at()
returns trigger language plpgsql as $$
begin
  if new.is_done and not coalesce(old.is_done, false) then
    new.completed_at := now();
  elsif not new.is_done then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger checklist_items_completed_at
  before insert or update of is_done on public.checklist_items
  for each row execute function public.checklist_sync_completed_at();

-- Batas 2 anggota penulis per pernikahan pada paket Basic (aturan A1.3).
create or replace function public.enforce_member_limit()
returns trigger language plpgsql as $$
declare n int;
begin
  select count(*) into n
  from public.wedding_members
  where wedding_id = new.wedding_id and role in ('owner', 'partner');

  if n >= 2 and new.role in ('owner', 'partner') then
    raise exception 'Paket ini hanya mendukung 2 anggota dengan hak ubah.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger wedding_members_limit
  before insert on public.wedding_members
  for each row execute function public.enforce_member_limit();

-- Membuat baris profiles setiap kali akun auth dibuat.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 14. VIEW TURUNAN
-- Semua agregasi uang & hitungan dilakukan di SQL (aturan A4.10, B6.2).
-- security_invoker = true agar view mewarisi RLS tabel dasarnya.
-- =============================================================================

create view public.checklist_category_progress
with (security_invoker = true) as
select
  c.wedding_id,
  c.id   as category_id,
  c.name,
  c.icon,
  c.sort_order,
  count(i.id)                                          as total_items,
  count(i.id) filter (where i.is_done)                 as done_items,
  case when count(i.id) = 0 then 0
       else round(100.0 * count(i.id) filter (where i.is_done) / count(i.id))
  end                                                  as progress_percent
from public.checklist_categories c
left join public.checklist_items i on i.category_id = c.id
group by c.wedding_id, c.id, c.name, c.icon, c.sort_order;

create view public.budget_category_summary
with (security_invoker = true) as
select
  b.wedding_id,
  b.id as category_id,
  b.name,
  b.icon,
  b.color,
  b.sort_order,
  b.planned_amount,
  coalesce(sum(e.amount), 0)      as spent_amount,
  coalesce(sum(e.paid_amount), 0) as paid_amount,
  case when b.planned_amount = 0 then 0
       else round(100.0 * coalesce(sum(e.amount), 0) / b.planned_amount)
  end                             as usage_percent,
  coalesce(sum(e.amount), 0) > b.planned_amount and b.planned_amount > 0 as is_over
from public.budget_categories b
left join public.expenses e on e.category_id = b.id
group by b.wedding_id, b.id, b.name, b.icon, b.color, b.sort_order, b.planned_amount;

-- Satu baris per pernikahan; beranda membacanya dalam satu round-trip.
create view public.wedding_dashboard_stats
with (security_invoker = true) as
select
  w.id as wedding_id,
  ev.starts_at as primary_event_at,
  -- Selisih hari kalender di zona waktu pernikahan, bukan selisih jam (aturan A2.3).
  case when ev.starts_at is null then null
       else (date(ev.starts_at at time zone w.timezone)
             - date(now() at time zone w.timezone))
  end as days_until_primary_event,

  (select count(*) from public.checklist_items i where i.wedding_id = w.id) as checklist_total,
  (select count(*) from public.checklist_items i where i.wedding_id = w.id and i.is_done) as checklist_done,
  (select count(*) from public.checklist_items i
     where i.wedding_id = w.id and not i.is_done
       and i.due_date < date(now() at time zone w.timezone)) as checklist_overdue,
  (select count(*) from public.checklist_items i
     where i.wedding_id = w.id and not i.is_done
       and date_trunc('month', i.due_date)
           = date_trunc('month', date(now() at time zone w.timezone))) as checklist_due_this_month,

  w.total_budget as budget_total,
  (select coalesce(sum(b.planned_amount), 0) from public.budget_categories b where b.wedding_id = w.id) as budget_planned,
  (select coalesce(sum(e.amount), 0)      from public.expenses e where e.wedding_id = w.id) as budget_spent,
  (select coalesce(sum(e.paid_amount), 0) from public.expenses e where e.wedding_id = w.id) as budget_paid,
  w.total_budget - (select coalesce(sum(e.amount), 0) from public.expenses e where e.wedding_id = w.id) as budget_remaining,

  -- "Undangan" = jumlah baris; "kepala" = jumlah headcount. Keduanya dibedakan (aturan A5.1).
  (select count(*) from public.guests g where g.wedding_id = w.id and g.deleted_at is null) as guest_invitations,
  (select coalesce(sum(g.headcount), 0) from public.guests g where g.wedding_id = w.id and g.deleted_at is null) as guest_headcount,
  -- "Hadir" dihitung sebagai jumlah orang, bukan jumlah baris (aturan A5.9).
  (select coalesce(sum(g.attending_count), 0) from public.guests g
     where g.wedding_id = w.id and g.deleted_at is null and g.rsvp_status = 'attending') as guest_attending_people,
  (select count(*) from public.guests g
     where g.wedding_id = w.id and g.deleted_at is null and g.invitation_status <> 'not_sent') as guest_invitations_sent,
  (select count(*) from public.guests g
     where g.wedding_id = w.id and g.deleted_at is null and g.rsvp_status = 'pending') as guest_pending,

  (select count(*) from public.seserahan_items s where s.wedding_id = w.id) as seserahan_total,
  (select count(*) from public.seserahan_items s where s.wedding_id = w.id and s.is_purchased) as seserahan_purchased
from public.weddings w
left join public.events ev on ev.wedding_id = w.id and ev.is_primary
where w.deleted_at is null;

-- =============================================================================
-- 15. RLS
-- Ditolak secara default; akses hanya lewat keanggotaan (aturan B3.1, B3.2).
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','weddings','wedding_members','events',
    'checklist_categories','checklist_items','budget_categories','vendors','expenses',
    'guest_groups','guests','rsvp_responses','wishes','seserahan_items','milestones',
    'wedding_settings',
    'template_checklist_categories','template_checklist_items',
    'template_budget_categories','template_seserahan_items'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Pola standar untuk seluruh tabel domain ber-wedding_id.
do $$
declare t text;
begin
  foreach t in array array[
    'events','checklist_categories','checklist_items','budget_categories','vendors',
    'expenses','guest_groups','guests','rsvp_responses','wishes','seserahan_items',
    'milestones','wedding_settings'
  ] loop
    execute format($p$
      create policy member_select on public.%I for select
        using (public.is_wedding_member(wedding_id));
      create policy editor_insert on public.%I for insert
        with check (public.is_wedding_editor(wedding_id));
      create policy editor_update on public.%I for update
        using (public.is_wedding_editor(wedding_id))
        with check (public.is_wedding_editor(wedding_id));
      create policy editor_delete on public.%I for delete
        using (public.is_wedding_editor(wedding_id));
    $p$, t, t, t, t);
  end loop;
end $$;

-- profiles: hanya diri sendiri.
create policy profiles_self_select on public.profiles for select using (id = auth.uid());
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- weddings: anggota boleh baca & ubah; hanya owner yang boleh menghapus.
create policy weddings_member_select on public.weddings for select
  using (owner_id = auth.uid() or public.is_wedding_member(id));
create policy weddings_owner_insert on public.weddings for insert
  with check (owner_id = auth.uid());
create policy weddings_editor_update on public.weddings for update
  using (public.is_wedding_editor(id)) with check (public.is_wedding_editor(id));
create policy weddings_owner_delete on public.weddings for delete
  using (public.is_wedding_owner(id));

-- wedding_members: sesama anggota boleh melihat; hanya owner yang mengundang/mencabut.
create policy members_select on public.wedding_members for select
  using (user_id = auth.uid() or public.is_wedding_member(wedding_id));
create policy members_owner_insert on public.wedding_members for insert
  with check (
    public.is_wedding_owner(wedding_members.wedding_id)
    or exists (
      select 1 from public.weddings w
      where w.id = wedding_members.wedding_id and w.owner_id = auth.uid()
    )
  );
create policy members_owner_delete on public.wedding_members for delete
  using (public.is_wedding_owner(wedding_id));

-- Tabel template & katalog: baca untuk semua pengguna terautentikasi, tulis service role.
do $$
declare t text;
begin
  foreach t in array array[
    'template_checklist_categories','template_checklist_items',
    'template_budget_categories','template_seserahan_items'
  ] loop
    execute format(
      'create policy read_all on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;

-- =============================================================================
-- 16. GRANT
-- RLS menentukan BARIS mana yang terlihat; GRANT menentukan apakah peran boleh
-- menyentuh tabelnya sama sekali. Keduanya diperlukan.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant all on tables to service_role;

-- Template bersifat read-only bagi pengguna: ia hanya bahan untuk seeding,
-- bukan data yang dipakai sehari-hari (aturan A6.2).
revoke insert, update, delete on
  public.template_checklist_categories,
  public.template_checklist_items,
  public.template_budget_categories,
  public.template_seserahan_items
from authenticated;

-- =============================================================================
-- 17. RPC PUBLIK UNTUK RSVP
-- Halaman /rsvp/[token] tidak menyentuh tabel guests secara langsung (aturan A5.11).
-- =============================================================================

create or replace function public.get_rsvp_context(p_token text)
returns jsonb language plpgsql stable security definer
set search_path = public, pg_temp as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'guest_name',       g.name,
    'headcount',        g.headcount,
    'rsvp_status',      g.rsvp_status,
    'attending_count',  g.attending_count,
    'groom_name',       w.groom_name,
    'bride_name',       w.bride_name,
    'event_name',       ev.name,
    'event_starts_at',  ev.starts_at,
    'venue_name',       ev.venue_name,
    'venue_address',    ev.venue_address,
    'venue_maps_url',   ev.venue_maps_url,
    'invitation_url',   w.invitation_url
  )
  into result
  from public.guests g
  join public.weddings w on w.id = g.wedding_id and w.deleted_at is null
  left join public.events ev on ev.wedding_id = w.id and ev.is_primary
  where g.rsvp_token = p_token and g.deleted_at is null;

  if result is null then
    raise exception 'Undangan tidak ditemukan' using errcode = 'no_data_found';
  end if;
  return result;
end;
$$;

create or replace function public.submit_rsvp(
  p_token   text,
  p_status  rsvp_status,
  p_count   int default 0,
  p_message text default null
)
returns jsonb language plpgsql volatile security definer
set search_path = public, pg_temp as $$
declare g public.guests;
        v_count int;
        v_recent int;
begin
  select * into g from public.guests
   where rsvp_token = p_token and deleted_at is null
   for update;

  if not found then
    raise exception 'Undangan tidak ditemukan' using errcode = 'no_data_found';
  end if;

  -- Rate limit ditegakkan di sini, bukan di edge middleware (aturan B4.7):
  -- middleware serverless berjalan per-instance dan kehilangan hitungannya,
  -- sehingga batas di sana mudah dilewati.
  select count(*) into v_recent
  from public.rsvp_responses
  where guest_id = g.id and created_at > now() - interval '1 minute';

  if v_recent >= 10 then
    raise exception 'Terlalu banyak percobaan. Coba lagi sebentar lagi.'
      using errcode = 'too_many_connections';
  end if;

  if p_status <> 'attending' then
    v_count := 0;
  else
    v_count := least(greatest(coalesce(p_count, 1), 1), g.headcount);
  end if;

  update public.guests
     set rsvp_status     = p_status,
         attending_count = v_count,
         responded_at    = now()
   where id = g.id;

  insert into public.rsvp_responses (wedding_id, guest_id, status, attending_count, message, source)
  values (g.wedding_id, g.id, p_status, v_count, nullif(trim(coalesce(p_message, '')), ''), 'public_page');

  if nullif(trim(coalesce(p_message, '')), '') is not null then
    insert into public.wishes (wedding_id, guest_id, display_name, message)
    values (g.wedding_id, g.id, g.name, left(trim(p_message), 500));
  end if;

  return jsonb_build_object('status', p_status, 'attending_count', v_count);
end;
$$;

revoke all on function public.get_rsvp_context(text) from public;
revoke all on function public.submit_rsvp(text, rsvp_status, int, text) from public;
grant execute on function public.get_rsvp_context(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, rsvp_status, int, text) to anon, authenticated;

-- =============================================================================
-- 18. SEEDING DEFAULT PERNIKAHAN
-- Dipanggil sekali di akhir onboarding; idempoten (aturan A3.1, §13 docs/05).
-- =============================================================================

create or replace function public.seed_wedding_defaults(p_wedding_id uuid)
returns void language plpgsql volatile security definer
set search_path = public, pg_temp as $$
declare
  v_wedding public.weddings;
  v_event_date date;
  v_cat record;
  v_new_cat_id uuid;
begin
  if not public.is_wedding_editor(p_wedding_id) then
    raise exception 'Tidak punya akses ke pernikahan ini' using errcode = 'insufficient_privilege';
  end if;

  select * into v_wedding from public.weddings where id = p_wedding_id;

  -- Idempoten: berhenti bila sudah pernah di-seed.
  if exists (select 1 from public.checklist_items where wedding_id = p_wedding_id) then
    return;
  end if;

  select date(starts_at at time zone v_wedding.timezone) into v_event_date
  from public.events where wedding_id = p_wedding_id and is_primary;

  -- Checklist
  for v_cat in
    select * from public.template_checklist_categories order by sort_order
  loop
    insert into public.checklist_categories (wedding_id, name, icon, sort_order, is_system)
    values (p_wedding_id, v_cat.name, v_cat.icon, v_cat.sort_order, v_cat.is_system)
    returning id into v_new_cat_id;

    insert into public.checklist_items
      (wedding_id, category_id, title, notes, due_date, priority, assigned_to,
       template_item_id, sort_order)
    select
      p_wedding_id, v_new_cat_id, ti.title, ti.notes,
      -- Tenggat yang sudah lewat disimpan null, bukan tanggal masa lalu (aturan A3.3).
      case
        when v_event_date is null or ti.days_before_wedding is null then null
        when v_event_date - ti.days_before_wedding < current_date then null
        else v_event_date - ti.days_before_wedding
      end,
      ti.priority, ti.assigned_to, ti.id, ti.sort_order
    from public.template_checklist_items ti
    where ti.category_id = v_cat.id
    order by ti.sort_order;
  end loop;

  -- Kategori anggaran, dialokasikan dari total budget menurut porsi default.
  insert into public.budget_categories (wedding_id, name, icon, planned_amount, sort_order)
  select
    p_wedding_id, tb.name, tb.icon,
    floor(coalesce(v_wedding.total_budget, 0) * tb.default_share_percent / 100)::bigint,
    tb.sort_order
  from public.template_budget_categories tb
  order by tb.sort_order;

  -- Seserahan
  insert into public.seserahan_items (wedding_id, category, name, estimated_price, sort_order)
  select p_wedding_id, ts.category, ts.name, ts.estimated_price, ts.sort_order
  from public.template_seserahan_items ts
  order by ts.sort_order;

  -- Pengaturan default (template pesan WhatsApp).
  insert into public.wedding_settings (wedding_id)
  values (p_wedding_id)
  on conflict (wedding_id) do nothing;
end;
$$;

revoke all on function public.seed_wedding_defaults(uuid) from public;
grant execute on function public.seed_wedding_defaults(uuid) to authenticated;
