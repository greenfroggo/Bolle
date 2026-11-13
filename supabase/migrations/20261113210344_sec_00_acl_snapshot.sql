-- sec_00: snapshot dei permessi attuali (funzioni e tabelle di public) in ops.acl_snapshot.
-- Serve per il rollback delle migrazioni sec_*: basta rieseguire gli statement salvati.
--
-- ROLLBACK DEI PERMESSI (ripristina tutto quello che le migrazioni sec_* hanno revocato):
--   do $$ declare r record; begin
--     for r in select stmt from ops.acl_snapshot where label = 'sec_00' order by id loop
--       execute r.stmt;
--     end loop; end $$;
--   (la riga 'create policy' fallisce se la policy esiste gia': e' normale, ignorala)
--
-- ROLLBACK DI QUESTA MIGRAZIONE: drop table ops.acl_snapshot; drop schema ops;

create schema if not exists ops;
revoke all on schema ops from public, anon, authenticated;
create table if not exists ops.acl_snapshot (
  id bigserial primary key, taken_at timestamptz not null default now(),
  label text not null, stmt text not null);
alter table ops.acl_snapshot enable row level security;
revoke all on ops.acl_snapshot from public, anon, authenticated;

insert into ops.acl_snapshot(label, stmt)
select 'sec_00', format('grant execute on function public.%I(%s) to %s;', p.proname,
       pg_get_function_identity_arguments(p.oid), r.rn)
from pg_proc p cross join (values ('anon'),('authenticated'),('service_role')) r(rn)
where p.pronamespace='public'::regnamespace and p.prokind='f'
  and has_function_privilege(r.rn, p.oid, 'execute');
insert into ops.acl_snapshot(label, stmt)
select 'sec_00', format('grant execute on function public.%I(%s) to public;', p.proname, pg_get_function_identity_arguments(p.oid))
from pg_proc p where p.pronamespace='public'::regnamespace and p.prokind='f'
  and (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE'));
insert into ops.acl_snapshot(label, stmt)
select 'sec_00', format('grant %s on table public.%I to %s;', string_agg(pr.priv, ', '), c.relname, r.rn)
from pg_class c cross join (values ('anon'),('authenticated')) r(rn)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) pr(priv)
where c.relnamespace='public'::regnamespace and c.relkind in ('r','p') and has_table_privilege(r.rn, c.oid, pr.priv)
group by c.relname, r.rn;
insert into ops.acl_snapshot(label, stmt)
select 'sec_00', 'create policy "bolle pubbliche visibili a tutti" on public.bubbles for select to anon, authenticated using ((hidden = false) and (media_deleted_at is null));';
