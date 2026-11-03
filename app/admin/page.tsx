"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const TABLES = [
  { table: "projects", label: "Proyek" },
  { table: "milestones", label: "Milestone" },
  { table: "places", label: "Tempat" },
  { table: "skills", label: "Skill" },
];

export default function AdminHome() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const sb = supabaseBrowser();
    TABLES.forEach(async (t) => {
      const { count } = await sb.from(t.table).select("id", { count: "exact", head: true });
      setCounts((c) => ({ ...c, [t.table]: count ?? 0 }));
    });
  }, []);

  return (
    <div className="adm-page">
      <h1>Dashboard</h1>
      <div className="stat">
        {TABLES.map((t) => (
          <div key={t.table}>
            <b>{counts[t.table] ?? "…"}</b>
            <span className="muted small">{t.label}</span>
          </div>
        ))}
      </div>
      <div className="adm-box">
        <b>Kelola konten</b>
        <div className="btns">
          <Link className="pill" href="/admin/profil">Profil, foto &amp; CV</Link>
          <Link className="pill" href="/admin/proyek">Proyek &amp; screenshot</Link>
          <Link className="pill" href="/admin/milestone">Milestone &amp; foto</Link>
          <Link className="pill" href="/admin/tempat">Tempat &amp; foto</Link>
          <Link className="pill" href="/">Lihat website</Link>
        </div>
      </div>
    </div>
  );
}
