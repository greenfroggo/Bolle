import { supabase, BUCKET } from "./bolleCore.jsx";

const signedUrlCache = new Map();

export async function cachedSignedUrl(path, ttl = 3600) {
  if (!path) return null;
  const hit = signedUrlCache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttl);
  if (error || !data?.signedUrl) return null;
  signedUrlCache.set(path, { url: data.signedUrl, exp: Date.now() + Math.max(60, ttl - 300) * 1000 });
  return data.signedUrl;
}

/* Riduce le foto prima del caricamento: un'immagine da 4-8 MB diventa ~300 KB e si apre molto più in fretta. */
export async function downscaleImage(file, maxSide = 1600, quality = 0.82) {
  try {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 350 * 1024) return file;
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bitmap = await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = reject;
        img.src = url;
      });
    }
    const w = bitmap.width || bitmap.naturalWidth, h = bitmap.height || bitmap.naturalHeight;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
