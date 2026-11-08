import React from "react";
import { supabase } from "../lib/bolleCore.jsx";

export const AVATAR_BUCKET = "avatars";

export default function AvatarImage({ avatar, className = "" }) {
  const photo = typeof avatar === "string" && avatar.startsWith("photo:");
  const path = photo ? avatar.slice(6) : "";
  const url = photo && /^[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/.test(path)
    ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
    : null;
  return url ? (
    <img className={`bl-avatar-photo ${className}`} src={url} alt="Avatar" referrerPolicy="no-referrer" />
  ) : (
    <span aria-hidden="true">{photo ? "🫧" : (avatar || "🫧")}</span>
  );
}
