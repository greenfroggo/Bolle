-- sec_03: elimina la policy che rendeva leggibili a anon e authenticated (compresi i 515 account anonimi)
-- author_id, lat, lng, caption, media_path di tutte le bolle. Il feed passa solo dalle RPC (security definer).
-- Resta la policy "autore legge le sue bolle".
-- ROLLBACK:
--   create policy "bolle pubbliche visibili a tutti" on public.bubbles for select to anon, authenticated
--     using ((hidden = false) and (media_deleted_at is null));

drop policy "bolle pubbliche visibili a tutti" on public.bubbles;
