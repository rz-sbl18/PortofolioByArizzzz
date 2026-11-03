"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { toWebp, IMAGE_TYPES, storagePath } from "@/lib/image";

type Photo = { id: string; url: string; alt: string; sort_order: number };

type Props = {
  table: "milestone_photos" | "place_photos" | "project_images";
  fkColumn: "milestone_id" | "place_id" | "project_id";
  parentId: string;
  folder: "milestones" | "places" | "projects";
  // Opsional: tombol "Jadikan sampul" (dipakai untuk proyek)
  coverUrl?: string | null;
  onSetCover?: (url: string) => void;
};

export default function PhotoManager({ table, fkColumn, parentId, folder, coverUrl, onSetCover }: Props) {
  const sb = supabaseBrowser();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from(table).select("id, url, alt, sort_order").eq(fkColumn, parentId).order("sort_order");
    setPhotos((data ?? []) as Photo[]);
  }, [sb, table, fkColumn, parentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    if (!alt.trim()) return setMsg({ ok: false, text: "Isi deskripsi foto (teks alternatif) dulu sebelum memilih file." });
    if (!IMAGE_TYPES.includes(file.type)) return setMsg({ ok: false, text: "Format harus JPG, PNG, atau WebP." });
    if (file.size > 15 * 1024 * 1024) return setMsg({ ok: false, text: "File terlalu besar (maksimal 15 MB)." });

    setBusy(true);
    try {
      const blob = await toWebp(file);
      if (blob.size > 5 * 1024 * 1024) throw new Error("Hasil kompres masih lebih dari 5 MB.");
      const path = `${folder}/${parentId}/${crypto.randomUUID()}.webp`;
      const up = await sb.storage.from("photos").upload(path, blob, { contentType: "image/webp" });
      if (up.error) throw up.error;
      const { data: pub } = sb.storage.from("photos").getPublicUrl(path);
      const next = photos.length ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 1;
      const ins = await sb.from(table).insert({ [fkColumn]: parentId, url: pub.publicUrl, alt: alt.trim(), sort_order: next });
      if (ins.error) throw ins.error;
      setAlt("");
      setMsg({ ok: true, text: "Foto berhasil diunggah." });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Gagal mengunggah foto." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Photo) {
    if (!window.confirm("Hapus foto ini?")) return;
    const path = storagePath(p.url, "photos");
    if (path) await sb.storage.from("photos").remove([path]);
    const { error } = await sb.from(table).delete().eq("id", p.id);
    if (error) return setMsg({ ok: false, text: error.message });
    await load();
  }

  async function move(index: number, dir: -1 | 1) {
    const a = photos[index];
    const b = photos[index + dir];
    if (!a || !b) return;
    await sb.from(table).update({ sort_order: b.sort_order }).eq("id", a.id);
    await sb.from(table).update({ sort_order: a.sort_order }).eq("id", b.id);
    await load();
  }

  return (
    <div className="adm-box">
      <b>Foto</b>
      <div className="field">
        <label htmlFor="alt">Deskripsi foto (wajib, untuk aksesibilitas)</label>
        <input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Contoh: Halaman pemesanan tiket di tampilan ponsel" />
      </div>
      <div className="field">
        <label htmlFor="file">Pilih foto (JPG, PNG, atau WebP)</label>
        <input id="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={busy} />
        <span className="hint">Foto otomatis diperkecil ke WebP maksimal 1600 px.</span>
      </div>
      {busy && <div className="msg msg-ok">Mengunggah…</div>}
      {msg && <div className={`msg ${msg.ok ? "msg-ok" : "msg-err"}`} role="status">{msg.text}</div>}

      {photos.length === 0 ? (
        <span className="muted small">Belum ada foto.</span>
      ) : (
        <div className="ph-grid">
          {photos.map((p, i) => (
            <div key={p.id} className="ph-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.alt} />
              <div className="cap">
                {p.alt}
                {coverUrl === p.url && <span className="amber"> · sampul</span>}
              </div>
              <div className="acts">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Geser maju">←</button>
                <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Geser mundur">→</button>
                {onSetCover && (
                  <button onClick={() => onSetCover(p.url)} aria-label="Jadikan sampul">★</button>
                )}
                <button onClick={() => remove(p)} aria-label="Hapus foto">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
