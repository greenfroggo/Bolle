import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const syntheticEmail = (username: string) => `${username}@accounts.bolle.invalid`;
async function ipHash(ip: string) {
  const pepper = Deno.env.get('BOLLE_RATE_LIMIT_SECRET');
  if (!pepper) throw new Error('BOLLE_RATE_LIMIT_SECRET mancante');
  const raw = new TextEncoder().encode(pepper + ':' + ip);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw))).map(x => x.toString(16).padStart(2, '0')).join('');
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405);
  try {
    const body = await req.json();
    if (body.action === 'upgrade') {
      const bearer = req.headers.get('authorization')?.replace(/^Bearer /i, '');
      if (!bearer) return json({ error: 'Sessione richiesta' }, 401);
      const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data: { user }, error } = await authClient.auth.getUser(bearer);
      if (error || !user) return json({ error: 'Sessione non valida' }, 401);
      const { data: profile, error: profileError } = await admin.from('bolle_profiles').select('username').eq('user_id', user.id).single();
      if (profileError || !profile) return json({ error: 'Registra prima lo username' }, 400);
      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { email: syntheticEmail(profile.username), email_confirm: true });
      if (updateError) return json({ error: 'Impossibile abilitare accesso multidispositivo: ' + updateError.message }, 400);
      return json({ ok: true });
    }
    if (body.action !== 'login') return json({ error: 'Azione sconosciuta' }, 400);
    const username = String(body.username || '').trim().toLowerCase();
    const pin = String(body.pin || '');
    if (!/^[a-z0-9_]{3,20}$/.test(username) || !/^\d{4}$/.test(pin)) return json({ error: 'Credenziali non valide' }, 400);
    // IP fornito dalla piattaforma, non dal corpo della richiesta.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { data: allowed, error: limitError } = await admin.rpc('bolle_login_ip_allowed', { p_hash: await ipHash(ip) });
    if (limitError || !allowed) return json({ error: 'Troppi tentativi. Riprova più tardi.' }, 429);
    const { data: uid, error: loginError } = await admin.rpc('bolle_login_attempt', { p_username: username, p_pin: pin });
    if (loginError || !uid) return json({ error: 'Username o PIN errati, oppure accesso temporaneamente bloccato.' }, 401);
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(uid);
    if (userError || userData.user?.email !== syntheticEmail(username)) return json({ error: 'Profilo non ancora abilitato per il login da altri dispositivi.' }, 409);
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: syntheticEmail(username) });
    if (linkError || !link.properties?.hashed_token) return json({ error: 'Impossibile creare la sessione.' }, 500);
    return json({ token_hash: link.properties.hashed_token });
  } catch (err) {
    console.error('bolle-auth error', err);
    return json({ error: 'Errore temporaneo del servizio.' }, 500);
  }
});
