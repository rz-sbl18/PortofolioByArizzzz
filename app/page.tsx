import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "✓ Completed", cls: "green" },
  in_progress: { label: "◐ In Progress", cls: "amber" },
  coming_soon: { label: "◌ Coming Soon", cls: "muted" },
  planning: { label: "◌ Planning", cls: "muted" },
  archived: { label: "Archived", cls: "muted" },
};

function SectionHead({ num, title, href }: { num: string; title: string; href?: string }) {
  return (
    <div className="sec-head">
      <span className="num">{num}</span>
      <h2>{title}</h2>
      <div className="line" />
      {href && (
        <Link href={href} className="amber" style={{ fontSize: 14 }}>
          Lihat semua
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const [profileRes, skillsRes, projectRes, milestonesRes] = await Promise.all([
    supabase.from("profile").select("*").eq("id", 1).maybeSingle(),
    supabase.from("skills").select("name, category").order("sort_order"),
    supabase
      .from("projects")
      .select("slug, title, summary, category, status, thumbnail_url")
      .eq("featured", true)
      .order("sort_order")
      .limit(2),
    supabase.from("milestones").select("id, year, title, status").order("sort_order"),
  ]);

  const profile = profileRes.data;
  const skills = skillsRes.data ?? [];
  const projects = projectRes.data ?? [];
  const milestones = milestonesRes.data ?? [];
  const now = milestones.find((m) => m.status === "in_progress");
  const failed = [profileRes, skillsRes, projectRes, milestonesRes].some((r) => r.error);

  return (
    <div className="container">
      {failed && (
        <p className="muted small" style={{ paddingTop: 16 }}>
          Sebagian data belum bisa dimuat. Coba muat ulang beberapa saat lagi.
        </p>
      )}

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="photo-wrap a1">
          <div className="photo-frame" />
          <div className="photo">
            {profile?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo_url} alt="Foto profil Muhamad Rizki" />
            ) : (
              <>
                <span className="serif initials">MR</span>
                <span className="mono muted small">[ foto profil menyusul ]</span>
              </>
            )}
          </div>
          <div className="sticker">sedang belajar</div>
        </div>

        <div className="hero-text">
          <div className="mono muted a2" style={{ fontSize: 14 }}>
            &gt; hello, saya Rizki<span className="amber">▌</span>
          </div>
          <h1 className="a2">
            Muhamad
            <br />
            <span className="serif amber">Rizki</span>
          </h1>
          <p className="lead a3">
            {profile?.headline ?? "Mahasiswa Teknik Informatika — belajar Web & Mobile Development"}
          </p>
          <p className="muted a3" style={{ margin: 0, fontSize: 14 }}>
            Universitas Kuningan, angkatan 2024.
          </p>

          <div className="actions a4">
            <Link href="/proyek" className="btn-main">
              <span>Lihat Proyek</span>
              <span className="circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>

            {profile?.cv_url ? (
              <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="btn-card">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </svg>
                <span>Unduh CV</span>
                <span className="tag">PDF</span>
              </a>
            ) : (
              <span className="btn-card btn-disabled" aria-disabled="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A524" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
                </svg>
                <span>CV menyusul</span>
              </span>
            )}
          </div>

          <div className="chips a4">
            {profile?.github_url && (
              <a className="pill" href={profile.github_url} target="_blank" rel="noopener noreferrer">GitHub</a>
            )}
            {profile?.linkedin_url && (
              <a className="pill" href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            )}
          </div>
        </div>
      </section>

      {/* 01 Skill */}
      <section id="tentang" className="section rv">
        <SectionHead num="01" title="Pernah dipakai" href="/tentang" />
        <div className="chips">
          {skills.map((s) => (
            <span key={s.name} className="chip">{s.name}</span>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Level: pernah dipakai di tugas dan project, masih terus belajar.
        </p>
      </section>

      {/* 02 Sedang dikerjakan */}
      <section className="section rv">
        <SectionHead num="02" title="Sedang dikerjakan" />
        <div className="card-now">
          <div className="row">
            <span style={{ fontSize: 17, fontWeight: 600 }}>
              {now ? now.title : "Website portofolio ini"}
            </span>
            <span className="status amber"><span className="live" />◐ In Progress</span>
          </div>
          <span style={{ fontSize: 14, color: "var(--soft)" }}>
            Belajar Next.js dan Supabase sambil membangun identitas digital.
          </span>
        </div>
      </section>

      {/* 03 Proyek */}
      <section className="section rv">
        <SectionHead num="03" title="Proyek unggulan" href="/proyek" />
        <div className="grid2">
          {projects.map((p) => {
            const st = STATUS[p.status] ?? STATUS.planning;
            return (
              <Link key={p.slug} href={`/proyek/${p.slug}`} className="card">
                <div className="thumb">
                  {p.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_url} alt={`Tampilan proyek ${p.title}`} />
                  ) : (
                    "[ screenshot menyusul ]"
                  )}
                </div>
                <div className="card-body">
                  <div className="row">
                    <span className="muted small">{p.category}</span>
                    <span className={`status ${st.cls}`}>{st.label}</span>
                  </div>
                  <h3>{p.title}</h3>
                  <span className="muted" style={{ fontSize: 14 }}>{p.summary}</span>
                </div>
              </Link>
            );
          })}
          {projects.length === 0 && <p className="muted">Proyek akan segera ditampilkan.</p>}
        </div>
      </section>

      {/* 04 Journey */}
      <section className="section rv">
        <SectionHead num="04" title="Journey" href="/journey" />
        <div className="stack">
          {milestones.slice(2, 5).map((m) => {
            const st = STATUS[m.status] ?? STATUS.coming_soon;
            const cls = m.status === "in_progress" ? "ms ms-now" : m.status === "coming_soon" ? "ms ms-future" : "ms";
            return (
              <Link key={m.id} href="/journey" className={cls}>
                <div className="ph">{m.status === "coming_soon" ? "target" : "foto"}</div>
                <div className="stack" style={{ gap: 4 }}>
                  <span className={`mono small ${m.status === "in_progress" ? "amber" : "muted"}`}>
                    {m.year}{m.status === "in_progress" ? " · kamu di sini" : ""}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{m.title}</span>
                  <span className={`status ${st.cls}`}>{st.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 05 Jelajah */}
      <section className="section rv">
        <SectionHead num="05" title="Jelajah" href="/jelajah" />
        <Link href="/jelajah" className="teaser">
          <svg viewBox="0 0 342 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path className="mini" pathLength={1} d="M40 140 C80 120 110 130 150 100 S 220 120 250 80 S 300 50 310 40" fill="none" stroke="#F5A524" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="140" r="7" fill="#F5A524" />
            <circle cx="150" cy="100" r="7" fill="#F5A524" />
            <circle cx="250" cy="80" r="7" fill="#F5A524" />
            <circle cx="310" cy="40" r="7" fill="none" stroke="#9AA3B2" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
          <div className="cap">
            <span style={{ fontSize: 16, fontWeight: 600 }}>Peta perjalananku</span>
            <span className="mono small amber">buka →</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
