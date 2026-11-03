import Link from "next/link";
import { supabase } from "@/lib/supabase";
import TravelMap, { type Place } from "@/components/TravelMap";

export const metadata = { title: "Jelajah — Muhamad Rizki" };
export const revalidate = 60;

export default async function JelajahPage() {
  const { data, error } = await supabase
    .from("places")
    .select("id, name, lat, lng, status, note, visited_on, place_photos(url, alt, sort_order)")
    .order("route_order");

  const places = (data ?? []) as unknown as Place[];

  return (
    <div className="container">
      <header style={{ padding: "40px 0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mono muted a1" style={{ fontSize: 13 }}>&gt; travel --log</div>
        <h1 className="a2" style={{ margin: 0, fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Peta <span className="serif amber">perjalanan</span>
        </h1>
        <p className="muted a3" style={{ margin: 0, maxWidth: 560 }}>
          Tempat-tempat yang sudah kukunjungi. Ketuk satu titik untuk melihat foto perjalanannya.
        </p>
      </header>

      {error && <p className="muted small">Data peta belum bisa dimuat. Coba muat ulang nanti.</p>}

      {places.length === 0 && !error ? (
        <p className="muted">Belum ada tempat yang ditampilkan.</p>
      ) : (
        <TravelMap places={places} />
      )}

      <div style={{ paddingTop: 32 }}>
        <Link href="/journey" className="pill">← Lihat Journey</Link>
      </div>
    </div>
  );
}
