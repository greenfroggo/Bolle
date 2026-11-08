import { supabase, REACTIONS, cleanCaption } from "./bolleCore.jsx";

export const KNOWN_KINDS = ["photo", "video", "gif", "poll", "question", "meme", "thought", "confession", "truth", "rating"];

export function bubbleKind(item) {
  // 1) Tipo salvato alla pubblicazione (colonna bubbles.kind): è la fonte di verità.
  if (KNOWN_KINDS.includes(item?.kind)) return item.kind;
  // 2) Riserva per bolle senza tipo salvato.
  const raw = String(item?.media_type || item?.type || item?.bubble_type || item?.content_type || "").toLowerCase();
  if (raw.includes("truth") || raw.includes("bugia") || item?.lie_index != null || item?.truth_id || item?.statement_1 || item?.s1) return "truth";
  if (raw.includes("rating") || item?.rating_id || item?.rating_prompt) return "rating";
  if (raw.includes("poll") || raw.includes("sondag") || item?.poll_id || item?.option_a) return "poll";
  if (raw.includes("question") || raw.includes("domanda") || item?.question_id || item?.question) return "question";
  if (raw.includes("gif") || item?.gif_url || /\.gif$/i.test(String(item?.media_path || ""))) return "gif";
  if (raw.includes("quote") || raw.includes("citazione")) return "thought";
  if (raw.includes("video")) return "video";
  return "photo";
}

/* Recupera il tipo dal server per un elenco di bolle (a blocchi). Se la funzione non esiste ancora, torna {} e vale la riserva. */
export async function fetchBubbleKinds(ids) {
  const out = {};
  const unique = [...new Set((ids || []).filter(id => id && !String(id).startsWith("starter-")))];
  for (let i = 0; i < unique.length; i += 200) {
    try {
      const { data, error } = await supabase.rpc("bolle_bubble_kinds", { p_ids: unique.slice(i, i + 200) });
      if (error || !Array.isArray(data)) return out;
      data.forEach(r => { out[r.bubble_id] = r.kind; });
    } catch {
      return out;
    }
  }
  return out;
}

export const KIND_META = {
  photo: { label: "Foto", icon: "📷" },
  video: { label: "Video", icon: "🎬" },
  gif: { label: "GIF e meme", icon: "🎞️" },
  poll: { label: "Sondaggio", icon: "📊" },
  question: { label: "Domanda", icon: "❓" },
  meme: { label: "Meme", icon: "😂" },
  thought: { label: "Pensiero", icon: "💭" },
  confession: { label: "Confessione", icon: "💜" },
  truth: { label: "2 verità e 1 bugia", icon: "🕵️" },
  rating: { label: "Voto", icon: "⭐" },
};

/* Reazioni "su misura" per tipo di bolla: stesse 5 chiavi sul server, icone e nomi diversi. */
export const REACTION_SKINS = {
  confession: { love: ["🤗", "Ti abbraccio"], laugh: ["😅", "Capita"], wow: ["😮", "Wow"], warm: ["🙋", "Anche io"], sad: ["🥺", "Coraggio"] },
  meme: { love: ["😍", "Adoro"], laugh: ["🤣", "Ahah"], wow: ["💀", "Morto"], warm: ["🔥", "Top"], sad: ["🙄", "Cringe"] },
};

export function reactionsFor(kind) {
  const skin = REACTION_SKINS[kind];
  return skin ? REACTIONS.map(r => ({ ...r, emoji: skin[r.key][0], label: skin[r.key][1] })) : REACTIONS;
}

// Foto e video condividono lo stesso gruppo.
// Sondaggi e domande hanno risposte dedicate: nella sezione "Le mie bolle" non mostrano le reazioni.
export const NO_REACTION_KINDS = ["poll", "question"];

export const BUBBLE_GROUPS = [
  { id: "photo", label: "Foto e video", icon: "📷", kinds: ["photo", "video"] },
  { id: "gif", label: "GIF e meme", icon: "🎞️", kinds: ["gif", "meme"] },
  { id: "poll", label: "Sondaggi", icon: "📊", kinds: ["poll"] },
  { id: "question", label: "Domande", icon: "❓", kinds: ["question"] },
  { id: "thought", label: "Pensieri", icon: "💭", kinds: ["thought"] },
  { id: "confession", label: "Confessioni", icon: "💜", kinds: ["confession"] },
  { id: "truth", label: "2 verità e 1 bugia", icon: "🕵️", kinds: ["truth"] },
  { id: "rating", label: "Voti", icon: "⭐", kinds: ["rating"] },
];

export function bubbleDescription(item) {
  const caption = cleanCaption(item?.caption);
  return caption || KIND_META[bubbleKind(item)]?.label || "Bolla";
}
