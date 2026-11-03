import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import "../proyek.css";

export const revalidate = 60;

type Detail = {
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
  project_images: { url: string; alt: string; sort_order: number }[];
};

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "✓ Completed", cls: "green" },
  in_progress: { label: "◐ In Progress", cls: "amber" },
  planning: { label: "◌ Planning", cls: "muted" },
  archived: { label: "Archived", cls: "muted" },
};

async function getProject(slug: string) {
  const { data } = await supabase
    .from("projects")
    .select("*, project_images(url, alt, sort_order)")
    .eq("slug", slug)
    .maybeSingle();
  return data as unknown as Detail | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  return {
    title: p ? `${p.title} — Muhamad Rizki` : "Proyek — Muhamad Rizki",
    description: p?.summary ?? undefined,
  };
}

export default async function ProyekDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) notFound();

  const { data: related } = await supabase
    .from("milestones")
    .select("year, title")
    .eq("project_id", p.id)
    .order("sort_order");

  const st = STATUS[p.status] ?? STATUS.planning;
  const images = [...(p.project_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const hasDetail = p.problem || p.solution || p.challenges || p.learnings || (p.features && p.features.length > 0);

  return (
    <div className="container">
      <header className="d-head">
        <Link href="/proyek" className="amber" style={{ fontSize: 14 }}>← Semua proyek</Link>
        <div className="meta">
          <span>{p.category}</span>
          {p.year && <span>{p.year}</span>}
          {p.role && <span>Peran: {p.role}</span>}
          <span className={st.cls}>{st.label}</span>
        </div>
        <h1>{p.title}</h1>
        {p.summary && <p className="muted" style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{p.summary}</p>}
        {p.tech && p.tech.length > 0 && (
          <div className="tech">{p.tech.map((t) => <span key={t}>{t}</span>)}</div>
        )}
        <div className="link-row">
          {p.github_url ? (
            <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="pill pill-fill">Source code (GitHub)</a>
          ) : (
            <span className="pill pill-off">Repository menyusul</span>
          )}
          {p.demo_url && (
            <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="pill">Lihat demo</a>
          )}
        </div>
      </header>

      {images.length > 0 ? (
        <div className="gallery">
          {images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.url} src={img.url} alt={img.alt} loading="lazy" />
          ))}
        </div>
      ) : (
        <div className="d-ph">[ screenshot menyusul ]</div>
      )}

      {p.problem && <section className="d-sec"><h2>Masalah yang diselesaikan</h2><p>{p.problem}</p></section>}
      {p.solution && <section className="d-sec"><h2>Solusi</h2><p>{p.solution}</p></section>}
      {p.features && p.features.length > 0 && (
        <section className="d-sec">
          <h2>Fitur utama</h2>
          <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
        </section>
      )}
      {p.challenges && <section className="d-sec"><h2>Tantangan teknis</h2><p>{p.challenges}</p></section>}
      {p.learnings && <section className="d-sec"><h2>Yang kupelajari</h2><p>{p.learnings}</p></section>}
      {!hasDetail && (
        <section className="d-sec">
          <p className="muted">Penjelasan lengkap proyek ini (peran, masalah, solusi, dan tantangan) menyusul.</p>
        </section>
      )}

      {related && related.length > 0 && (
        <section className="d-sec">
          <h2>Bagian dari perjalananku</h2>
          <Link href="/journey" className="amber">
            {related.map((r) => `${r.year} · ${r.title}`).join(", ")} →
          </Link>
        </section>
      )}
    </div>
  );
}
