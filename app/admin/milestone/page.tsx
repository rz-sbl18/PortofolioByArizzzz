"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import PhotoManager from "@/components/admin/PhotoManager";

type Row = {
  id: string;
  year: number;
  title: string;
  story: string | null;
  category: string;
  status: string;
  sort_order: number;
  project_id: string | null;
  published: boolean;
};

const EMPTY = { year: "", title: "", story: "", category: "personal_growth", status: "coming_soon", sort_order: "", project_id: "", published: false };

const CATEGORIES = [
  ["education", "Education"],
  ["career", "Career"],
  ["project", "Project"],
  ["achievement", "Achievement"],
  ["organization", "Organization"],
  ["personal_growth", "Personal Growth"],
  ["life_goals", "Life Goals"],
];
const STATUSES = [
  ["completed", "Completed (sudah terjadi)"],
  ["in_progress", "In Progress (sedang berjalan)"],
  ["coming_soon", "Coming Soon (target)"],
];

export default function MilestoneAdmin() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([
      sb.from("milestones").select("*").order("sort_order"),
      sb.from("projects").select("id, title").order("title"),
    ]);
    setRows((m.data ?? []) as Row[]);
    setProjects(p.data ?? []);
  }, [sb]);

  useEffect(() => {
    load();
  }, [load]);

  function edit(r: Row) {
    setEditId(r.id);
    setMsg(null);
    setForm({
      year: String(r.year),
      title: r.title,
      story: r.story ?? "",
      category: r.category,
      status: r.status,
      sort_order: String(r.sort_order),
      project_id: r.project_id ?? "",
      published: r.published,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function reset() {
    setEditId(null);
    setForm({ ...EMPTY });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const year = parseInt(form.year, 10);
    if (!year || year < 1990 || year > 2100) return setMsg({ ok: false, text: "Tahun tidak valid." });
    if (!form.title.trim()) return setMsg({ ok: false, text: "Judul wajib diisi." });

    const payload = {
      year,
      title: form.title.trim(),
      story: form.story.trim() || null,
      category: form.category,
      status: form.status,
      sort_order: parseInt(form.sort_order, 10) || 0,
      project_id: form.project_id || null,
      published: form.published,
    };

    setBusy(true);
    const res = editId
      ? await sb.from("milestones").update(payload).eq("id", editId).select().single()
      : await sb.from("milestones").insert(payload).select().single();
    setBusy(false);

    if (res.error) return setMsg({ ok: false, text: res.error.message });
    setMsg({ ok: true, text: editId ? "Perubahan disimpan." : "Milestone ditambahkan. Kamu bisa menambah foto di bawah." });
    setEditId(res.data.id);
    await load();
  }

  async function remove() {
    if (!editId || !window.confirm("Hapus milestone ini beserta fotonya dari daftar?")) return;
    const { error } = await sb.from("milestones").delete().eq("id", editId);
    if (error) return setMsg({ ok: false, text: error.message });
    reset();
    setMsg({ ok: true, text: "Milestone dihapus." });
    await load();
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="adm-page">
      <h1>Milestone</h1>

      <div className="adm-list">
        {rows.map((r) => (
          <div key={r.id} className="adm-row">
            <div className="t">
              <b>{r.year} · {r.title}</b>
              <span className="muted small mono">{r.status} · urutan {r.sort_order}</span>
            </div>
            <span className={`badge ${r.published ? "badge-pub" : ""}`}>{r.published ? "tampil" : "draf"}</span>
            <button className="btn" onClick={() => edit(r)}>Edit</button>
          </div>
        ))}
      </div>

      <form className="adm-box" onSubmit={save}>
        <b>{editId ? "Edit milestone" : "Tambah milestone"}</b>
        <div className="two">
          <div className="field"><label htmlFor="year">Tahun</label><input id="year" inputMode="numeric" value={form.year} onChange={set("year")} /></div>
          <div className="field"><label htmlFor="so">Urutan</label><input id="so" inputMode="numeric" value={form.sort_order} onChange={set("sort_order")} /><span className="hint">Angka kecil tampil lebih dulu.</span></div>
        </div>
        <div className="field"><label htmlFor="title">Judul</label><input id="title" value={form.title} onChange={set("title")} /></div>
        <div className="field"><label htmlFor="story">Cerita</label><textarea id="story" value={form.story} onChange={set("story")} /></div>
        <div className="two">
          <div className="field"><label htmlFor="cat">Kategori</label>
            <select id="cat" value={form.category} onChange={set("category")}>{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="field"><label htmlFor="st">Status</label>
            <select id="st" value={form.status} onChange={set("status")}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <div className="field"><label htmlFor="pr">Terkait proyek (opsional)</label>
          <select id="pr" value={form.project_id} onChange={set("project_id")}>
            <option value="">— tidak ada —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select></div>
        <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />Tampilkan di website</label>
        <span className="hint muted small">Target masa depan harus berstatus Coming Soon. Fotonya tidak akan ditampilkan untuk status itu.</span>
        {msg && <div className={`msg ${msg.ok ? "msg-ok" : "msg-err"}`} role="status">{msg.text}</div>}
        <div className="btns">
          <button className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : editId ? "Simpan perubahan" : "Tambah"}</button>
          {editId && <button type="button" className="btn" onClick={reset}>Batal / baru</button>}
          {editId && <button type="button" className="btn btn-danger" onClick={remove}>Hapus</button>}
        </div>
      </form>

      {editId && <PhotoManager table="milestone_photos" fkColumn="milestone_id" parentId={editId} folder="milestones" />}
    </div>
  );
}
