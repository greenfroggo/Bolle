-- =====================================================================
-- BOLLE · schema Supabase
-- Incolla tutto nel SQL Editor di Supabase ed esegui (una sola volta).
-- Prima: Authentication → Sign In / Providers → abilita "Anonymous sign-ins".
-- =====================================================================

-- ---------- TABELLE ---------------------------------------------------

create table if not exists public.bubbles (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  media_path  text not null unique,
  media_type  text not null check (media_type in ('image', 'video')),
  caption     text check (char_length(caption) <= 140),
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists bubbles_created_idx on public.bubbles (created_at desc) where not hidden;
create index if not exists bubbles_geo_idx     on public.bubbles (lat, lng)        where not hidden;

-- Una riga per ogni bolla scoppiata da un utente. La chiave primaria
-- impedisce di scoppiare (e quindi riaprire) la stessa bolla due volte.
create table if not exists public.bubble_pops (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bubble_id  uuid not null references public.bubbles(id) on delete cascade,
  popped_at  timestamptz not null default now(),
  primary key (user_id, bubble_id)
);

create index if not exists bubble_pops_user_day_idx on public.bubble_pops (user_id, popped_at desc);

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  bubble_id    uuid not null references public.bubbles(id) on delete cascade,
  reporter_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason       text check (char_length(reason) <= 200),
  created_at   timestamptz not null default now(),
  unique (bubble_id, reporter_id)
);

-- ---------- ROW LEVEL SECURITY ----------------------------------------
-- Nessuno scrive direttamente sulle tabelle: tutto passa dalle funzioni
-- qui sotto. Gli utenti leggono solo le proprie righe; il feed pubblico
-- arriva da get_feed(), che non espone mai il percorso del file.

alter table public.bubbles      enable row level security;
alter table public.bubble_pops  enable row level security;
alter table public.reports      enable row level security;

drop policy if exists "autore legge le sue bolle" on public.bubbles;
create policy "autore legge le sue bolle" on public.bubbles
  for select to authenticated using (author_id = auth.uid());

drop policy if exists "utente legge i suoi scoppi" on public.bubble_pops;
create policy "utente legge i suoi scoppi" on public.bubble_pops
  for select to authenticated using (user_id = auth.uid());

-- ---------- FUNZIONI --------------------------------------------------

