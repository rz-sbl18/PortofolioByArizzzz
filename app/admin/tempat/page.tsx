"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import PhotoManager from "@/components/admin/PhotoManager";

type Row = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visited_on: string | null;
  status: string;
  note: string | null;
  route_order: number;
  milestone_id: string | null;
  published: boolean;
};

const EMPTY = { name: "", lat: "", lng: "", visited_on: "", status: "visited", note: "", route_order: "", milestone_id: "", published: false };

export default function TempatAdmin() {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);
  const [milestones, setMilestones] = useState<{ id: string; year: number; title: string }[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [p, m] = await Promise.all([
      sb.from("places").select("*").order("route_order"),
      sb.from("milestones").select("id, year, title").order("sort_order"),
    ]);
    setRows((p.data ?? []) as Row[]);
    setMilestones(m.data ?? []);
  }, [sb]);

  useEffect(() => {
    load();
  }, [load]);

  function edit(r: Row) {
    setEditId(r.id);
    setMsg(null);
    setForm({
      name: r.name,
      lat: String(r.lat),
      lng: String(r.lng),
      visited_on: r.visited_on ?? "",
      status: r.status,
      note: r.note ?? "",
      route_order: String(r.route_order),
      milestone_id: r.milestone_id ?? "",
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
    const lat = parseFloat(form.lat.replace(",", "."));
    const lng = parseFloat(form.lng.replace(",", "."));
    if (!form.name.trim()) return setMsg({ ok: false, text: "Nama tempat wajib diisi." });
    if (Number.isNaN(lat) || lat < -90 || lat > 90) return setMsg({ ok: false, text: "Latitude harus angka antara -90 dan 90." });
    if (Number.isNaN(lng) || lng < -180 || lng > 180) return setMsg({ ok: false, text: "Longitude harus angka antara -180 dan 180." });

    const payload = {
      name: form.name.trim(),
      lat,
      lng,
      visited_on: form.visited_on || null,
      status: form.status,
      note: form.note.trim() || null,
      route_order: parseInt(form.route_order, 10) || 0,
      milestone_id: form.milestone_id || null,
      published: form.published,
    };

    setBusy(true);
    const res = editId
      ? await sb.from("places").update(payload).eq("id", editId).select().single()
      : await sb.from("places").insert(payload).select().single();
    setBusy(false);

    if (res.error) return setMsg({ ok: false, text: res.error.message });
    setMsg({ ok: true, text: editId ? "Perubahan disimpan." : "Tempat ditambahkan. Kamu bisa menambah foto di bawah." });
    setEditId(res.data.id);
    await load();
  }

  async function remove() {
    if (!editId || !window.confirm("Hapus tempat ini?")) return;
    const { error } = await sb.from("places").delete().eq("id", editId);
    if (error) return setMsg({ ok: false, text: error.message });
    reset();
    setMsg({ ok: true, text: "Tempat dihapus." });
    await load();
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="adm-page">
      <h1>Tempat (peta)</h1>

      <div className="adm-list">
        {rows.map((r) => (
          <div key={r.id} className="adm-row">
            <div className="t">
              <b>{r.route_order}. {r.name}</b>
              <span className="muted small mono">{r.status} · {r.lat.toFixed(3)}, {r.lng.toFixed(3)}</span>
            </div>
            <span className={`badge ${r.published ? "badge-pub" : ""}`}>{r.published ? "tampil" : "draf"}</span>
            <button className="btn" onClick={() => edit(r)}>Edit</button>
          </div>
        ))}
      </div>

      <form className="adm-box" onSubmit={save}>
        <b>{editId ? "Edit tempat" : "Tambah tempat"}</b>
        <div className="field"><label htmlFor="name">Nama tempat</label><input id="name" value={form.name} onChange={set("name")} /></div>
        <div className="two">
          <div className="field"><label htmlFor="lat">Latitude</label><input id="lat" inputMode="decimal" value={form.lat} onChange={set("lat")} placeholder="-6.3227" /></div>
          <div className="field"><label htmlFor="lng">Longitude</label><input id="lng" inputMode="decimal" value={form.lng} onChange={set("lng")} placeholder="107.3376" /></div>
        </div>
        <span className="hint muted small">
          Cara mencari koordinat: di Google Maps atau aplikasi peta, tekan lama di lokasi lalu salin dua angkanya (lat, lng).
        </span>
        <div className="two">
          <div className="field"><label htmlFor="st">Status</label>
            <select id="st" value={form.status} onChange={set("status")}>
              <option value="visited">Sudah dikunjungi</option>
              <option value="wishlist">Ingin dikunjungi</option>
            </select></div>
          <div className="field"><label htmlFor="date">Tanggal kunjungan</label><input id="date" type="date" value={form.visited_on} onChange={set("visited_on")} /></div>
        </div>
        <div className="field"><label htmlFor="ro">Urutan rute</label><input id="ro" inputMode="numeric" value={form.route_order} onChange={set("route_order")} /><span className="hint">Rute digambar berurutan dari angka kecil ke besar.</span></div>
        <div className="field"><label htmlFor="note">Cerita singkat</label><textarea id="note" value={form.note} onChange={set("note")} /></div>
        <div className="field"><label htmlFor="ms">Terkait milestone (opsional)</label>
          <select id="ms" value={form.milestone_id} onChange={set("milestone_id")}>
            <option value="">— tidak ada —</option>
            {milestones.map((m) => <option key={m.id} value={m.id}>{m.year} · {m.title}</option>)}
          </select></div>
        <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />Tampilkan di website</label>
        {msg && <div className={`msg ${msg.ok ? "msg-ok" : "msg-err"}`} role="status">{msg.text}</div>}
        <div className="btns">
          <button className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : editId ? "Simpan perubahan" : "Tambah"}</button>
          {editId && <button type="button" className="btn" onClick={reset}>Batal / baru</button>}
          {editId && <button type="button" className="btn btn-danger" onClick={remove}>Hapus</button>}
        </div>
      </form>

      {editId && <PhotoManager table="place_photos" fkColumn="place_id" parentId={editId} folder="places" />}
    </div>
  );
}
