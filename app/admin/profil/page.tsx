"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { toWebp, IMAGE_TYPES, storagePath, cleanUrl } from "@/lib/image";

type Profile = {
  full_name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  cv_url: string | null;
  photo_url: string | null;
};

const EMPTY = { full_name: "", headline: "", bio: "", email: "", github_url: "", linkedin_url: "", instagram_url: "" };

export default function ProfilAdmin() {
  const sb = supabaseBrowser();
  const [form, setForm] = useState({ ...EMPTY });
  const [photo, setPhoto] = useState<string | null>(null);
  const [cv, setCv] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("profile").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      const p = data as Profile | null;
      if (!p) return;
      setForm({
        full_name: p.full_name ?? "",
        headline: p.headline ?? "",
        bio: p.bio ?? "",
        email: p.email ?? "",
        github_url: p.github_url ?? "",
        linkedin_url: p.linkedin_url ?? "",
        instagram_url: p.instagram_url ?? "",
      });
      setPhoto(p.photo_url);
      setCv(p.cv_url);
    });
  }, [sb]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.full_name.trim()) return setMsg({ ok: false, text: "Nama wajib diisi." });
    const urls = { github_url: cleanUrl(form.github_url), linkedin_url: cleanUrl(form.linkedin_url), instagram_url: cleanUrl(form.instagram_url) };
    for (const [k, v] of Object.entries(urls)) {
      if (v && !/^https:\/\//.test(v)) return setMsg({ ok: false, text: `Tautan ${k.replace("_url", "")} harus diawali https://` });
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setMsg({ ok: false, text: "Format email tidak valid." });

    setBusy(true);
    const { error } = await sb
      .from("profile")
      .update({
        full_name: form.full_name.trim(),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        email: form.email.trim() || null,
        github_url: urls.github_url || null,
        linkedin_url: urls.linkedin_url || null,
        instagram_url: urls.instagram_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setForm((f) => ({ ...f, ...urls }));
    setMsg({ ok: true, text: "Profil disimpan. Tautan sosial otomatis dibersihkan dari kode pelacak." });
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    if (!IMAGE_TYPES.includes(file.type)) return setMsg({ ok: false, text: "Format harus JPG, PNG, atau WebP." });
    setBusy(true);
    try {
      const blob = await toWebp(file, 1000, 0.85);
      const path = `profile/${crypto.randomUUID()}.webp`;
      const up = await sb.storage.from("photos").upload(path, blob, { contentType: "image/webp" });
      if (up.error) throw up.error;
      const url = sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
      const upd = await sb.from("profile").update({ photo_url: url }).eq("id", 1);
      if (upd.error) throw upd.error;
      const old = photo ? storagePath(photo, "photos") : null;
      if (old) await sb.storage.from("photos").remove([old]);
      setPhoto(url);
      setMsg({ ok: true, text: "Foto profil diperbarui." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Gagal mengunggah foto." });
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    if (!photo || !window.confirm("Hapus foto profil?")) return;
    const path = storagePath(photo, "photos");
    if (path) await sb.storage.from("photos").remove([path]);
    await sb.from("profile").update({ photo_url: null }).eq("id", 1);
    setPhoto(null);
  }

  async function uploadCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    if (file.type !== "application/pdf") return setMsg({ ok: false, text: "CV harus berformat PDF." });
    if (file.size > 5 * 1024 * 1024) return setMsg({ ok: false, text: "CV maksimal 5 MB." });
    setBusy(true);
    try {
      const path = `cv/${crypto.randomUUID()}.pdf`;
      const up = await sb.storage.from("cv").upload(path, file, { contentType: "application/pdf" });
      if (up.error) throw up.error;
      const url = sb.storage.from("cv").getPublicUrl(path).data.publicUrl;
      const upd = await sb.from("profile").update({ cv_url: url }).eq("id", 1);
      if (upd.error) throw upd.error;
      const old = cv ? storagePath(cv, "cv") : null;
      if (old) await sb.storage.from("cv").remove([old]);
      setCv(url);
      setMsg({ ok: true, text: "CV diperbarui." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Gagal mengunggah CV." });
    } finally {
      setBusy(false);
    }
  }

  async function removeCv() {
    if (!cv || !window.confirm("Hapus CV?")) return;
    const path = storagePath(cv, "cv");
    if (path) await sb.storage.from("cv").remove([path]);
    await sb.from("profile").update({ cv_url: null }).eq("id", 1);
    setCv(null);
  }

  return (
    <div className="adm-page">
      <h1>Profil</h1>

      <div className="adm-box">
        <b>Foto profil</b>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Foto profil saat ini" style={{ width: 160, height: 190, objectFit: "cover", borderRadius: 20, border: "1px solid var(--line2)" }} />
        ) : (
          <span className="muted small">Belum ada foto profil.</span>
        )}
        <div className="field">
          <label htmlFor="pfoto">Pilih foto (JPG, PNG, atau WebP)</label>
          <input id="pfoto" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} disabled={busy} />
          <span className="hint">Foto bagian dada ke atas dengan latar sederhana paling cocok untuk bingkai portrait.</span>
        </div>
        {photo && <div className="btns"><button type="button" className="btn btn-danger" onClick={removePhoto}>Hapus foto</button></div>}
      </div>

      <div className="adm-box">
        <b>CV</b>
        {cv ? <a href={cv} target="_blank" rel="noopener noreferrer" className="amber">Lihat CV saat ini →</a> : <span className="muted small">Belum ada CV.</span>}
        <div className="field">
          <label htmlFor="pcv">Pilih file PDF (maksimal 5 MB)</label>
          <input id="pcv" type="file" accept="application/pdf" onChange={uploadCv} disabled={busy} />
        </div>
        {cv && <div className="btns"><button type="button" className="btn btn-danger" onClick={removeCv}>Hapus CV</button></div>}
      </div>

      <form className="adm-box" onSubmit={save}>
        <b>Data profil</b>
        <div className="field"><label htmlFor="fn">Nama</label><input id="fn" value={form.full_name} onChange={set("full_name")} /></div>
        <div className="field"><label htmlFor="hl">Headline</label><input id="hl" value={form.headline} onChange={set("headline")} /></div>
        <div className="field"><label htmlFor="bio">Bio (halaman Tentang)</label><textarea id="bio" value={form.bio} onChange={set("bio")} /></div>
        <div className="field"><label htmlFor="em">Email (kosongkan kalau tidak ingin ditampilkan)</label><input id="em" type="email" value={form.email} onChange={set("email")} /></div>
        <div className="field"><label htmlFor="gh">GitHub</label><input id="gh" value={form.github_url} onChange={set("github_url")} placeholder="https://github.com/rz-sbl18" /></div>
        <div className="field"><label htmlFor="li">LinkedIn</label><input id="li" value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://www.linkedin.com/in/..." /></div>
        <div className="field"><label htmlFor="ig">Instagram</label><input id="ig" value={form.instagram_url} onChange={set("instagram_url")} placeholder="https://www.instagram.com/..." /></div>
        {msg && <div className={`msg ${msg.ok ? "msg-ok" : "msg-err"}`} role="status">{msg.text}</div>}
        <div className="btns"><button className="btn btn-primary" disabled={busy}>{busy ? "Memproses…" : "Simpan profil"}</button></div>
      </form>
    </div>
  );
}
