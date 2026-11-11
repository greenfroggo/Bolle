import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Archive, ArchiveRestore, Trash2, Users } from "lucide-react";
import { supabase, avatarFor, errorText } from "../../lib/bolleCore.jsx";
import AvatarImage from "../../components/AvatarImage.jsx";
import { openUserProfile } from "../../components/UserLinkText.jsx";
import SwipeRow from "./SwipeRow.jsx";
import ChatMessage from "./ChatMessage.jsx";
import { GroupManageModal, NewGroupModal } from "./GroupModals.jsx";
import { useUnlocks, showLocked } from "../../unlocks.jsx";
import {
  CHAT_MAX_BODY,
  POLL,
  makeQuoteMark,
  chatPreview,
  chatQuoteSnippet,
  readHiddenChats,
  writeHiddenChats,
  setActiveChatKey,
  mapGroupRow,
  mapGroupMsg,
  parseGroupMsgBody,
  groupErrorText
} from "./chatUtils.js";

function MessagesView({ me, initialChat, onNotify, onUnreadCountChange, onOpenOwnBubble, onExit, avatarMap = {}, activeChat, onActiveChatChange, groupModalOpen, onGroupModalOpenChange }) {
  const unlocks = useUnlocks();
  const groupsOk = unlocks.isUnlocked("groups");
  const openedDirect = useRef(Boolean(initialChat?.username)); // chat aperta da fuori: la freccia torna alla schermata di provenienza
  const [threads, setThreads] = useState([]);
  const [active, setActiveInternal] = useState(activeChat || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null); // chat in attesa di conferma di eliminazione
  const [deletingKey, setDeletingKey] = useState(null);
  const [swipeOpenKey, setSwipeOpenKey] = useState(null); // riga con le azioni aperte
  const hideStoreKey = `bolle-hidden-chats-v1-${String(me?.id || me?.username || "me").toLowerCase()}`;
  const [hiddenMap, setHiddenMap] = useState(() => readHiddenChats(hideStoreKey));
  const [archiveOpen, setArchiveOpen] = useState(false); // vista «Archivio» con le chat nascoste
  const [menu, setMenu] = useState(null); // menu rapido (pressione prolungata): { key, t, rect, hidden, closing }
  const itemEls = useRef(new Map());
  const archiveBtnRef = useRef(null);
  const busyKeys = useRef(new Set());
  const lastSeenMsg = useRef(null); // id dell'ultimo messaggio già mostrato (per lo scorrimento automatico)
  const latestId = useRef(null);
  const loadConversationRef = useRef(null);
  const loadThreadsRef = useRef(null);
  const activeRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null); // { id, from, snippet }: messaggio che sto citando
  const [highlightId, setHighlightId] = useState(null);
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const hlTimer = useRef(null);

  // Accetta sia un valore sia una funzione (cur => next), come setState: prima la forma a funzione
  // finiva dentro activeRef e interrompeva l'aggiornamento automatico delle chat di gruppo.
  const setActive = useCallback((next) => {
    const person = typeof next === "function" ? next(activeRef.current) : next;
    if (person === activeRef.current) return;
    setActiveInternal(person);
    activeRef.current = person;
    onActiveChatChange?.(person);
  }, [onActiveChatChange]);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    setActiveChatKey(active ? (active.isGroup ? `g:${active.id}` : `u:${String(active.username || "").toLowerCase()}`) : null);
    return () => { setActiveChatKey(null); };
  }, [active]);
  useEffect(() => () => clearTimeout(hlTimer.current), []);
  useEffect(() => { setHiddenMap(readHiddenChats(hideStoreKey)); }, [hideStoreKey]);

  // Sincronizzazione con activeChat dall'esterno (es. back button dell'header di Sheet)
  useEffect(() => {
    if (activeChat === null && activeRef.current !== null) {
      setActiveInternal(null);
      activeRef.current = null;
      setMessages([]);
      setReplyTo(null);
      latestId.current = null;
      void loadThreads(true);
    }
  }, [activeChat]);

  function startReply(m) {
    setReplyTo({ id: m.id, from: m.mine ? (me?.username || "") : (m.sender || active?.username || ""), snippet: chatQuoteSnippet(m.body) });
    setTimeout(() => inputRef.current?.focus(), 0);
  }
  function jumpToMessage(id) {
    const el = historyRef.current?.querySelector(`[data-mid="${String(id).replace(/"/g, "")}"]`);
    if (!el) { onNotify?.("Il messaggio originale non è più caricato."); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlightId(String(id));
    clearTimeout(hlTimer.current);
    hlTimer.current = setTimeout(() => setHighlightId(null), 1600);
  }
  // Tocco sul riferimento di una risposta alla mia bolla: la riapro (le mie bolle restano visibili al loro autore).
  async function openBubbleRef(bubble) {
    if (!bubble?.id) return;
    const { data, error: err } = await supabase.rpc("my_bubbles_media_dashboard");
    const row = !err && Array.isArray(data) ? data.find(r => String(r.bubble_id) === String(bubble.id)) : null;
    if (!row?.media_path) { onNotify?.("Questa bolla non è più disponibile."); return; }
    await onOpenOwnBubble?.({ ...row, chat_username: active?.username, chat_avatar: active?.avatar });
  }

  const loadThreads = useCallback(async (quiet = false) => {
    if (!me?.registered) return;
    if (!quiet) { setLoading(true); setError(""); }
    const { data, error: err } = await supabase.rpc("bolle_chat_conversations");
    if (err) {
      setError("Impossibile caricare le conversazioni. Verifica che le funzioni SQL della chat siano state installate.");
      if (!quiet) setLoading(false);
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    const directMapped = rows.map(row => ({
      username: row.username || "Utente",
      avatar: row.avatar || avatarFor(row.username, avatarMap) || "🫧",
      conversationId: row.conversation_id,
      lastBody: row.last_body || "",
      lastAt: row.last_at,
      lastMine: Boolean(row.last_mine),
      unread: Number(row.unread) || 0,
      isGroup: false
    }));

    // Gruppi: vivono sul server, uguali per tutti i membri.
    let groupThreads = [];
    try {
      const { data: gData, error: gErr } = await supabase.rpc("bolle_group_list");
      if (!gErr && Array.isArray(gData)) groupThreads = gData.map(mapGroupRow);
      else if (gErr) console.warn("[Bolle] Elenco gruppi:", gErr.message);
    } catch (e) { console.warn("[Bolle] Elenco gruppi:", e); }

    // Vecchi segnali di gruppo (formato precedente) nelle chat 1:1: restano nascosti dall'anteprima.
    const cleanedDirect = directMapped.map(d => {
      const gmsg = parseGroupMsgBody(d.lastBody);
      return gmsg ? { ...d, lastBody: `[Messaggio di gruppo: ${gmsg.groupName}]` } : d;
    });

    const combined = [...groupThreads, ...cleanedDirect].sort((a, b) => {
      const ta = Date.parse(a.lastAt || a.createdAt || 0) || 0;
      const tb = Date.parse(b.lastAt || b.createdAt || 0) || 0;
      return tb - ta;
    });

    setThreads(combined);
    onUnreadCountChange?.(combined.reduce((sum, thread) => sum + (thread.unread || 0), 0));
    if (!quiet) setLoading(false);
  }, [me?.registered, me?.username, me?.id, avatarMap, onUnreadCountChange]);

  const loadConversation = useCallback(async (person, after = null, quiet = false) => {
    if (!person) return;
    if (person.isGroup) {
      if (!quiet) {
        setActive(person);
        setMessages([]);
        latestId.current = null;
        setDraft("");
        setReplyTo(null);
        setError("");
      }
      const { data: gd, error: gErr } = await supabase.rpc("bolle_group_thread", { p_group: person.id, p_after: quiet ? (after ?? null) : null });
      if (gErr) {
        if (String(gErr.message || "").includes("group_not_member")) { setActive(null); onNotify?.("Non fai più parte di questo gruppo."); void loadThreads(true); }
        else if (!quiet) setError(groupErrorText(gErr));
        return;
      }
      const rows = (Array.isArray(gd?.messages) ? gd.messages : []).map(mapGroupMsg);
      // Nome, amministratore e membri arrivano dal server: restano allineati per tutti.
      setActive(cur => {
        if (!cur || cur.id !== person.id) return cur;
        const members = Array.isArray(gd?.members) ? gd.members.filter(Boolean) : cur.members;
        const next = { ...cur, name: gd?.name || cur.name, admin: gd?.admin || cur.admin, createdBy: gd?.admin || cur.createdBy, members };
        return JSON.stringify([next.name, next.admin, next.members]) === JSON.stringify([cur.name, cur.admin, cur.members]) ? cur : next;
      });
      if (rows.length || !quiet) {
        setMessages(prev => {
          const merged = quiet ? [...prev, ...rows.filter(row => !prev.some(old => String(old.id) === String(row.id)))] : rows;
          merged.sort((x, y) => Number(x.id) - Number(y.id));
          return merged.slice(-100);
        });
      }
      latestId.current = rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), Number(latestId.current) || 0) || latestId.current;
      if (rows.some(r => !r.mine)) void loadThreads(true);
      return;
    }

    const username = person?.username?.trim();
    if (!username) return;
    const initialStarter = me?.username || "Tu";
    const initialActive = {
      ...person,
      username,
      avatar: person.avatar || avatarFor(username, avatarMap) || "🫧",
      isGroup: false,
      members: [me?.username, username].filter(Boolean),
      admin: initialStarter
    };
    if (!quiet) {
      setActive(initialActive);
      setMessages([]);
      latestId.current = null;
      setDraft("");
      setReplyTo(null);
      setError("");
    }
    const { data, error: err } = await supabase.rpc("bolle_chat_thread", {
      p_username: username,
      p_after: after
    });
    if (err) {
      setError(err.message?.includes("chat_blocked")
        ? "Non puoi aprire questa conversazione perché uno dei due utenti ha bloccato l’altro."
        : "Impossibile caricare la conversazione. Riprova.");
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    if (rows.length) {
      if (!quiet) {
        const firstMsg = rows[0];
        const initiator = firstMsg.mine ? (me?.username || "Tu") : username;
        setActive({
          ...initialActive,
          admin: initiator
        });
      }
      setMessages(prev => {
        const merged = quiet ? [...prev, ...rows.filter(row => !prev.some(old => String(old.id) === String(row.id)))] : rows;
        merged.sort((a, b) => Number(a.id) - Number(b.id));
        return merged.slice(-100);
      });
      latestId.current = rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), Number(latestId.current) || 0) || latestId.current;
    } else if (!quiet) {
      setMessages([]);
    }
    if (!quiet || rows.length) void loadThreads(true);
  }, [loadThreads, me?.username, avatarMap, setActive, onNotify]);

  useEffect(() => { void loadThreads(); }, [loadThreads]);

  useEffect(() => {
    if (initialChat?.isGroup && initialChat.id) {
      void loadConversation({ id: initialChat.id, name: initialChat.name || "Gruppo", isGroup: true, admin: "", members: [] });
    } else if (initialChat?.username) {
      void loadConversation({ username: initialChat.username, avatar: initialChat.avatar || avatarFor(initialChat.username, avatarMap) || "🫧" });
    }
  }, [initialChat?.username, initialChat?.id, loadConversation, avatarMap]);

  loadConversationRef.current = loadConversation;
  loadThreadsRef.current = loadThreads;

  // Aggiorna la conversazione aperta e l'elenco senza richiedere refresh manuali.
  // Timer unico e stabile: usa i riferimenti alle ultime funzioni, così non viene mai azzerato dai re-render.
  useEffect(() => {
    let lastListPoll = 0;
    let n = 0;
    const tick = (force = false) => {
      if (document.hidden) return;
      const person = activeRef.current;
      if (person && (person.isGroup || person.username)) {
        n += 1;
        // ogni 5 giri (≈20 s) rilettura completa come rete di sicurezza; negli altri solo i messaggi nuovi
        void loadConversationRef.current?.(person, n % 5 === 0 ? null : latestId.current, true);
      } else if (force || Date.now() - lastListPoll >= POLL.chatList) { lastListPoll = Date.now(); void loadThreadsRef.current?.(true); }
    };
    const timer = window.setInterval(() => tick(), POLL.chatOpen);
    const onVisible = () => { if (document.visibilityState === "visible") tick(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  // Tempo reale: appena arriva un evento si rilegge la chat aperta e l'elenco, senza aspettare il polling.
  useEffect(() => {
    let t = null;
    const onEvent = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const person = activeRef.current;
        if (person && (person.isGroup || person.username)) void loadConversationRef.current?.(person, latestId.current, true);
        void loadThreadsRef.current?.(true);
      }, 80);
    };
    window.addEventListener("bolle:chat-event", onEvent);
    return () => { window.clearTimeout(t); window.removeEventListener("bolle:chat-event", onEvent); };
  }, []);

  // Scorrimento automatico: all'apertura si va all'ultimo messaggio; quando ne arriva uno nuovo
  // (o ne invio uno) la chat scende da sola, a meno che io stia rileggendo i messaggi più vecchi.
  useEffect(() => {
    const node = historyRef.current;
    const last = messages[messages.length - 1];
    const key = last ? String(last.id) : null;
    const prev = lastSeenMsg.current;
    lastSeenMsg.current = key;
    if (!node || !key || key === prev) return;
    let host = null;
    for (let el = node; el && el !== document.body; el = el.parentElement) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) { host = el; break; }
    }
    host = host || document.scrollingElement;
    if (!host) return;
    const first = prev === null;
    const nearBottom = host.scrollHeight - host.scrollTop - host.clientHeight < 360;
    if (first || last.mine || nearBottom) requestAnimationFrame(() => host.scrollTo({ top: host.scrollHeight, behavior: first ? "auto" : "smooth" }));
  }, [messages]);

  async function handleCreateNewGroup(groupName, membersList) {
    if (!me?.registered) { onNotify?.("Accedi per creare un gruppo."); return; }
    if (!groupsOk) { showLocked("groups"); return; } // vale anche per il passaggio da chat 1:1 a gruppo
    const { data, error: gErr } = await supabase.rpc("bolle_group_create", { p_name: String(groupName || "").trim(), p_members: membersList });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    if (data?.skipped?.length) onNotify?.(`Non aggiunti: ${data.skipped.map(u => "@" + u).join(", ")} (non esistono o non accettano messaggi).`);
    else onNotify?.(`Gruppo "${String(groupName).trim()}" creato! Sei l'amministratore ✨`);
    await loadThreads(true);
    void loadConversation({ id: data.id, name: String(groupName).trim(), isGroup: true, admin: me?.username, members: [me?.username, ...membersList] });
  }

  async function handleAddMember(newUsername) {
    if (!active) return;
    const cleaned = String(newUsername || "").trim().replace(/^@/, "");
    if (!cleaned) { onNotify?.("Inserisci un nome utente valido."); return; }

    if (!active.isGroup) {
      // Da chat 1:1 a gruppo: nasce un gruppo vero con i due interlocutori e il nuovo utente.
      if ([me?.username, active.username].filter(Boolean).some(m => m.toLowerCase() === cleaned.toLowerCase())) {
        onNotify?.(`@${cleaned} è già presente nella chat.`); return;
      }
      const name = `Gruppo con @${active.username} e @${cleaned}`.slice(0, 40);
      await handleCreateNewGroup(name, [active.username, cleaned]);
      return;
    }

    const { error: gErr } = await supabase.rpc("bolle_group_add_member", { p_group: active.id, p_username: cleaned });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    onNotify?.(`@${cleaned} aggiunto al gruppo!`);
    await loadConversation(active, latestId.current, true);
    void loadThreads(true);
  }

  async function handleRemoveMember(memberToRemove) {
    if (!active || !active.isGroup) return;
    const { error: gErr } = await supabase.rpc("bolle_group_remove_member", { p_group: active.id, p_username: String(memberToRemove).replace(/^@/, "") });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    onNotify?.(`@${memberToRemove} rimosso dal gruppo.`);
    await loadConversation(active, latestId.current, true);
    void loadThreads(true);
  }

  async function handleLeaveGroup() {
    if (!active || !active.isGroup) return;
    const { error: gErr } = await supabase.rpc("bolle_group_leave", { p_group: active.id });
    if (gErr) { onNotify?.(groupErrorText(gErr)); return; }
    setActive(null);
    onNotify?.("Hai abbandonato il gruppo.");
    void loadThreads(true);
  }

  const threadKey = (t) => t.isGroup ? `g:${t.id}` : `u:${String(t.username).toLowerCase()}`;
  /* Animazione «risucchio»: la riga si deforma come un liquido molle e sparisce.
     delete  -> compare un buco nero al centro della riga che la inghiotte
     hide    -> la riga vola verso l'icona archivio, che rimbalza quando la riceve
     restore -> uscita morbida dall'archivio */
  function playSuck(key, kind) {
    const item = itemEls.current.get(key);
    const sw = item?.querySelector(".bl-swipe");
    const calm = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    if (!item || !sw || typeof sw.animate !== "function") return { done: Promise.resolve(), cancel() {} };
    const anims = [];
    let hole = null, bumpTimer = null, dead = false;
    item.classList.add("is-sucking");
    sw.classList.add("is-flying");
    const r = sw.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let main;
    if (calm || kind === "restore") {
      main = sw.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: calm ? "scale(1)" : "translateY(-10px) scale(.94)" }], { duration: calm ? 120 : 240, easing: "ease-in", fill: "forwards" });
    } else if (kind === "hide") {
      const ab = archiveBtnRef.current?.getBoundingClientRect();
      const dx = ab ? ab.left + ab.width / 2 - cx : 0;
      const dy = ab ? ab.top + ab.height / 2 - cy : -(cy - ir.top) - 60;
      main = sw.animate([
        { transform: "translate(0px,0px) scale(1,1) rotate(0deg)", borderRadius: "18px", opacity: 1, offset: 0, easing: "cubic-bezier(.3,.7,.4,1)" },
        { transform: "translate(0px,0px) scale(1.05,.9) rotate(0deg)", borderRadius: "22px", opacity: 1, offset: .16, easing: "cubic-bezier(.4,0,.6,1)" },
        { transform: `translate(${dx * .16}px,${dy * .16}px) scale(.84,1.12) rotate(-3deg)`, borderRadius: "34px", opacity: 1, offset: .4, easing: "cubic-bezier(.55,0,.8,.5)" },
        { transform: `translate(${dx * .68}px,${dy * .68}px) scale(.36,.62) rotate(9deg)`, borderRadius: "50%", opacity: .95, offset: .76, easing: "cubic-bezier(.55,0,.9,.6)" },
        { transform: `translate(${dx}px,${dy}px) scale(.03,.05) rotate(16deg)`, borderRadius: "50%", opacity: .2, offset: 1 }
      ], { duration: 780, fill: "forwards" });
      bumpTimer = setTimeout(() => {
        archiveBtnRef.current?.animate([
          { transform: "scale(1)" }, { transform: "scale(1.38,.8)", offset: .2 }, { transform: "scale(.86,1.2)", offset: .45 },
          { transform: "scale(1.1,.96)", offset: .7 }, { transform: "scale(1)" }
        ], { duration: 560, easing: "ease-out" });
      }, 660);
    } else {
      hole = document.createElement("span");
      hole.className = "bl-blackhole";
      hole.setAttribute("aria-hidden", "true");
      hole.style.left = `${cx - ir.left}px`;
      hole.style.top = `${cy - ir.top}px`;
      item.appendChild(hole);
      anims.push(hole.animate([
        { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 0, offset: 0, easing: "cubic-bezier(.3,1.5,.5,1)" },
        { transform: "translate(-50%,-50%) scale(1.18,.9) rotate(140deg)", opacity: 1, offset: .22 },
        { transform: "translate(-50%,-50%) scale(1,1.08) rotate(420deg)", opacity: 1, offset: .45 },
        { transform: "translate(-50%,-50%) scale(1.12,1) rotate(760deg)", opacity: 1, offset: .78, easing: "ease-in" },
        { transform: "translate(-50%,-50%) scale(0) rotate(1000deg)", opacity: 0, offset: 1 }
      ], { duration: 1150, easing: "linear", fill: "forwards" }));
      main = sw.animate([
        { transform: "scale(1,1) rotate(0deg)", borderRadius: "18px", opacity: 1, offset: 0, easing: "ease-out" },
        { transform: "scale(1.04,.9) rotate(0deg)", opacity: 1, offset: .14, easing: "ease-in-out" },
        { transform: "scale(.86,1.04) rotate(-6deg)", borderRadius: "28px", opacity: 1, offset: .34, easing: "cubic-bezier(.55,0,.8,.5)" },
        { transform: "scale(.45,.55) rotate(-140deg)", borderRadius: "50%", opacity: 1, offset: .68, easing: "cubic-bezier(.55,0,.9,.6)" },
        { transform: "scale(.04,.05) rotate(-420deg)", borderRadius: "50%", opacity: .3, offset: 1 }
      ], { duration: 820, delay: 220, easing: "linear", fill: "both" });
    }
    anims.push(main);
    const done = main.finished.then(() => {
      if (dead) return;
      const h = item.getBoundingClientRect().height;
      item.style.overflow = "hidden";
      const c = item.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: calm ? 1 : 260, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      anims.push(c);
      return c.finished;
    }).catch(() => {});
    return { done, cancel() {
      dead = true; clearTimeout(bumpTimer);
      anims.forEach(a => { try { a.cancel(); } catch { /* già conclusa */ } });
      hole?.remove();
      item.style.overflow = "";
      item.classList.remove("is-sucking");
      sw.classList.remove("is-flying");
    } };
  }

  // Elimina dall'elenco: chat 1:1 = sparisce solo per me (torna se l'altro riscrive); gruppo = esco dal gruppo.
  async function deleteThread(t) {
    const key = threadKey(t);
    if (deletingKey || busyKeys.current.has(key)) return;
    busyKeys.current.add(key);
    setDeletingKey(key);
    const fx = playSuck(key, "delete");
    const call = t.isGroup
      ? supabase.rpc("bolle_group_leave", { p_group: t.id })
      : supabase.rpc("bolle_chat_delete", { p_username: t.username });
    const [{ error: dErr }] = await Promise.all([call, fx.done]);
    busyKeys.current.delete(key);
    setDeletingKey(null);
    setConfirmDeleteKey(null);
    if (dErr) {
      fx.cancel();
      const m = String(dErr.message || "");
      onNotify?.(t.isGroup ? groupErrorText(dErr) : /bolle_chat_delete|does not exist|schema cache/i.test(m) ? "Eliminazione non ancora attiva sul server (manca bolle_chat_delete.sql)." : "Impossibile eliminare la chat. Riprova.");
      return;
    }
    setThreads(prev => {
      const next = prev.filter(x => threadKey(x) !== key);
      onUnreadCountChange?.(next.reduce((sum, x) => sum + (x.unread || 0), 0));
      return next;
    });
    onNotify?.(t.isGroup ? "Hai abbandonato il gruppo." : "Chat eliminata dal tuo elenco.");
    void loadThreads(true);
  }

  const isThreadHidden = (t) => {
    const at = hiddenMap[threadKey(t)];
    return at != null && (Date.parse(t.lastAt || 0) || 0) <= Number(at);
  };
  async function hideThread(t) {
    const key = threadKey(t);
    if (busyKeys.current.has(key)) return;
    busyKeys.current.add(key);
    setSwipeOpenKey(null);
    await playSuck(key, "hide").done;
    busyKeys.current.delete(key);
    setHiddenMap(prev => { const next = { ...prev, [key]: Date.parse(t.lastAt || 0) || Date.now() }; writeHiddenChats(hideStoreKey, next); return next; });
    onNotify?.("Chat nascosta: la trovi nell'archivio. Ricompare se arriva un nuovo messaggio.");
  }
  async function unhideThread(t) {
    const key = threadKey(t);
    if (busyKeys.current.has(key)) return;
    busyKeys.current.add(key);
    setSwipeOpenKey(null);
    await playSuck(key, "restore").done;
    busyKeys.current.delete(key);
    setHiddenMap(prev => { const next = { ...prev }; delete next[key]; writeHiddenChats(hideStoreKey, next); return next; });
  }

  // Menu rapido (pressione prolungata o tasto destro)
  function openMenu(t, rect) {
    setSwipeOpenKey(null);
    setMenu({ key: threadKey(t), t, rect: rect || null, hidden: isThreadHidden(t), closing: false });
  }
  function closeMenu(after) {
    setMenu(m => (m ? { ...m, closing: true } : m));
    window.setTimeout(() => { setMenu(null); after?.(); }, 170);
  }
  useEffect(() => {
    if (!menu || menu.closing) return undefined;
    const onKey = (e) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  async function sendMessage(event, forcedBody) {
    event?.preventDefault();
    const text = forcedBody ? "" : draft.trim();
    if ((!text && !forcedBody) || !active || sending) return;
    const body = forcedBody || `${replyTo ? makeQuoteMark(replyTo) : ""}${text}`.slice(0, CHAT_MAX_BODY);
    setSending(true);
    setError("");

    if (active.isGroup) {
      const { data: gSent, error: gErr } = await supabase.rpc("bolle_group_send", { p_group: active.id, p_body: body });
      setSending(false);
      if (gErr) { setError(groupErrorText(gErr)); return; }
      if (!forcedBody) setDraft("");
      setReplyTo(null);
      if (gSent) {
        const sent = mapGroupMsg(gSent);
        setMessages(prev => (prev.some(old => String(old.id) === String(sent.id)) ? prev : [...prev, sent]).slice(-100));
        latestId.current = Math.max(Number(latestId.current) || 0, Number(sent.id) || 0);
      }
      void loadThreads(true);
      return;
    }

    const { data, error: err } = await supabase.rpc("bolle_chat_send", {
      p_username: active.username,
      p_body: body
    });
    setSending(false);
    if (err) {
      const message = err.message || "";
      setError(message.includes("chat_blocked")
        ? "Non puoi inviare messaggi a questo utente perché uno dei due lo ha bloccato."
        : message.includes("chat_rate_limited")
          ? "Hai inviato troppi messaggi. Attendi un minuto e riprova."
          : message.includes("user_not_found")
            ? "Questo utente non è più disponibile."
            : "Messaggio non inviato. Riprova.");
      return;
    }
    if (!forcedBody) setDraft("");
    setReplyTo(null);
    if (data) {
      setMessages(prev => [...prev, data].slice(-100));
      latestId.current = Math.max(Number(latestId.current) || 0, Number(data.id) || 0);
    }
    void loadThreads(true);
  }

  if (!me?.registered) return <p className="bl-muted">Accedi per usare i messaggi.</p>;
  return (
    <div className="bl-messages">
      {active ? (
        <>
          <div className="bl-message-history" aria-live="polite" ref={historyRef}>
            {messages.length ? (
              messages.map(m => (
                <ChatMessage
                  key={m.id}
                  m={m}
                  highlighted={highlightId === String(m.id)}
                  meName={me?.username}
                  peerName={active.username}
                  onReply={startReply}
                  onOpenBubble={openBubbleRef}
                  onJumpTo={jumpToMessage}
                  isGroup={active.isGroup}
                  avatar={avatarFor(m.mine ? me?.username : (m.sender || active.username), avatarMap) || (!m.mine && !active.isGroup ? active.avatar : null) || "🫧"}
                />
              ))
            ) : (
              <p className="bl-muted">
                {active.isGroup
                  ? `Inizia la conversazione nel gruppo "${active.name}".`
                  : `Inizia la conversazione con @${active.username}.`}
              </p>
            )}
          </div>
          {replyTo && (
            <div className="bl-reply-bar" role="group" aria-label="Stai rispondendo a un messaggio">
              <span className="bl-reply-bar-line" aria-hidden="true" />
              <div className="bl-reply-bar-copy">
                <b>{String(replyTo.from || "").toLowerCase() === String(me?.username || "").toLowerCase() ? "Rispondi a te stesso" : `Rispondi a @${replyTo.from}`}</b>
                <small>{replyTo.snippet}</small>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Annulla risposta">✕</button>
            </div>
          )}
          <form className="bl-message-compose" onSubmit={sendMessage} style={{display:"flex",alignItems:"flex-end",gap:10,padding:"10px 12px",borderRadius:26,background:"var(--bl-panel, #20232d)",border:"1px solid var(--bl-line, #ffffff20)",position:"relative",width:"100%",boxSizing:"border-box"}}>
            <div className="bl-message-input-wrap" style={{position:"relative",display:"flex",alignItems:"flex-end",gap:8,flex:1,minWidth:0}}>
              <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Escape" && replyTo) { setReplyTo(null); return; } if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (draft.trim() && !sending) e.currentTarget.form?.requestSubmit(); } }} maxLength={CHAT_MAX_BODY - (replyTo ? makeQuoteMark(replyTo).length : 0)} rows={1} placeholder={replyTo ? "Scrivi la tua risposta…" : active.isGroup ? "Scrivi nel gruppo…" : "Scrivi un messaggio…"} aria-label="Scrivi un messaggio" style={{flex:1,minWidth:0,resize:"none",border:0,outline:"none",background:"transparent",color:"inherit",font:"inherit",fontSize:16,lineHeight:1.4,padding:"8px 2px",maxHeight:120,overflowY:"auto"}} />
            </div>
            <button type="submit" aria-label="Invia messaggio" title="Invia messaggio" disabled={!draft.trim() || sending} style={{flex:"0 0 42px",width:42,height:42,border:0,borderRadius:"50%",background:"var(--bl-accent, #20b8a5)",color:"#fff",display:"grid",placeItems:"center",fontSize:21,cursor:draft.trim()&&!sending?"pointer":"default",opacity:draft.trim()&&!sending?1:.5,boxShadow:"0 2px 8px #0003"}}>{sending ? "…" : "➤"}</button>
          </form>
          <small style={{display:"block",textAlign:"center",opacity:.55,fontSize:11,marginTop:5}}>Invio per spedire · Shift + Invio per andare a capo</small>
        </>
      ) : (
        <>
          <div className="bl-threads-header">
            {archiveOpen ? (
              <>
                <button type="button" className="bl-archive-back" onClick={() => { setArchiveOpen(false); setSwipeOpenKey(null); }}>‹ Chat</button>
                <p className="bl-muted">Archivio: chat nascoste su questo dispositivo.</p>
              </>
            ) : <p className="bl-muted">Le tue conversazioni, tutte in un unico posto.</p>}
            <span className="bl-threads-tools">
              <button ref={archiveBtnRef} type="button" className={`bl-archive-btn ${archiveOpen ? "on" : ""}`} onClick={() => { setArchiveOpen(v => !v); setSwipeOpenKey(null); }} aria-pressed={archiveOpen} aria-label={`Archivio chat nascoste (${threads.filter(isThreadHidden).length})`} title="Archivio chat nascoste">
                <Archive size={17} aria-hidden="true" />
                {threads.filter(isThreadHidden).length > 0 && <i>{threads.filter(isThreadHidden).length}</i>}
              </button>
              {!archiveOpen && (
                <button type="button" className={`bl-new-group-btn ${groupsOk ? "" : "is-locked"}`} aria-disabled={groupsOk ? undefined : "true"} onClick={() => { if (!groupsOk) { showLocked("groups"); return; } setNewGroupOpen(true); }} title={groupsOk ? "Crea un nuovo gruppo" : unlocks.message("groups")}>
                  {groupsOk ? <Users size={15} /> : <span aria-hidden="true">🔒</span>} Nuovo gruppo
                </button>
              )}
            </span>
          </div>
          {loading ? (
            <p className="bl-muted">Caricamento conversazioni…</p>
          ) : error ? (
            <p className="bl-error" role="alert">{error}</p>
          ) : (threads.length || archiveOpen) ? (
            <div className="bl-thread-list">
              {(() => {
                const hiddenThreads = threads.filter(isThreadHidden);
                const visibleThreads = threads.filter(t => !isThreadHidden(t));
                const shown = archiveOpen ? hiddenThreads : visibleThreads;
                const renderThread = (t, hidden) => {
                  const key = threadKey(t);
                  const confirming = confirmDeleteKey === key;
                  const askDelete = () => { setSwipeOpenKey(null); setConfirmDeleteKey(key); };
                  const actions = [
                    hidden
                      ? { key: "show", label: "Ripristina", className: "is-hide", icon: <ArchiveRestore size={17} aria-hidden="true" />, onClick: () => void unhideThread(t) }
                      : { key: "hide", label: "Nascondi", className: "is-hide", icon: <Archive size={17} aria-hidden="true" />, onClick: () => void hideThread(t) },
                    { key: "del", label: t.isGroup ? "Abbandona" : "Elimina", className: "is-delete", icon: <Trash2 size={17} aria-hidden="true" />, onClick: askDelete }
                  ];
                  return (
                  <div className={`bl-thread-item ${confirming ? "confirming" : ""} ${hidden ? "is-hidden-chat" : ""}`} key={t.isGroup ? t.id : (t.conversationId || t.username)}
                    ref={(el) => { if (el) itemEls.current.set(key, el); else itemEls.current.delete(key); }}>
                    <SwipeRow
                      open={swipeOpenKey === key}
                      onOpenChange={(o) => setSwipeOpenKey(o ? key : (cur) => (cur === key ? null : cur))}
                      onLongPress={(rect) => openMenu(t, rect)}
                      actions={actions}
                      label={t.isGroup ? `Azioni per il gruppo ${t.name}` : `Azioni per la chat con @${t.username}`}
                    >
                      <button
                        type="button"
                        className={`bl-thread-row ${t.isGroup ? "is-group" : ""}`}
                        onClick={() => void loadConversation(t)}
                      >
                        <span className={`bl-thread-avatar ${t.isGroup ? "bl-thread-group-avatar" : ""}`}>
                          {t.isGroup ? <Users size={20} /> : <AvatarImage avatar={t.avatar} />}
                        </span>
                        <span className="bl-thread-copy">
                          <strong>
                            {t.isGroup ? t.name : `@${t.username}`}
                            {t.isGroup && <span className="bl-thread-group-badge">{t.members?.length || 2} membri</span>}
                          </strong>
                          <small>{t.lastMine ? "Tu: " : ""}{chatPreview(t.lastBody)}</small>
                        </span>
                        <span className="bl-thread-meta">
                          <small>{t.lastAt ? new Date(t.lastAt).toLocaleDateString("it-IT") : ""}</small>
                          {t.unread > 0 && <i>{t.unread}</i>}
                        </span>
                      </button>
                    </SwipeRow>
                    {confirming && (
                      <span className="bl-thread-confirm" role="group" aria-label={t.isGroup ? "Conferma uscita dal gruppo" : "Conferma eliminazione chat"}>
                        <span>{t.isGroup ? "Abbandonare il gruppo?" : "Eliminare la chat?"}</span>
                        <button type="button" className="bl-thread-confirm-yes" disabled={deletingKey === key} onClick={() => void deleteThread(t)}>{deletingKey === key ? "…" : t.isGroup ? "Abbandona" : "Elimina"}</button>
                        <button type="button" className="bl-thread-confirm-no" disabled={deletingKey === key} onClick={() => setConfirmDeleteKey(null)}>Annulla</button>
                      </span>
                    )}
                  </div>
                  );
                };
                if (shown.length) return shown.map(t => renderThread(t, archiveOpen));
                return archiveOpen
                  ? <div className="bl-insights-empty"><span>🗄️</span><h3>Archivio vuoto</h3><p>Le chat che nascondi finiscono qui. Tornano nell'elenco anche da sole quando ricevi un nuovo messaggio.</p></div>
                  : <p className="bl-muted">Tutte le chat sono nascoste: aprile dall'icona archivio.</p>;
              })()}
            </div>
          ) : (
            <div className="bl-insights-empty">
              <span>💌</span>
              <h3>Nessun messaggio</h3>
              <p>Apri una bolla e tocca “Messaggio” per iniziare una chat, oppure crea un nuovo gruppo.</p>
            </div>
          )}
        </>
      )}
      {error && active && <p className="bl-error" role="alert">{error}</p>}

      {menu && createPortal((() => {
        const W = 232, vw = window.innerWidth, vh = window.innerHeight;
        const rect = menu.rect || { left: vw / 2 - 100, width: 200, top: vh / 2, bottom: vh / 2 + 40 };
        const left = Math.max(12, Math.min(vw - W - 12, rect.left + rect.width / 2 - W / 2));
        const below = rect.bottom + 8 + 190 < vh;
        const pos = below ? { top: rect.bottom + 8 } : { bottom: vh - rect.top + 8 };
        const t = menu.t, key = menu.key;
        return (
          <div className={`bl-ctx-layer ${menu.closing ? "is-closing" : ""}`} onPointerDown={() => closeMenu()} onContextMenu={(e) => e.preventDefault()}>
            <div className="bl-ctx-menu" role="menu" aria-label="Azioni chat" style={{ left, width: W, ...pos, transformOrigin: `${rect.left + rect.width / 2 - left}px ${below ? "0%" : "100%"}` }} onPointerDown={(e) => e.stopPropagation()}>
              <div className="bl-ctx-title">{t.isGroup ? t.name : `@${t.username}`}</div>
              <button type="button" role="menuitem" className="bl-ctx-item" style={{ "--i": 0 }} onClick={() => closeMenu(() => (menu.hidden ? void unhideThread(t) : void hideThread(t)))}>
                {menu.hidden ? <ArchiveRestore size={18} aria-hidden="true" /> : <Archive size={18} aria-hidden="true" />}<span>{menu.hidden ? "Ripristina" : "Nascondi"}</span>
              </button>
              <button type="button" role="menuitem" className="bl-ctx-item is-delete" style={{ "--i": 1 }} onClick={() => closeMenu(() => setConfirmDeleteKey(key))}>
                <Trash2 size={18} aria-hidden="true" /><span>{t.isGroup ? "Abbandona gruppo" : "Elimina chat"}</span>
              </button>
            </div>
          </div>
        );
      })(), document.querySelector(".bl-root") || document.body)}

      {groupModalOpen && active && (
        <GroupManageModal
          group={active}
          me={me}
          avatarMap={avatarMap}
          onClose={() => onGroupModalOpenChange?.(false)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onLeaveGroup={handleLeaveGroup}
          onNotify={onNotify}
        />
      )}

      {newGroupOpen && (
        <NewGroupModal
          me={me}
          avatarMap={avatarMap}
          onClose={() => setNewGroupOpen(false)}
          onCreateGroup={handleCreateNewGroup}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}


export default MessagesView;