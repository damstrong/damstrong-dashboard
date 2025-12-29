"use client";

import { useEffect, useState } from "react";
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

export default function MapClient() {
  const [points, setPoints] = useState<Point[]>([]);

  // Leaflet icon fix MUST run in the browser
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconAnchor: [12, 41],
      });

      // set default marker icon
      (L.Marker.prototype as any).options.icon = icon;
    })();
  }, []);

  useEffect(() => {
    fetch("/api/map/points")
      .then((r) => r.json())
      .then(setPoints)
      .catch(() => setPoints([]));
  }, []);

  return (
    <div style={{ height: "90vh" }}>
      <div style={{ padding: 12, fontWeight: 700 }}>Visitor Map</div>

      <MapContainer
        center={[39, -98]}
        zoom={4}
        style={{ height: "calc(90vh - 48px)", width: "100%" }}
      >
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
