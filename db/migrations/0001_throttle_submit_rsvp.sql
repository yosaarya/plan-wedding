-- Membatasi laju submit_rsvp (aturan B4.7).
--
-- Halaman RSVP adalah satu-satunya endpoint yang terbuka untuk publik. Tanpa
-- batas, siapa pun yang punya satu tautan tamu bisa membanjiri rsvp_responses
-- dan wishes.
--
-- Batasnya ditegakkan DI DALAM database, bukan di edge middleware: middleware
-- pada hosting serverless berjalan per-instance dan kehilangan hitungannya
-- setiap instance baru dibuat, sehingga batas di sana mudah dilewati hanya
-- dengan mengirim permintaan berturut-turut.
--
-- Angka 10 per menit per tamu longgar untuk orang yang berubah pikiran
-- beberapa kali, tapi menutup banjir permintaan otomatis.

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

-- Menopang penghitungan di atas.
create index if not exists rsvp_responses_recent_idx
  on public.rsvp_responses (guest_id, created_at desc);