-- Bolle scoppiate oggi (il giorno cambia a mezzanotte, ora italiana).
create or replace function public.pops_today()
returns int
language sql stable security definer set search_path = ''
as $$
  select count(*)::int
  from public.bubble_pops
  where user_id = auth.uid()
    and popped_at >= (date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome');
$$;

-- Feed: tutte le bolle non ancora scoppiate da te (escluse le tue).
-- Con p_radius_km restituisce solo quelle vicine, ordinate per distanza.
create or replace function public.get_feed(
  p_lat        double precision default null,
  p_lng        double precision default null,
  p_radius_km  double precision default null,
  p_limit      int default 36
)
returns table (id uuid, media_type text, created_at timestamptz, distance_km double precision)
language sql stable security definer set search_path = ''
as $$
  select d.id, d.media_type, d.created_at, d.distance_km
  from (
    select b.id, b.media_type, b.created_at,
      case when p_lat is not null and p_lng is not null and b.lat is not null then
        6371 * 2 * asin(least(1, sqrt(
          power(sin(radians(b.lat - p_lat) / 2), 2) +
          cos(radians(p_lat)) * cos(radians(b.lat)) *
          power(sin(radians(b.lng - p_lng) / 2), 2)
        )))
      end as distance_km
    from public.bubbles b
    where not b.hidden
      and b.author_id <> auth.uid()
      and not exists (
        select 1 from public.bubble_pops p
        where p.bubble_id = b.id and p.user_id = auth.uid()
      )
  ) d
  where p_radius_km is null or d.distance_km <= p_radius_km
  order by (case when p_radius_km is not null then d.distance_km end) asc nulls last,
           d.created_at desc
  limit least(greatest(p_limit, 1), 60);
$$;

-- Scoppia una bolla: controlla il limite giornaliero (100), registra lo
-- scoppio e restituisce il contenuto. Seconda volta sulla stessa bolla = errore.
create or replace function public.pop_bubble(p_bubble_id uuid)
returns table (o_path text, o_type text, o_caption text, o_pops_today int)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_count int;
  v_b     public.bubbles;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- evita che richieste in parallelo superino il limite
  perform pg_advisory_xact_lock(hashtext(v_uid::text));

  v_count := public.pops_today();
  if v_count >= 100 then
    raise exception 'daily_limit_reached';
  end if;

  select * into v_b from public.bubbles where id = p_bubble_id and not hidden;
  if not found then
    raise exception 'bubble_not_found';
  end if;
  if v_b.author_id = v_uid then
    raise exception 'own_bubble';
  end if;

  begin
    insert into public.bubble_pops (user_id, bubble_id) values (v_uid, p_bubble_id);
  exception when unique_violation then
    raise exception 'already_popped';
  end;

  return query select v_b.media_path, v_b.media_type, v_b.caption, v_count + 1;
end;
$$;

-- Pubblica una bolla dopo aver caricato il file nello storage.
-- La posizione viene arrotondata (~1 km) per tutelare l'anonimato.
create or replace function public.create_bubble(
  p_media_path text,
  p_media_type text,
  p_caption    text default null,
  p_lat        double precision default null,
  p_lng        double precision default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if split_part(p_media_path, '/', 1) <> v_uid::text then
    raise exception 'invalid_path';
  end if;
  if (select count(*) from public.bubbles
      where author_id = v_uid and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'post_limit_reached';
  end if;

  insert into public.bubbles (author_id, media_path, media_type, caption, lat, lng)
  values (
    v_uid, p_media_path, p_media_type,
    nullif(btrim(p_caption), ''),
    case when p_lat is null or p_lng is null then null else round(p_lat::numeric, 2)::double precision end,
    case when p_lat is null or p_lng is null then null else round(p_lng::numeric, 2)::double precision end
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Segnalazione: solo chi ha scoppiato la bolla può segnalarla.
-- A 3 segnalazioni la bolla sparisce dal feed.
create or replace function public.report_bubble(p_bubble_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_n   int;
begin
  if not exists (
    select 1 from public.bubble_pops where user_id = v_uid and bubble_id = p_bubble_id
  ) then
    raise exception 'not_allowed';
  end if;

  insert into public.reports (bubble_id, reporter_id, reason)
  values (p_bubble_id, v_uid, left(p_reason, 200))
  on conflict do nothing;

  select count(*) into v_n from public.reports where bubble_id = p_bubble_id;
  if v_n >= 3 then
    update public.bubbles set hidden = true where id = p_bubble_id;
  end if;
end;
$$;

-- Può leggere il file chi l'ha caricato, oppure chi ha scoppiato la bolla
-- negli ultimi 2 minuti. Passata la finestra, la bolla non si riapre più.
create or replace function public.can_view_media(p_path text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.bubbles b
    where b.media_path = p_path
      and (
        b.author_id = auth.uid()
        or exists (
          select 1 from public.bubble_pops p
          where p.bubble_id = b.id
            and p.user_id = auth.uid()
            and p.popped_at > now() - interval '2 minutes'
        )
      )
  );
$$;

revoke execute on function
  public.pops_today(),
  public.get_feed(double precision, double precision, double precision, int),
  public.pop_bubble(uuid),
  public.create_bubble(text, text, text, double precision, double precision),
  public.report_bubble(uuid, text),
  public.can_view_media(text)
from public, anon;

grant execute on function
  public.pops_today(),
  public.get_feed(double precision, double precision, double precision, int),
  public.pop_bubble(uuid),
  public.create_bubble(text, text, text, double precision, double precision),
  public.report_bubble(uuid, text),
  public.can_view_media(text)
to authenticated;

-- ---------- STORAGE ---------------------------------------------------
-- Bucket privato: i file non hanno URL pubblico, si leggono solo con
-- un URL firmato e solo se can_view_media() lo permette.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bubbles', 'bubbles', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bolle: carica nella tua cartella" on storage.objects;
create policy "bolle: carica nella tua cartella" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bubbles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "bolle: elimina i tuoi file" on storage.objects;
create policy "bolle: elimina i tuoi file" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bubbles' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "bolle: leggi solo se scoppiata da poco" on storage.objects;
create policy "bolle: leggi solo se scoppiata da poco" on storage.objects
  for select to authenticated
  using (bucket_id = 'bubbles' and public.can_view_media(name));
