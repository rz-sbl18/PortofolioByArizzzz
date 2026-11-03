"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./travel-map.css";

export type PlacePhoto = { url: string; alt: string; sort_order: number };
export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "visited" | "wishlist";
  note: string | null;
  visited_on: string | null;
  place_photos: PlacePhoto[];
};

type L = typeof import("leaflet");

function makeIcon(L: L, p: Place, index: number, selected: boolean) {
  const cls = `pin ${p.status === "wishlist" ? "wishlist" : ""} ${selected ? "sel" : ""}`;
  return L.divIcon({
    className: "pin-wrap",
    html: `<span class="${cls}">${index + 1}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export default function TravelMap({ places }: { places: Place[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const libRef = useRef<L | null>(null);
  const [selId, setSelId] = useState<string | null>(places[0]?.id ?? null);
  const [ph, setPh] = useState(0);

  // Membuat peta sekali
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mod = await import("leaflet");
      const L = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
      if (cancelled || !boxRef.current || mapRef.current) return;
      libRef.current = L;

      const map = L.map(boxRef.current, { scrollWheelZoom: false });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(map);

      const points: [number, number][] = [];
      places.forEach((p, i) => {
        const m = L.marker([p.lat, p.lng], {
          icon: makeIcon(L, p, i, p.id === selId),
          title: p.name,
          keyboard: true,
        }).addTo(map);
        m.on("click", () => {
          setSelId(p.id);
          setPh(0);
        });
        markersRef.current.set(p.id, m);
        points.push([p.lat, p.lng]);
      });

      // Rute: garis penuh antar tempat yang sudah dikunjungi, putus-putus ke tempat impian
      const visited = places.filter((p) => p.status === "visited").map((p) => [p.lat, p.lng] as [number, number]);
      const wishes = places.filter((p) => p.status === "wishlist").map((p) => [p.lat, p.lng] as [number, number]);
      if (visited.length > 0 && wishes.length > 0) {
        L.polyline([visited[visited.length - 1], ...wishes], {
          color: "#9aa3b2",
          weight: 3,
          dashArray: "3 8",
          lineCap: "round",
        }).addTo(map);
      }
      if (visited.length > 1) {
        const line = L.polyline(visited, { color: "#f5a524", weight: 3, lineCap: "round" }).addTo(map);
        const el = line.getElement() as SVGPathElement | undefined;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (el && !reduce && typeof el.getTotalLength === "function") {
          const len = el.getTotalLength();
          el.style.strokeDasharray = `${len}`;
          el.style.strokeDashoffset = `${len}`;
          el.getBoundingClientRect();
          el.style.transition = "stroke-dashoffset 2.8s ease-in-out";
          el.style.strokeDashoffset = "0";
          el.addEventListener(
            "transitionend",
            () => {
              el.style.transition = "none";
              el.style.strokeDasharray = "none";
            },
            { once: true }
          );
        }
      }

      if (points.length > 1) map.fitBounds(points, { padding: [50, 50] });
      else if (points.length === 1) map.setView(points[0], 9);
      else map.setView([-2.5, 118], 4);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  // Perbarui tampilan titik yang dipilih
  useEffect(() => {
    const L = libRef.current;
    if (!L) return;
    places.forEach((p, i) => {
      markersRef.current.get(p.id)?.setIcon(makeIcon(L, p, i, p.id === selId));
    });
  }, [selId, places]);

  function pick(id: string) {
    setSelId(id);
    setPh(0);
    const p = places.find((x) => x.id === id);
    if (p && mapRef.current) {
      mapRef.current.flyTo([p.lat, p.lng], Math.max(mapRef.current.getZoom(), 8));
    }
  }

  const sel = places.find((p) => p.id === selId) ?? places[0];
  const photos = sel ? [...sel.place_photos].sort((a, b) => a.sort_order - b.sort_order) : [];
  const idx = photos.length ? ph % photos.length : 0;

  return (
    <div>
      <div className="map-box" ref={boxRef} role="region" aria-label="Peta tempat yang pernah dikunjungi" />
      <div className="legend">
        <span><span className="amber">●</span> sudah dikunjungi</span>
        <span>◌ ingin dikunjungi</span>
      </div>

      {sel && (
        <div className="place-card" aria-live="polite">
          <div className="place-photo" key={`${sel.id}-${idx}`}>
            {photos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[idx].url} alt={photos[idx].alt} />
            ) : (
              <span>{sel.status === "visited" ? "[ foto menyusul ]" : "[ foto menyusul setelah perjalanan ]"}</span>
            )}
          </div>
          <div className="place-info">
            <div className="row">
              <span style={{ fontSize: 20, fontWeight: 600 }}>{sel.name}</span>
              <span className={`status ${sel.status === "visited" ? "green" : "muted"}`}>
                {sel.status === "visited" ? "✓ Sudah dikunjungi" : "◌ Ingin dikunjungi"}
              </span>
            </div>
            {sel.visited_on && (
              <span className="muted small mono">
                {new Date(sel.visited_on).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
              </span>
            )}
            {sel.note && <span className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>{sel.note}</span>}
            {photos.length > 1 && (
              <div className="place-nav">
                <button className="round" aria-label="Foto sebelumnya" onClick={() => setPh((idx - 1 + photos.length) % photos.length)}>←</button>
                <div className="dots" aria-hidden="true">
                  {photos.map((p, i) => (
                    <span key={p.url} className={i === idx ? "on" : ""} />
                  ))}
                </div>
                <button className="round fill" aria-label="Foto berikutnya" onClick={() => setPh((idx + 1) % photos.length)}>→</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="place-list">
        {places.map((p, i) => (
          <button key={p.id} className={`place-btn ${p.id === selId ? "on" : ""}`} onClick={() => pick(p.id)}>
            <span>{i + 1}. {p.name}</span>
            <span className="muted small mono">
              {p.status === "visited" ? `${p.place_photos.length} foto` : "rencana"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
