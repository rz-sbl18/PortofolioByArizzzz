import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "./journey.css";

export const metadata = { title: "Journey — Muhamad Rizki" };
export const revalidate = 60;

type Photo = { url: string; alt: string; sort_order: number };
type Milestone = {
  id: string;
  year: number;
  title: string;
  story: string | null;
  category: string;
  status: "completed" | "in_progress" | "coming_soon";
  projects: { slug: string; title: string } | null;
  milestone_photos: Photo[];
};

const STATUS = {
  completed: { label: "✓ Completed", cls: "green" },
  in_progress: { label: "◐ In Progress", cls: "amber" },
  coming_soon: { label: "◌ Coming Soon", cls: "muted" },
} as const;

const CATEGORY: Record<string, string> = {
  education: "Education",
  career: "Career",
  project: "Project",
  achievement: "Achievement",
  organization: "Organization",
  personal_growth: "Personal Growth",
  life_goals: "Life Goals",
};

export default async function JourneyPage() {
  const { data, error } = await supabase
    .from("milestones")
    .select(
      "id, year, title, story, category, status, projects(slug, title), milestone_photos(url, alt, sort_order)"
    )
    .order("sort_order");

  const milestones = (data ?? []) as unknown as Milestone[];

  return (
    <div className="container">
      <header className="j-head">
        <div className="mono muted a1" style={{ fontSize: 13 }}>&gt; git log --journey</div>
        <h1 className="a2">
          Life <span className="serif amber">Journey</span>
        </h1>
        <p className="muted a3" style={{ maxWidth: 560 }}>
          Perjalanan dari masa lalu sampai target. Yang berlabel Coming Soon adalah rencana yang bisa
          berubah, bukan janji.
        </p>
        <div className="mono small a3" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span className="green">✓ Completed</span>
          <span className="amber">◐ In Progress</span>
          <span className="muted">◌ Coming Soon</span>
        </div>
      </header>

      {error && <p className="muted small">Data belum bisa dimuat. Coba muat ulang nanti.</p>}

      <ol className="tl">
        {milestones.map((m) => {
          const st = STATUS[m.status] ?? STATUS.coming_soon;
          const future = m.status === "coming_soon";
          const now = m.status === "in_progress";
          // Foto hanya untuk yang sudah/sedang terjadi, bukan target masa depan.
          const photos = future
            ? []
            : [...(m.milestone_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);

          return (
            <li key={m.id} className={`tl-item rv ${future ? "tl-future" : ""}`}>
              <div className="tl-rail">
                <span className={`tl-dot ${m.status}`} />
                <span className="tl-line" />
              </div>
              <div className="tl-body">
                <span className={`mono small ${now ? "amber" : "muted"}`}>
                  {m.year} · {CATEGORY[m.category] ?? m.category}
                  {now ? " · kamu di sini" : ""}
                </span>
                <div className={`tl-card ${now ? "tl-card-now" : ""} ${future ? "tl-card-future" : ""}`}>
                  {!future &&
                    (photos.length > 0 ? (
                      <div className="tl-photos">
                        {photos.map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.url} src={p.url} alt={p.alt} loading="lazy" />
                        ))}
                      </div>
                    ) : (
                      <div className="tl-ph">[ foto menyusul ]</div>
                    ))}
                  <h3>{m.title}</h3>
                  {m.story && <p className="muted">{m.story}</p>}
                  {m.projects && (
                    <Link href={`/proyek/${m.projects.slug}`} className="amber" style={{ fontSize: 14 }}>
                      Lihat proyek: {m.projects.title} →
                    </Link>
                  )}
                  <span className={`status ${st.cls}`}>
                    {now && <span className="live" />}
                    {st.label}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div style={{ paddingTop: 24 }}>
        <Link href="/jelajah" className="pill">Lihat peta perjalananku →</Link>
      </div>
    </div>
  );
}
