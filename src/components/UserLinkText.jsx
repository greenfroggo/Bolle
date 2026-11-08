import React from "react";

export function openUserProfile(username) {
  window.dispatchEvent(new CustomEvent("bolle:open-profile", { detail: { username: String(username || "").replace(/^@/, "") } }));
}

export default function UserLinkText({ text }) {
  const parts = String(text || "").split(/(@[a-zA-Z0-9_]{3,20})/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <button
            key={i}
            type="button"
            className="bl-user-link"
            onClick={(e) => {
              e.stopPropagation();
              openUserProfile(p.slice(1));
            }}
          >
            {p}
          </button>
        ) : (
          p
        )
      )}
    </>
  );
}
