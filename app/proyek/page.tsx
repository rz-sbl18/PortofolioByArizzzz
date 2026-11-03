import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "./proyek.css";

export const metadata = { title: "Proyek — Muhamad Rizki" };
export const revalidate = 60;

type Project = {
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  status: string;
  year: number | null;
  tech: string[] | null;
  thumbnail_url: string | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "✓ Completed", cls: "green" },
  in_progress: { label: "◐ In Progress", cls: "amber" },
  planning: { label: "◌ Planning", cls: "muted" },
  archived: { label: "Archived", cls: "muted" },
};

function href(kategori?: string, status?: string) {
  const q = new URLSearchParams();
  if (kategori) q.set("kategori", kategori);
  if (status) q.set("status", status);
  const s = q.toString();
  return s ? `/proyek?${s}` : "/proyek";
}

export default async function ProyekPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; status?: string }>;
}) {
  const { kategori, status } = await searchParams;

  let query = supabase
    .from("projects")
    .select("slug, title, summary, category, status, year, tech, thumbnail_url")
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (kategori) query = query.eq("category", kategori);
  if (status) query = query.eq("status", status);

  const [listRes, catRes] = await Promise.all([
    query,
    supabase.from("projects").select("category"),
  ]);

  const projects = (listRes.data ?? []) as unknown as Project[];
  const categories = [
    ...new Set((catRes.data ?? []).map((r) => r.category).filter(Boolean)),
  ] as string[];

  return (
    <div className="container">
      <header className="p-head">
        <div className="mono muted a1" style={{ fontSize: 13 }}>&gt; ls projects/</div>
        <h1 className="a2">
          Proyek <span className="serif amber">yang kubuat</span>
        </h1>
        <p className="muted a3" style={{ margin: 0, maxWidth: 560 }}>
          Tugas kuliah dan project pribadi. Status ditampilkan apa adanya.
        </p>
      </header>

      <div className="filters">
        <div className="filter-row">
          <span className="filter-label">Kategori</span>
          <Link href={href(undefined, status)} className={!kategori ? "pill pill-active" : "pill"}>Semua</Link>
          {categories.map((c) => (
            <Link key={c} href={href(c, status)} className={kategori === c ? "pill pill-active" : "pill"}>
              {c}
            </Link>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-label">Status</span>
          <Link href={href(kategori)} className={!status ? "pill pill-active" : "pill"}>Semua</Link>
          {Object.entries(STATUS).map(([key, v]) => (
            <Link key={key} href={href(kategori, key)} className={status === key ? "pill pill-active" : "pill"}>
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      {listRes.error && <p className="muted small">Data belum bisa dimuat. Coba muat ulang nanti.</p>}

      <div className="grid2">
        {projects.map((p) => {
          const st = STATUS[p.status] ?? STATUS.planning;
          return (
            <Link key={p.slug} href={`/proyek/${p.slug}`} className="card p-card rv">
              <div className="thumb">
                {p.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_url} alt={`Tampilan proyek ${p.title}`} loading="lazy" />
                ) : (
                  "[ screenshot menyusul ]"
                )}
              </div>
              <div className="card-body">
                <div className="row">
                  <span className="muted small">{p.category}{p.year ? ` · ${p.year}` : ""}</span>
                  <span className={`status ${st.cls}`}>{st.label}</span>
                </div>
                <h3>{p.title}</h3>
                <span className="muted" style={{ fontSize: 14 }}>{p.summary}</span>
                {p.tech && p.tech.length > 0 && (
                  <div className="tech">{p.tech.map((t) => <span key={t}>{t}</span>)}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {projects.length === 0 && !listRes.error && (
        <p className="muted">Tidak ada proyek untuk filter ini. <Link href="/proyek" className="amber">Tampilkan semua</Link></p>
      )}
    </div>
  );
}
