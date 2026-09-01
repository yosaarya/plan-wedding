#!/usr/bin/env bash
# Menjalankan tes isolasi RLS terhadap database bersih.
#
#   ./tests/rls/run.sh                     # pakai PGHOST/PGPORT/PGUSER dari environment
#   PGHOST=... PGPORT=... ./tests/rls/run.sh
#
# Tes memakai UUID tetap agar asersi mudah dibaca, jadi ia TIDAK idempoten:
# runner ini selalu membangun ulang database dari nol.

set -euo pipefail

DB="${TEST_DB:-plan_wedding_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> Membangun ulang database '$DB'"
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB"

echo "==> Memasang stub Supabase (auth.users, auth.uid, peran)"
psql -q -d "$DB" -v ON_ERROR_STOP=1 <<'SQL'
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb
);
create or replace function auth.uid() returns uuid language sql stable as
  $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
grant usage on schema auth to anon, authenticated, service_role;
SQL

echo "==> Memuat db/schema.sql"
psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/db/schema.sql"

echo "==> Memuat db/seeds/"
for f in "$ROOT"/db/seeds/*.sql; do
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f"
done

echo "==> Menjalankan asersi"
# `set -e` akan mematikan skrip pada psql yang gagal sebelum sempat mencetak
# apa pun, sehingga kegagalan asersi jadi tak terlihat. Tangkap dulu, laporkan
# sesudahnya.
set +e
out=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/tests/rls/isolation.sql" 2>&1)
psql_status=$?
set -e

echo "$out" | sed 's/^psql:[^ ]* NOTICE:  //'

passed=$(grep -c 'PASS  ' <<<"$out" || true)
if [ "$psql_status" -ne 0 ] || grep -qE 'FAIL |ERROR:' <<<"$out"; then
  echo ""
  echo "HASIL: GAGAL ($passed asersi lulus sebelum kegagalan)"
  exit 1
fi

echo ""
echo "HASIL: LULUS — $passed asersi"
