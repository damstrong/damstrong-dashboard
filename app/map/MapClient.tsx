"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Point = {
  lat: number;
  lng: number;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  count: number;
};

function yyyy_mm_dd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MapClient() {
  const [points, setPoints] = useState<Point[]>([]);
  const [busy, setBusy] = useState(false);

  // default: last 30 days
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return yyyy_mm_dd(d);
  });
  const [to, setTo] = useState(() => yyyy_mm_dd(new Date()));

  // Leaflet icon fix MUST run in the browser
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconAnchor: [12, 41],
      });

      (L.Marker.prototype as any).options.icon = icon;
    })();
  }, []);

  const apiUrl = useMemo(() => {
    const u = new URL("/api/map/points", window.location.origin);
    if (from) u.searchParams.set("from", from);
    if (to) u.searchParams.set("to", to);
    return u.toString();
  }, [from, to]);

  useEffect(() => {
    let alive = true;
    setBusy(true);

    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setPoints(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!alive) return;
        setBusy(false);
      });

    return () => {
      alive = false;
    };
  }, [apiUrl]);

  return (
    <div style={{ height: "90vh" }}>
      <div style={{ padding: 12, fontWeight: 700, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Visitor Map</div>

        <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 500 }}>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 500 }}>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
          {busy ? "Loading…" : `${points.length} locations`}
        </div>
      </div>

      <MapContainer center={[39, -98]} zoom={4} style={{ height: "calc(90vh - 48px)", width: "100%" }}>
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]}>
            <Popup>
              <b>
                {[p.city, p.region].filter(Boolean).join(", ")}{" "}
                {p.country ? `(${p.country})` : ""}
              </b>
              <br />
              Visits: {p.count}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
