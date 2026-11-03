"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import PhotoManager from "@/components/admin/PhotoManager";
import { cleanUrl } from "@/lib/image";

type Row = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  status: string;
  year: number | null;
  role: string | null;
  problem: string | null;
  solution: string | null;
  features: string[] | null;
  challenges: string | null;
  learnings: string | null;
  tech: string[] | null;
  github_url: string | null;
  demo_url: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  sort_order: number;
  published: boolean;
};

const EMPTY = {
  title: "", slug: "", summary: "", category: "Web Development", status: "planning", year: "", role: "",
  problem: "", solution: "", features: "", challenges: "", learnings: "", tech: "",
  github_url: "", demo_url: "", featured: false, sort_order: "", published: false,
};

const STATUSES = [
  ["planning", "Planning"],
  ["in_progress", "In Progress"],
  ["completed", "Completed"],
  ["archived", "Archived"],
];
const CATEGORIES = ["Web Development", "Mobile Development", "Desktop Application", "Database", "UI/UX", "IoT", "Game Development", "Research", "Academic Projects", "Personal Projects"];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function ProyekAdmin() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from("projects").select("*").order("sort_order").order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  }, [sb]);

  useEffect(() => {
    load();
  }, [load]);

  function edit(r: Row) {
    setEditId(r.id);
    setMsg(null);
    setSlugTouched(true);
    setCover(r.thumbnail_url);
    setForm({
      title: r.title,
      slug: r.slug,
      summary: r.summary ?? "",
      category: r.category ?? "",
      status: r.status,
      year: r.year ? String(r.year) : "",
      role: r.role ?? "",
      problem: r.problem ?? "",
      solution: r.solution ?? "",
      features: (r.features ?? []).join("\n"),
      challenges: r.challenges ?? "",
      learnings: r.learnings ?? "",
      tech: (r.tech ?? []).join(", "),
      github_url: r.github_url ?? "",
      demo_url: r.demo_url ?? "",
      featured: r.featured,
      sort_order: String(r.sort_order),
      published: r.published,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function reset() {
    setEditId(null);
    setCover(null);
    setSlugTouched(false);
    setForm({ ...EMPTY });
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "title" && !slugTouched) next.slug = slugify(v);
      return next;
    });
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.title.trim()) return setMsg({ ok: false, text: "Judul wajib diisi." });
    const slug = slugify(form.slug);
    if (!slug) return setMsg({ ok: false, text: "Slug (alamat halaman) wajib diisi." });
    const year = form.year ? parseInt(form.year, 10) : null;
    if (form.year && (!year || year < 2000 || year > 2100)) return setMsg({ ok: false, text: "Tahun tidak valid." });
    const gh = cleanUrl(form.github_url);
    const demo = cleanUrl(form.demo_url);
    if ((gh && !/^https:\/\//.test(gh)) || (demo && !/^https:\/\//.test(demo)))
      return setMsg({ ok: false, text: "Tautan harus diawali https://" });

    const payload = {
      title: form.title.trim(),
      slug,
      summary: form.summary.trim() || null,
      category: form.category.trim() || null,
      status: form.status,
      year,
      role: form.role.trim() || null,
      problem: form.problem.trim() || null,
      solution: form.solution.trim() || null,
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      challenges: form.challenges.trim() || null,
      learnings: form.learnings.trim() || null,
      tech: form.tech.split(",").map((s) => s.trim()).filter(Boolean),
      github_url: gh || null,
      demo_url: demo || null,
      featured: form.featured,
      sort_order: parseInt(form.sort_order, 10) || 0,
      published: form.published,
    };

    setBusy(true);
    const res = editId
      ? await sb.from("projects").update(payload).eq("id", editId).select().single()
      : await sb.from("projects").insert(payload).select().single();
    setBusy(false);

    if (res.error) {
      const dup = res.error.code === "23505";
      return setMsg({ ok: false, text: dup ? "Slug sudah dipakai proyek lain. Ganti dengan yang berbeda." : res.error.message });
    }
    setMsg({ ok: true, text: editId ? "Perubahan disimpan." : "Proyek ditambahkan. Kamu bisa menambah screenshot di bawah." });
    setEditId(res.data.id);
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug, github_url: gh, demo_url: demo }));
    await load();
  }

  async function remove() {
    if (!editId || !window.confirm("Hapus proyek ini? Milestone yang terkait tidak ikut terhapus.")) return;
    const { error } = await sb.from("projects").delete().eq("id", editId);
    if (error) return setMsg({ ok: false, text: error.message });
    reset();
    setMsg({ ok: true, text: "Proyek dihapus." });
    await load();
  }

  async function setCoverUrl(url: string) {
    if (!editId) return;
    const { error } = await sb.from("projects").update({ thumbnail_url: url }).eq("id", editId);
    if (error) return setMsg({ ok: false, text: error.message });
    setCover(url);
    setMsg({ ok: true, text: "Sampul proyek diperbarui." });
    await load();
  }

  return (
    <div className="adm-page">
      <h1>Proyek</h1>

      <div className="adm-list">
        {rows.map((r) => (
          <div key={r.id} className="adm-row">
            <div className="t">
              <b>{r.title}</b>
              <span className="muted small mono">{r.status} · /proyek/{r.slug}</span>
            </div>
            <span className={`badge ${r.published ? "badge-pub" : ""}`}>{r.published ? "tampil" : "draf"}</span>
            <button className="btn" onClick={() => edit(r)}>Edit</button>
          </div>
        ))}
      </div>

      <form className="adm-box" onSubmit={save}>
        <b>{editId ? "Edit proyek" : "Tambah proyek"}</b>
        <div className="field"><label htmlFor="title">Judul</label><input id="title" value={form.title} onChange={set("title")} /></div>
        <div className="field"><label htmlFor="slug">Slug (alamat halaman)</label><input id="slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug")(e); }} /><span className="hint">Terisi otomatis dari judul. Hanya huruf kecil, angka, dan tanda hubung.</span></div>
        <div className="field"><label htmlFor="sum">Ringkasan (1-2 kalimat)</label><textarea id="sum" value={form.summary} onChange={set("summary")} /></div>
        <div className="two">
          <div className="field"><label htmlFor="cat">Kategori</label><input id="cat" list="cats" value={form.category} onChange={set("category")} /><datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></div>
          <div className="field"><label htmlFor="st">Status</label><select id="st" value={form.status} onChange={set("status")}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <div className="two">
          <div className="field"><label htmlFor="yr">Tahun</label><input id="yr" inputMode="numeric" value={form.year} onChange={set("year")} /></div>
          <div className="field"><label htmlFor="rl">Peranmu</label><input id="rl" value={form.role} onChange={set("role")} placeholder="Contoh: Fullstack developer (kelompok 4 orang)" /></div>
        </div>
        <div className="field"><label htmlFor="tech">Teknologi (pisahkan dengan koma)</label><input id="tech" value={form.tech} onChange={set("tech")} placeholder="Laravel, MySQL, Bootstrap" /></div>
        <div className="field"><label htmlFor="pb">Masalah yang diselesaikan</label><textarea id="pb" value={form.problem} onChange={set("problem")} /></div>
        <div className="field"><label htmlFor="sl">Solusi</label><textarea id="sl" value={form.solution} onChange={set("solution")} /></div>
        <div className="field"><label htmlFor="ft">Fitur utama (satu fitur per baris)</label><textarea id="ft" value={form.features} onChange={set("features")} /></div>
        <div className="field"><label htmlFor="ch">Tantangan teknis</label><textarea id="ch" value={form.challenges} onChange={set("challenges")} /></div>
        <div className="field"><label htmlFor="lr">Yang kupelajari</label><textarea id="lr" value={form.learnings} onChange={set("learnings")} /></div>
        <div className="field"><label htmlFor="gh">Tautan GitHub (kosongkan kalau belum ada)</label><input id="gh" value={form.github_url} onChange={set("github_url")} /></div>
        <div className="field"><label htmlFor="dm">Tautan demo (opsional)</label><input id="dm" value={form.demo_url} onChange={set("demo_url")} /></div>
        <div className="field"><label htmlFor="so">Urutan</label><input id="so" inputMode="numeric" value={form.sort_order} onChange={set("sort_order")} /><span className="hint">Angka kecil tampil lebih dulu.</span></div>
        <label className="check"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />Proyek unggulan (tampil di beranda)</label>
        <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />Tampilkan di website</label>
        <span className="hint muted small">Status harus sesuai kenyataan. Adanya repository GitHub tidak otomatis berarti proyek selesai.</span>
        {msg && <div className={`msg ${msg.ok ? "msg-ok" : "msg-err"}`} role="status">{msg.text}</div>}
        <div className="btns">
          <button className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : editId ? "Simpan perubahan" : "Tambah"}</button>
          {editId && <button type="button" className="btn" onClick={reset}>Batal / baru</button>}
          {editId && <button type="button" className="btn btn-danger" onClick={remove}>Hapus</button>}
        </div>
      </form>

      {editId && (
        <PhotoManager
          table="project_images"
          fkColumn="project_id"
          parentId={editId}
          folder="projects"
          coverUrl={cover}
          onSetCover={setCoverUrl}
        />
      )}
    </div>
  );
}
