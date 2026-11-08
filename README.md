# bolle

Social network anonimo fatto di bolle di sapone: scoppi una bolla per vedere la foto o il video. React + Vite, Supabase, Vercel.

## 1. Supabase
1. Crea un progetto su supabase.com.
2. Authentication → Sign In / Providers → abilita **Anonymous sign-ins**.
3. SQL Editor → incolla il contenuto di `supabase/bolle.sql` → Run.
4. Project Settings → API: copia URL e chiave anon/publishable.
5. Consigliato: Authentication → abilita il CAPTCHA (gli account anonimi sono gratis da creare).

## 2. In locale (Cursor)
```
npm install
cp .env.example .env.local     # poi inserisci URL e chiave
npm run dev
```
Per provare "Vicino a me" serve il browser su localhost o https.

## 3. Deploy su Vercel
1. Carica la cartella su un repository GitHub, poi su vercel.com → Add New Project → importa il repo.
2. Environment Variables: aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Deploy.

## Regole dell'app
- 100 bolle scoppiabili al giorno per utente (reset a mezzanotte, ora italiana), controllo lato server.
- Una bolla scoppiata non si riapre: il file è leggibile per 2 minuti dopo lo scoppio (`can_view_media` in `bolle.sql`).
- Posizione salvata arrotondata a circa 1 km, solo se l'utente sceglie di condividerla.
- 3 segnalazioni nascondono la bolla dal feed.
