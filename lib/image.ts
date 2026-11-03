// Perkecil dan ubah gambar ke WebP supaya hemat kuota dan cepat dibuka
export async function toWebp(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal memproses gambar"))), "image/webp", quality)
  );
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Ambil path file dari URL publik Supabase Storage
export function storagePath(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? url.slice(i + marker.length) : null;
}

// Hapus parameter pelacak dari tautan (misalnya ?utm_source=... atau ?igsh=...)
export function cleanUrl(u: string): string {
  const s = u.trim();
  if (!s) return "";
  try {
    const url = new URL(s);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return s;
  }
}
