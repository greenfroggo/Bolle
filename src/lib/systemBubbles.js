/* BOLLE DI SISTEMA — contenuti generati dalla piattaforma per tenere vivo il feed.
   Ogni giorno (fuso Europe/Rome) cambia l'insieme di bolle proposte:
   • curiosità, aforismi e frasi motivazionali ruotano da un archivio fisso, senza ripetizioni finché l'archivio non è esaurito;
   • le notizie sono recuperate da feed RSS pubblici (solo titolo + fonte + link all'articolo originale).
   Il modulo non dipende da React né da Supabase. */

   export const SYSTEM_CATEGORIES = {
    curiosita:   { id: "curiosita",   label: "Curiosità",   icon: "💡" },
    aforisma:    { id: "aforisma",    label: "Aforisma",    icon: "📜" },
    motivazione: { id: "motivazione", label: "Motivazione", icon: "🔥" },
    notizia:     { id: "notizia",     label: "Notizia",     icon: "📰" },
  };
  
  /* Quante bolle di sistema compaiono ogni giorno per categoria. */
  export const SYSTEM_DAILY_COUNTS = { curiosita: 6, aforisma: 5, motivazione: 5, notizia: 4 };
  
  /* ---------- Archivio ---------- */
  const CURIOSITIES = [
    ["🐙", "I polpi hanno tre cuori: due per le branchie e uno per il resto del corpo."],
    ["🍯", "Il miele ben conservato non va praticamente mai a male."],
    ["🍌", "Per i botanici le banane sono bacche, mentre le fragole non lo sono."],
    ["🪐", "Su Venere un giorno dura più di un anno venusiano."],
    ["🗼", "Con il caldo estivo la Torre Eiffel si dilata e “cresce” di qualche centimetro."],
    ["🦒", "Le giraffe hanno sette vertebre nel collo, come noi: solo molto più lunghe."],
    ["🦈", "Gli squali esistono da prima della comparsa degli alberi."],
    ["⚡", "Un fulmine può raggiungere una temperatura più alta di quella della superficie del Sole."],
    ["🌙", "La Luna mostra alla Terra sempre la stessa faccia."],
    ["☀️", "Il Sole contiene circa il 99,8% di tutta la massa del Sistema Solare."],
    ["🧠", "Il cervello umano consuma circa un quinto dell'energia del corpo."],
    ["🎋", "Alcune specie di bambù possono crescere di quasi un metro in un solo giorno."],
    ["🔬", "I tardigradi, minuscoli animali acquatici, sono sopravvissuti anche nello spazio aperto."],
    ["🏜️", "Qualche migliaio di anni fa il Sahara era in gran parte verde, con laghi e savana."],
    ["👋", "“Ciao” viene dal veneziano “s-ciào vostro”, cioè “sono vostro schiavo”."],
    ["🦦", "Le lontre marine a volte dormono avvolte nelle alghe per non allontanarsi dalla corrente."],
    ["🔇", "Il suono non viaggia nel vuoto: nello spazio c'è silenzio."],
    ["🧬", "Due persone qualsiasi condividono circa il 99,9% del loro DNA."],
    ["🌠", "Le stelle cadenti sono quasi sempre granelli di polvere grandi come un chicco di sabbia."],
    ["🐕", "L'impronta del naso di ogni cane è unica, come le impronte delle nostre dita."],
    ["🐨", "I koala hanno impronte digitali quasi indistinguibili da quelle umane."],
    ["🌊", "Gli oceani coprono circa il 71% della superficie della Terra."],
    ["☁️", "Una nuvola cumulo può pesare centinaia di tonnellate: l'acqua resta sospesa nell'aria."],
    ["🌳", "Gli alberi di una foresta possono scambiarsi sostanze attraverso reti di funghi nel suolo."],
    ["🦎", "I gechi camminano sui muri grazie a forze microscopiche tra le molecole."],
    ["🏛️", "Il Colosseo poteva ospitare decine di migliaia di spettatori."],
    ["🇮🇹", "L'Italia è tra i paesi con più siti Patrimonio dell'Umanità UNESCO al mondo."],
    ["🏔️", "L'Everest continua a crescere di qualche millimetro ogni anno."],
    ["🐝", "Le api comunicano tra loro anche attraverso una danza."],
    ["🦋", "Le farfalle assaggiano il mondo con le zampe."],
    ["☀️", "La luce del Sole impiega circa 8 minuti per raggiungere la Terra."],
    ["🐜", "Una formica può sollevare un peso decine di volte superiore al proprio."],
    ["🔥", "Il pianeta più caldo del Sistema Solare è Venere, non Mercurio."],
    ["🧊", "La maggior parte del ghiaccio della Terra si trova in Antartide."],
    ["🐋", "La balenottera azzurra è tra i più grandi animali mai vissuti sul pianeta."],
    ["⛈️", "Il tuono è il rumore dell'aria che si espande all'improvviso attorno al fulmine."],
    ["🦴", "Alla nascita abbiamo molte più ossa di un adulto: crescendo, alcune si fondono."],
    ["🌌", "Gran parte degli elementi che formano il tuo corpo è stata prodotta dalle stelle."],
    ["🌍", "Centinaia di milioni di anni fa le giornate sulla Terra duravano meno di 24 ore."],
    ["⭐", "Le stelle che guardi di notte sono luce partita da loro molto tempo fa."],
  ];
  
  const APHORISMS = [
    ["Non è perché le cose sono difficili che non osiamo; è perché non osiamo che sono difficili.", "Seneca"],
    ["Mentre rimandiamo, la vita passa.", "Seneca"],
    ["Non c'è vento favorevole per il marinaio che non sa dove andare.", "Seneca"],
    ["La vita, se sai usarla, è lunga.", "Seneca"],
    ["Il viaggio di mille miglia comincia con il primo passo.", "Lao Tzu"],
    ["Chi conosce gli altri è sapiente; chi conosce se stesso è illuminato.", "Lao Tzu"],
    ["Fatti non foste a viver come bruti, ma per seguir virtute e canoscenza.", "Dante Alighieri"],
    ["Una vita senza ricerca non è degna di essere vissuta.", "Socrate"],
    ["L'anima si tinge del colore dei suoi pensieri.", "Marco Aurelio"],
    ["Non sono le cose a turbare gli uomini, ma i giudizi che essi formulano sulle cose.", "Epitteto"],
    ["Nessun uomo può bagnarsi due volte nello stesso fiume.", "Eraclito"],
    ["Finché c'è vita c'è speranza.", "Cicerone"],
    ["Sono un uomo: nulla di ciò che è umano mi è estraneo.", "Terenzio"],
    ["Cogli l'attimo.", "Orazio"],
    ["La fortuna aiuta gli audaci.", "Virgilio"],
    ["Mente sana in corpo sano.", "Giovenale"],
    ["Istruitevi, perché avremo bisogno di tutta la nostra intelligenza.", "Antonio Gramsci"],
    ["Aiutami a fare da solo.", "Maria Montessori"],
    ["I care: mi importa, mi sta a cuore.", "Don Lorenzo Milani"],
    ["L'essenziale è invisibile agli occhi.", "Antoine de Saint-Exupéry"],
    ["Possiamo resistere a tutto, tranne che alle tentazioni.", "Oscar Wilde"],
    ["Del senno di poi ne son piene le fosse.", "Alessandro Manzoni"],
    ["Chi ha un perché abbastanza forte può sopportare quasi ogni come.", "Friedrich Nietzsche"],
    ["Il coraggio è sapere ciò che non si deve temere.", "Platone"],
    ["Chi apre una porta di scuola, chiude una prigione.", "Victor Hugo"],
    ["La speranza è il sogno dell'uomo desto.", "Aristotele"],
    ["Come una giornata ben spesa dà lieto dormire, così una vita ben usata dà lieto morire.", "Leonardo da Vinci"],
    ["Conosci te stesso.", "Iscrizione del tempio di Apollo a Delfi"],
    ["Chi va piano va sano e va lontano.", "Proverbio"],
    ["Roma non fu costruita in un giorno.", "Proverbio"],
    ["Una rondine non fa primavera.", "Proverbio"],
    ["Chi non risica non rosica.", "Proverbio"],
    ["L'appetito vien mangiando.", "Proverbio"],
    ["Meglio tardi che mai.", "Proverbio"],
  ];
  
  const MOTIVATIONS = [
    "Oggi non devi fare tutto. Basta il prossimo piccolo passo.",
    "I progressi lenti sono comunque progressi.",
    "Sei più vicino di quanto pensi a ciò che stai cercando.",
    "Un giorno storto non cancella tutto quello che hai costruito.",
    "Inizia da dove sei, con quello che hai.",
    "Chiedere aiuto è un modo di essere forti.",
    "Respira. Hai superato tutti i tuoi giorni più difficili, finora.",
    "Non devi essere perfetto per essere prezioso.",
    "Anche una piccola luce cambia l'aspetto di una stanza.",
    "Fai oggi una cosa di cui il te di domani ti ringrazierà.",
    "La costanza batte l'entusiasmo del primo giorno.",
    "Riposare fa parte del cammino, non è una resa.",
    "Le tue idee meritano di essere provate, non solo pensate.",
    "Ogni “non ci riesco” può diventare un “non ci riesco ancora”.",
    "Sii gentile con te stesso: stai facendo del tuo meglio.",
    "Anche i grandi cambiamenti iniziano con una piccola decisione.",
    "Non paragonare il tuo capitolo uno al capitolo venti di qualcun altro.",
    "Un errore è la prova che ci hai provato.",
    "Quello che oggi sembra enorme, tra un anno sarà solo un ricordo.",
    "Scegli una cosa bella da fare entro stasera.",
    "Hai il diritto di cambiare idea e ricominciare.",
    "Essere autentici attira le persone giuste.",
    "Cammina anche piano, ma non smettere di muoverti.",
    "Non aspettare il momento perfetto: crealo.",
    "La paura di iniziare è quasi sempre più grande dell'inizio stesso.",
    "Festeggia anche le piccole vittorie: sono quelle che si dimenticano più in fretta.",
    "Un sorriso a qualcuno oggi può essere la cosa migliore che gli capita.",
    "La tua storia non è finita: stai scrivendo la pagina di oggi.",
    "Se è difficile, probabilmente stai crescendo.",
    "Concentrati su ciò che puoi controllare e lascia passare il resto.",
    "Fai una pausa, bevi qualcosa di caldo, poi riparti con calma.",
    "Il tuo ritmo è quello giusto per te.",
    "Ringrazia qualcuno oggi: costa poco e vale tantissimo.",
    "Ci sono giorni per correre e giorni per camminare: entrambi ti portano avanti.",
    "Un obiettivo diviso in piccoli pezzi smette di fare paura.",
    "Ogni mattina è una pagina bianca: scrivici qualcosa di tuo.",
  ];
  
  /* ---------- Utilità ---------- */
  function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(list, seed) {
    const rnd = mulberry32(seed), a = list.map((item, index) => ({ item, index }));
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function textHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  /* Ordine fisso (seme costante) → nessuna ripetizione finché non si esaurisce l'archivio. */
  const ORDER = {
    curiosita: shuffled(CURIOSITIES, 0xB011E1),
    aforisma: shuffled(APHORISMS, 0xB011E2),
    motivazione: shuffled(MOTIVATIONS, 0xB011E3),
  };
  
  /* Giorno corrente in fuso italiano, formato YYYY-MM-DD. */
  export function systemDayKey(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
  function dayNumber(dayKey) {
    const [y, m, d] = dayKey.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  }
  function takeForDay(list, count, dayIdx) {
    if (!list.length) return [];
    const n = Math.min(count, list.length), start = (dayIdx * count) % list.length;
    return Array.from({ length: n }, (_, i) => list[(start + i) % list.length]);
  }
  
  /* ---------- Costruzione delle bolle del giorno ---------- */
  export function buildDailySystemBubbles(dayKey = systemDayKey(), news = []) {
    const dayIdx = dayNumber(dayKey);
    const make = (category, id, fields) => ({
      id: `sys-${dayKey}-${category}-${id}`, starter: true, system: true, systemCategory: category, distance_km: null, ...fields,
    });
    const lists = {
      curiosita: takeForDay(ORDER.curiosita, SYSTEM_DAILY_COUNTS.curiosita, dayIdx)
        .map(({ item: [emoji, text], index }) => make("curiosita", index, { message: `${text}`, emoji })),
      aforisma: takeForDay(ORDER.aforisma, SYSTEM_DAILY_COUNTS.aforisma, dayIdx)
        .map(({ item: [text, by], index }) => make("aforisma", index, { message: `“${text}”`, attribution: by, emoji: "📜" })),
      motivazione: takeForDay(ORDER.motivazione, SYSTEM_DAILY_COUNTS.motivazione, dayIdx)
        .map(({ item: text, index }) => make("motivazione", index, { message: text, emoji: "🔥" })),
      notizia: (Array.isArray(news) ? news : []).slice(0, SYSTEM_DAILY_COUNTS.notizia)
        .map(n => make("notizia", textHash(n.link || n.title), { message: n.title, source: n.source, link: n.link, emoji: "📰" })),
    };
    // Alterna le categorie, così in cima al feed c'è sempre un po' di tutto.
    const order = ["curiosita", "notizia", "aforisma", "motivazione"], out = [], max = Math.max(...order.map(k => lists[k].length));
    for (let i = 0; i < max; i++) order.forEach(k => { if (lists[k][i]) out.push(lists[k][i]); });
    return out;
  }
  
  /* ---------- Bolle già scoppiate oggi (restano scoppiate fino a domani) ---------- */
  const POPS_KEY = "bolle-system-pops-v1";
  export function readSystemPops(dayKey = systemDayKey()) {
    try {
      const saved = JSON.parse(localStorage.getItem(POPS_KEY) || "null");
      return saved && saved.day === dayKey && Array.isArray(saved.ids) ? new Set(saved.ids) : new Set();
    } catch { return new Set(); }
  }
  export function saveSystemPops(ids, dayKey = systemDayKey()) {
    try { localStorage.setItem(POPS_KEY, JSON.stringify({ day: dayKey, ids: [...ids] })); } catch { /* storage non disponibile */ }
  }
  
  /* ---------- Notizie recenti ----------
     Solo titolo, fonte e link all'articolo originale: il testo degli articoli non viene copiato.
     Il feed RSS passa da rss2json (accetta richieste dal browser). Per un uso in produzione conviene
     spostare questa chiamata in una Edge Function Supabase: più stabile e senza limiti di terze parti. */
  export const NEWS_FEEDS = [
    { source: "ANSA", url: "https://www.ansa.it/sito/ansait_rss.xml" },
    { source: "ANSA", url: "https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml" },
  ];
  const NEWS_KEY = "bolle-news-v1";
  const NEWS_TTL_MS = 3 * 3600 * 1000;      // dopo 3 ore si riprova
  const NEWS_MAX_AGE_MS = 72 * 3600 * 1000; // più vecchie di 3 giorni non sono "recenti"
  
  export function readCachedNews({ allowStale = false } = {}) {
    try {
      const saved = JSON.parse(localStorage.getItem(NEWS_KEY) || "null");
      if (!saved || !Array.isArray(saved.items)) return { items: [], fresh: false };
      const age = Date.now() - (Number(saved.fetchedAt) || 0);
      return { items: age < 24 * 3600 * 1000 || allowStale ? saved.items : [], fresh: age < NEWS_TTL_MS };
    } catch { return { items: [], fresh: false }; }
  }
  
  async function fetchFeed(feed, signal) {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    if (json?.status !== "ok" || !Array.isArray(json.items)) return [];
    return json.items.map(it => {
      const published = Date.parse(String(it.pubDate || "").replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(it.pubDate || "")) ? "" : "Z"));
      return { title: String(it.title || "").replace(/\s+/g, " ").trim().slice(0, 160), link: String(it.link || ""), source: feed.source, published };
    }).filter(n => n.title && /^https?:\/\//.test(n.link) && (!Number.isFinite(n.published) || Date.now() - n.published < NEWS_MAX_AGE_MS));
  }
  
  /* Restituisce le notizie più recenti; usa la cache se ancora valida e non lancia mai errori. */
  export async function loadDailyNews() {
    const cached = readCachedNews();
    if (cached.fresh && cached.items.length) return cached.items;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
    try {
      const results = await Promise.allSettled(NEWS_FEEDS.map(feed => fetchFeed(feed, controller.signal)));
      const seen = new Set(), items = [];
      results.flatMap(r => (r.status === "fulfilled" ? r.value : []))
        .sort((a, b) => (b.published || 0) - (a.published || 0))
        .forEach(n => { const k = n.title.toLowerCase(); if (!seen.has(k)) { seen.add(k); items.push(n); } });
      const top = items.slice(0, 12);
      if (top.length) { try { localStorage.setItem(NEWS_KEY, JSON.stringify({ fetchedAt: Date.now(), items: top })); } catch { /* ignora */ } return top; }
    } catch { /* rete assente o feed non raggiungibile */ }
    finally { clearTimeout(timer); }
    return cached.items; // ripiego: ultime notizie in cache (se abbastanza recenti)
  }