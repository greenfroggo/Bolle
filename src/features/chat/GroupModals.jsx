import React, { useState, useEffect } from "react";
import { Users, UserPlus, X as CloseIcon, Droplets, Trash2 } from "lucide-react";
import AvatarImage from "../../components/AvatarImage.jsx";
import { avatarFor } from "../../lib/bolleCore.jsx";
import { openUserProfile } from "../../components/UserLinkText.jsx";
import { groupErrorText } from "./chatUtils.js";
import { useUserSuggest, UserSuggestList } from "./UserSuggest.jsx";

export function GroupManageModal({ group, me, avatarMap, onClose, onAddMember, onRemoveMember, onLeaveGroup, onNotify }) {
  const [newMember, setNewMember] = useState("");
  const [adding, setAdding] = useState(false);
  const adminUser = group?.admin || group?.createdBy || "";
  const isAdmin = Boolean(me?.username && adminUser && String(adminUser).toLowerCase() === String(me.username).toLowerCase());
  const members = Array.isArray(group?.members) ? group.members : [me?.username, group?.username].filter(Boolean);
  const sug = useUserSuggest(adding ? newMember : "", [...members, me?.username]);

  function pickMember(username) {
    onAddMember(username);
    setNewMember("");
    setAdding(false);
  }

  function submitAdd(e) {
    e?.preventDefault();
    const clean = newMember.trim().replace(/^@/, "");
    if (!clean) return;
    pickMember(clean);
  }

  function handleAddClick() {
    if (!isAdmin) {
      onNotify?.(`Solo l'amministratore (@${adminUser}) può aggiungere o rimuovere membri dal gruppo a proprio piacimento.`);
      return;
    }
    setAdding(v => !v);
  }

  return (
    <div className="bl-group-modal-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bl-group-modal" role="dialog" aria-modal="true" aria-label="Componenti del gruppo">
        <div className="bl-group-modal-head">
          <div className="bl-group-modal-head-title">
            <span className="bl-group-modal-icon" aria-hidden="true"><Users size={22} /></span>
            <div>
              <h3>{group?.isGroup ? (group?.name || "Gruppo") : `Chat con @${group?.username}`}</h3>
              <p>{members.length} {members.length === 1 ? "componente" : "componenti"}</p>
            </div>
          </div>
          <button type="button" className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <div className={`bl-group-admin-box ${isAdmin ? "is-admin" : ""}`}>
          <div className="bl-group-admin-info">
            <span className="bl-group-admin-badge">👑 Amministratore: @{adminUser || me?.username}</span>
            <p>
              {isAdmin
                ? "Sei l'amministratore del gruppo (hai avviato la chat). Sei l'unico utente autorizzato ad aggiungere o rimuovere membri a tuo piacimento."
                : `@${adminUser} ha avviato la chat ed è l'amministratore del gruppo. È l'unico utente autorizzato ad aggiungere o rimuovere membri a proprio piacimento.`}
            </p>
          </div>
        </div>

        <div className="bl-group-section">
          <div className="bl-group-section-head">
            <strong>Componenti del gruppo</strong>
            <button
              type="button"
              className={`bl-group-add-btn ${!isAdmin ? "locked" : ""}`}
              onClick={handleAddClick}
              title={isAdmin ? "Aggiungi un membro al gruppo" : `Solo l'amministratore (@${adminUser}) può aggiungere membri`}
            >
              <UserPlus size={15} /> Aggiungi membro
            </button>
          </div>

          {adding && isAdmin && (
            <form className="bl-group-add-form" onSubmit={submitAdd}>
              <div className="bl-group-add-input-row">
                <input
                  type="text"
                  placeholder="Nome utente (senza @)"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyDown={(e) => sug.onKeyDown(e, pickMember)}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={30}
                />
                <button type="submit" className="bl-cta-small" disabled={!newMember.trim()}>Aggiungi</button>
                <button type="button" className="bl-ghost-small" onClick={() => setAdding(false)}>Annulla</button>
              </div>
              <UserSuggestList items={sug.items} active={sug.active} empty={sug.empty} onPick={pickMember} onHover={sug.setActive} avatarMap={avatarMap} />
            </form>
          )}

          <div className="bl-group-members-list">
            {members.map((member) => {
              const isMemAdmin = String(member).toLowerCase() === String(adminUser).toLowerCase();
              const isMe = String(member).toLowerCase() === String(me?.username || "").toLowerCase();
              const memAvatar = avatarFor(member, avatarMap);
              return (
                <div key={member} className="bl-group-member-row">
                  <div className="bl-group-member-info">
                    <span className="bl-group-member-avatar">
                      <AvatarImage avatar={memAvatar} />
                    </span>
                    <button type="button" className="bl-user-link bl-group-member-name" onClick={() => { onClose(); openUserProfile(member); }}>
                      @{member}
                    </button>
                    {isMe && <span className="bl-group-me-tag">Tu</span>}
                    {isMemAdmin && <span className="bl-group-admin-tag">👑 Admin</span>}
                  </div>
                  {isAdmin && !isMe && (
                    <button
                      type="button"
                      className="bl-group-remove-btn"
                      onClick={() => onRemoveMember(member)}
                      title={`Rimuovi @${member} dal gruppo`}
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bl-group-modal-foot">
          {group?.isGroup && (
            <button type="button" className="bl-ghost bl-group-leave-btn" onClick={() => { onClose(); onLeaveGroup(); }}>
              Abbandona gruppo
            </button>
          )}
          <button type="button" className="bl-ghost" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

/* Modal per creare un nuovo gruppo da zero */
export function NewGroupModal({ me, avatarMap, onClose, onCreateGroup, onNotify }) {
  const [name, setName] = useState("");
  const [membersInput, setMembersInput] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const sug = useUserSuggest(membersInput, [...selectedMembers, me?.username]);

  function addMemberBadge(u) {
    const clean = u.trim().replace(/^@/, "");
    if (!clean) return;
    if (clean.toLowerCase() === String(me?.username || "").toLowerCase()) {
      onNotify?.("Sei già l'amministratore del gruppo.");
      return;
    }
    if (selectedMembers.map(m => m.toLowerCase()).includes(clean.toLowerCase())) {
      onNotify?.(`@${clean} è già selezionato.`);
      return;
    }
    setSelectedMembers(prev => [...prev, clean]);
    setMembersInput("");
  }

  function removeBadge(u) {
    setSelectedMembers(prev => prev.filter(m => m.toLowerCase() !== u.toLowerCase()));
  }

  function handleCreate(e) {
    e?.preventDefault();
    const gName = name.trim();
    if (!gName) {
      onNotify?.("Inserisci un nome per il gruppo.");
      return;
    }
    let finalMembers = [...selectedMembers];
    const typed = membersInput.trim().replace(/^@/, "");
    if (typed && !finalMembers.map(m => m.toLowerCase()).includes(typed.toLowerCase()) && typed.toLowerCase() !== String(me?.username).toLowerCase()) {
      finalMembers.push(typed);
    }
    if (!finalMembers.length) {
      onNotify?.("Aggiungi almeno un altro membro al gruppo.");
      return;
    }
    onCreateGroup(gName, finalMembers);
    onClose();
  }

  return (
    <div className="bl-group-modal-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bl-group-modal" role="dialog" aria-modal="true" aria-label="Crea nuovo gruppo">
        <div className="bl-group-modal-head">
          <div className="bl-group-modal-head-title">
            <span className="bl-group-modal-icon" aria-hidden="true"><Users size={22} /></span>
            <div>
              <h3>Nuovo Gruppo</h3>
              <p>Avvia una chat di gruppo come Amministratore</p>
            </div>
          </div>
          <button type="button" className="bl-sheet-x" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <form onSubmit={handleCreate} className="bl-new-group-form">
          <label className="bl-field-label">
            <span>Nome del gruppo</span>
            <input
              type="text"
              placeholder="Es. Amici di Bolle, Weekend…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </label>

          <label className="bl-field-label">
            <span>Aggiungi membri (@username)</span>
            <div className="bl-group-input-chips">
              <input
                type="text"
                placeholder="Digita @username e premi Invio"
                value={membersInput}
                onChange={(e) => setMembersInput(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (sug.onKeyDown(e, addMemberBadge)) return;
                  if ((e.key === "Enter" || e.key === "," || e.key === " ") && membersInput.trim()) {
                    e.preventDefault();
                    addMemberBadge(membersInput);
                  }
                }}
              />
              {membersInput.trim() && (
                <button type="button" className="bl-cta-small" onClick={() => addMemberBadge(membersInput)}>
                  Aggiungi
                </button>
              )}
            </div>
          </label>
          <UserSuggestList items={sug.items} active={sug.active} empty={sug.empty} onPick={addMemberBadge} onHover={sug.setActive} avatarMap={avatarMap} />

          {selectedMembers.length > 0 && (
            <div className="bl-selected-members-chips">
              {selectedMembers.map(m => (
                <span key={m} className="bl-member-chip">
                  <span className="bl-member-chip-avatar"><AvatarImage avatar={avatarFor(m, avatarMap)} /></span>
                  @{m}
                  <button type="button" onClick={() => removeBadge(m)} aria-label={`Rimuovi @${m}`}>×</button>
                </span>
              ))}
            </div>
          )}

          <div className="bl-group-admin-box is-admin">
            <p>👑 <strong>Diventerai l'amministratore del gruppo</strong> (avviando la chat per primo). Sarai l'unico autorizzato ad aggiungere o rimuovere membri.</p>
          </div>

          <div className="bl-group-modal-foot">
            <button type="button" className="bl-ghost" onClick={onClose}>Annulla</button>
            <button type="submit" className="bl-cta" disabled={!name.trim() || (!selectedMembers.length && !membersInput.trim())}>
              Crea gruppo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}