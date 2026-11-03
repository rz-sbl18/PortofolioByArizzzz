import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata = { title: "Kontak — Muhamad Rizki" };
export const revalidate = 60;

export default async function KontakPage() {
  const { data: p } = await supabase.from("profile").select("*").eq("id", 1).maybeSingle();

  const items = [
    { label: "Email", value: p?.email, href: p?.email ? `mailto:${p.email}` : null },
    { label: "LinkedIn", value: p?.linkedin_url, href: p?.linkedin_url },
    { label: "GitHub", value: p?.github_url, href: p?.github_url },
    { label: "Instagram", value: p?.instagram_url, href: p?.instagram_url },
  ].filter((i) => i.href);

  return (
    <div className="container">
      <header style={{ padding: "40px 0 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mono muted a1" style={{ fontSize: 13 }}>&gt; contact --list</div>
        <h1 className="a2" style={{ margin: 0, fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Mari <span className="serif amber">terhubung</span>
        </h1>
        <p className="muted a3" style={{ margin: 0, maxWidth: 560 }}>
          Terbuka untuk berkenalan, berdiskusi, atau berkolaborasi di project kecil.
        </p>
      </header>

      <div className="stack a4" style={{ marginTop: 24, maxWidth: 560 }}>
        {items.map((i) => (
          <a key={i.label} href={i.href!} target={i.label === "Email" ? undefined : "_blank"} rel="noopener noreferrer" className="ms">
            <div className="stack" style={{ gap: 2 }}>
              <span className="mono small muted">{i.label}</span>
              <span style={{ fontSize: 15, wordBreak: "break-all" }}>
                {String(i.value).replace(/^https?:\/\/(www\.)?/, "").split("?")[0]}
              </span>
            </div>
            <span className="amber" style={{ marginLeft: "auto" }}>→</span>
          </a>
        ))}
        {p?.cv_url && (
          <a href={p.cv_url} target="_blank" rel="noopener noreferrer" className="btn-card">
            <span>Unduh CV</span>
            <span className="tag">PDF</span>
          </a>
        )}
        {items.length === 0 && (
          <p className="muted">Informasi kontak akan segera ditambahkan.</p>
        )}
      </div>

      <div style={{ paddingTop: 32 }}>
        <Link href="/" className="pill">← Kembali ke beranda</Link>
      </div>
    </div>
  );
}
