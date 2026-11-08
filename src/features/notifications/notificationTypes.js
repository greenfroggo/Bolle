export const NOTIFICATION_CATEGORIES = [
  { key: "reactions", label: "Mi piace e reazioni", kinds: ["reaction"] },
  { key: "messages", label: "Messaggi e inoltri", kinds: ["bubble_reply", "bubble_share", "group_added", "chat_message", "group_message"] },
  { key: "new_bubbles", label: "Nuove bolle", kinds: ["favorite_post"] },
  { key: "polls", label: "Sondaggi", kinds: ["poll_vote"] },
  { key: "answers", label: "Risposte", kinds: ["question_answer"] },
  { key: "favorites", label: "Preferiti", kinds: ["favorite_added", "favorite_removed", "favorite_rejected", "favorite_added_decided", "favorite_accepted"] },
  { key: "tags", label: "Tag", kinds: ["bubble_tag", "bubble_tag_removed"] },
  { key: "gifts", label: "Regali", kinds: ["gift_opened"] },
  { key: "achievements", label: "Traguardi", kinds: ["achievement"] },
];

export const DEFAULT_NOTIFICATION_PREFS = Object.fromEntries(NOTIFICATION_CATEGORIES.map(c => [c.key, true]));

export function notificationCategory(kind) {
  return NOTIFICATION_CATEGORIES.find(c => c.kinds.includes(kind))?.key || "other";
}

// Un evento di tag (RPC bolle_my_tag_notifications) diventa una notifica. Solo "tagged" porta alla bolla.
export function tagNotificationItem(t) {
  const tagged = t.kind === "tagged";
  return {
    id: `tag-${t.bubble_id}-${t.event_at}`, // stabile fra un controllo e l'altro: serve a non ripetere il banner
    kind: tagged ? "bubble_tag" : "bubble_tag_removed",
    title: tagged ? `@${t.other_username} ti ha taggato in una bolla` : `@${t.other_username} ha rimosso il tag dalla tua bolla`,
    body: tagged ? "Tocca per aprire la bolla" : "",
    created_at: t.event_at,
    is_read: Boolean(t.seen),
    bubble_id: tagged ? t.bubble_id : null,
    tag_username: t.other_username,
  };
}

/* Notifiche di gruppo: il gruppo può arrivare in campi diversi a seconda della funzione SQL; la riga è sempre apribile. */
export function notifGroupId(n) {
  const direct = n?.group_id ?? n?.data?.group_id ?? n?.payload?.group_id ?? n?.metadata?.group_id;
  if (direct != null && direct !== "") return direct;
  if (n?.kind === "group_added") return n?.ref_id ?? null;
  return null;
}

export const notifOpenable = (n) => Boolean(n && (n.bubble_id || n.chat_username || n.kind === "group_added" || n.kind === "group_message" || notifGroupId(n)));

export function readNotificationPrefs(uid) {
  try {
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(localStorage.getItem(`bolle-notification-prefs-v1-${uid || "guest"}`) || "{}") };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}
