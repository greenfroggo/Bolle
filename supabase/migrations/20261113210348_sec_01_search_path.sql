-- sec_01: search_path fisso sulle 3 funzioni security definer che ne erano prive.
-- ROLLBACK:
--   alter function public.bolle_set_bubble_category(uuid, text) reset search_path;
--   alter function public.bolle_set_my_category(text)           reset search_path;
--   alter function public.bolle_unblock_user(text)              reset search_path;

alter function public.bolle_set_bubble_category(uuid, text) set search_path = public;
alter function public.bolle_set_my_category(text)           set search_path = public;
alter function public.bolle_unblock_user(text)              set search_path = public;
