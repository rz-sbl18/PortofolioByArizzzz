import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata = { title: "Tentang — Muhamad Rizki" };
export const revalidate = 60;

type Skill = { name: string; category: string; level: string };

const LEVEL: Record<string, string> = {
  learning: "Currently Learning",
  familiar: "Familiar With",
  used_in_projects: "Used in Projects",
  proficient: "Proficient",
};

export default async function TentangPage() {
  const [profileRes, skillsRes] = await Promise.all([
    supabase.from("profile").select("bio, headline").eq("id", 1).maybeSingle(),
    supabase.from("skills").select("name, category, level").order("sort_order"),
  ]);

  const skills = (skillsRes.data ?? []) as Skill[];
  const groups = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="container">
      <header style={{ padding: "40px 0 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mono muted a1" style={{ fontSize: 13 }}>&gt; cat about.md</div>
        <h1 className="a2" style={{ margin: 0, fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Tentang <span className="serif amber">aku</span>
        </h1>
        <p className="a3" style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: "var(--soft)", maxWidth: 640 }}>
          {profileRes.data?.bio ??
            "Mahasiswa Teknik Informatika Universitas Kuningan, angkatan 2024."}
        </p>
      </header>

      <section className="section rv">
        <div className="sec-head"><span className="num">01</span><h2>Pendidikan</h2><div className="line" /></div>
        <div className="card-body card" style={{ maxWidth: 640 }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Teknik Informatika</span>
          <span className="muted" style={{ fontSize: 14 }}>Universitas Kuningan · angkatan 2024</span>
          <span className="mono small muted">◌ Target lulus: 2028 (rencana)</span>
        </div>
      </section>

      <section className="section rv">
        <div className="sec-head"><span className="num">02</span><h2>Skill &amp; teknologi</h2><div className="line" /></div>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Tanpa persentase. Setiap skill diberi label sesuai pengalaman nyata.
        </p>
        <div className="stack" style={{ gap: 20 }}>
          {Object.entries(groups).map(([cat, list]) => (
            <div key={cat} className="stack" style={{ gap: 8 }}>
              <span className="mono small amber">{cat}</span>
              <div className="chips">
                {list.map((s) => (
                  <span key={s.name} className="chip" title={LEVEL[s.level]}>
                    {s.name} <span className="muted" style={{ fontSize: 11 }}>· {LEVEL[s.level] ?? s.level}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section rv">
        <div className="sec-head"><span className="num">03</span><h2>Lanjut menjelajah</h2><div className="line" /></div>
        <div className="chips">
          <Link className="pill" href="/proyek">Lihat proyek</Link>
          <Link className="pill" href="/journey">Baca journey</Link>
          <Link className="pill" href="/jelajah">Buka peta</Link>
          <Link className="pill" href="/kontak">Hubungi aku</Link>
        </div>
      </section>
    </div>
  );
}
