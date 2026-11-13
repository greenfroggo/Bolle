/* Ricerca per tipologia di bolla: sinonimi, normalizzazione e chip del pannello di ricerca.
   I tipi (kinds) sono quelli di bubbleTypes.js: photo, video, gif, meme, poll, question, thought, confession, truth, rating. */

   export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

   /* Chip mostrati nel pannello. «Questo o quello» corrisponde al kind "poll" (così lo chiama SequentialFeed). */
   export const SEARCH_CHIPS = [
     { id: "photo",      label: "Foto e video",      kinds: ["photo", "video"] },
     { id: "gif",        label: "GIF e meme",        kinds: ["gif", "meme"] },
     { id: "poll",       label: "Questo o quello",   kinds: ["poll"] },
     { id: "question",   label: "Domande",           kinds: ["question"] },
     { id: "rating",     label: "Voto",              kinds: ["rating"] },
     { id: "thought",    label: "Pensieri",          kinds: ["thought"] },
     { id: "confession", label: "Confessioni",       kinds: ["confession"] },
     { id: "truth",      label: "2 verità, 1 bugia", kinds: ["truth"] },
   ];
   
   /* Parole che l'utente può digitare per ogni chip (già normalizzate: senza accenti, minuscole). */
   const ALIASES = {
     photo: ["foto", "fotografia", "immagine", "immagini", "video", "filmato"],
     gif: ["gif", "meme", "animazione"],
     poll: ["questo o quello", "sondaggio", "sondaggi", "scelta", "vs", "preferisci"],
     question: ["domanda", "domande", "chiedi", "chiedimi"],
     rating: ["voto", "voti", "valuta", "stelle", "punteggio"],
     thought: ["pensiero", "pensieri", "citazione", "frase"],
     confession: ["confessione", "confessioni", "segreto", "segreti"],
     truth: ["verita", "bugia", "bugie", "2 verita", "due verita", "2 verita e 1 bugia"],
   };
   
   /* Id dei chip che corrispondono a quanto digitato (prefisso in entrambe le direzioni). */
   export function chipsFromQuery(query) {
     const n = norm(query).replace(/^@+/, "");
     if (n.length < 1) return [];
     return SEARCH_CHIPS.filter((c) => (ALIASES[c.id] || []).some((w) => w.startsWith(n) || (n.length >= 3 && n.startsWith(w)))
       || norm(c.label).includes(n)).map((c) => c.id);
   }
   
   export function kindsForChips(chipIds) {
     const set = new Set();
     SEARCH_CHIPS.forEach((c) => { if (chipIds.includes(c.id)) c.kinds.forEach((k) => set.add(k)); });
     return set;
   }