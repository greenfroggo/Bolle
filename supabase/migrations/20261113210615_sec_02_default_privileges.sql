-- sec_02: le funzioni create in futuro (da postgres, schema public) non sono piu eseguibili da anon/PUBLIC.
-- Ogni nuova funzione va concessa esplicitamente (grant execute ... to authenticated).
-- Non tocca le funzioni esistenti.
-- ROLLBACK:
--   alter default privileges for role postgres in schema public grant execute on functions to anon, public;

alter default privileges for role postgres in schema public revoke execute on functions from anon;
alter default privileges for role postgres in schema public revoke execute on functions from public;
