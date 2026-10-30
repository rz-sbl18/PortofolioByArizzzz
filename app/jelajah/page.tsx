import Link from "next/link";

export const metadata = { title: "Jelajah — Muhamad Rizki" };

export default function Page() {
  return (
    <div className="container stub">
      <span className="mono amber small">&gt; segera hadir</span>
      <h1>Jelajah</h1>
      <p className="muted">Halaman ini sedang disiapkan.</p>
      <Link href="/" className="pill" style={{ alignSelf: "flex-start" }}>
        ← Kembali ke beranda
      </Link>
    </div>
  );
}
