"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Next (required)
import L from "leaflet";
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
});
(L.Marker.prototype as any).options.icon = icon;

type Point = {
  lat: number;
  lng: number;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  count: number;
};

export default function MapPage() {
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    fetch("/api/map/points")
      .then((r) => r.json())
      .then(setPoints)
      .catch(() => setPoints([]));
  }, []);

  return (
    <div style={{ height: "90vh" }}>
      <div style={{ padding: 12, fontWeight: 700 }}>Visitor Map</div>

      <MapContainer center={[39, -98]} zoom={4} style={{ height: "calc(90vh - 48px)", width: "100%" }}>
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading>
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
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
