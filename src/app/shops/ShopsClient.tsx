"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SHOPS, type Shop } from "@/data/shops";
import { FooterSimple } from "@/components/luft/Footer";

type LatLng = { lat: number; lng: number };
type UserLoc = LatLng & { label: string };

const US_CENTER: [number, number] = [39.5, -98.35];

// Haversine great-circle distance in miles.
function distMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Black teardrop pin as a divIcon so we ship no marker image assets (Leaflet's
// default icon paths break under bundlers).
function pinHtml(fill: string): string {
  return `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21C26 5.8 20.2 0 13 0z" fill="${fill}"/><circle cx="13" cy="13" r="5" fill="#ffffff"/></svg>`;
}

export function ShopsClient() {
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const LRef = useRef<typeof L | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [zip, setZip] = useState("");
  const [userLoc, setUserLoc] = useState<UserLoc | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  // Sorted list: by distance when we have a location, else grouped by state.
  const sorted = useMemo<(Shop & { miles?: number })[]>(() => {
    if (!userLoc) {
      return [...SHOPS].sort((a, b) =>
        a.state === b.state ? a.city.localeCompare(b.city) : a.state.localeCompare(b.state)
      );
    }
    return SHOPS.map((s) => ({ ...s, miles: distMiles(userLoc, s) })).sort(
      (a, b) => a.miles! - b.miles!
    );
  }, [userLoc]);

  // Init the map once, plot every shop.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !mapDiv.current || mapRef.current) return;
      LRef.current = leaflet;
      const map = leaflet.map(mapDiv.current, { scrollWheelZoom: false }).setView(
        US_CENTER,
        4
      );
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 18,
        })
        .addTo(map);
      const icon = leaflet.divIcon({
        html: pinHtml("#0d0d0d"),
        className: "luft-pin",
        iconSize: [26, 34],
        iconAnchor: [13, 34],
        popupAnchor: [0, -30],
      });
      for (const s of SHOPS) {
        const m = leaflet
          .marker([s.lat, s.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:Arial,sans-serif"><strong>${s.name}</strong><br/>${s.city}, ${s.state}` +
              (s.website
                ? `<br/><a href="${s.website}" target="_blank" rel="noopener">Website &rarr;</a>`
                : "") +
              `</div>`
          );
        markersRef.current.set(s.id, m);
      }
      mapRef.current = map;
      // Leaflet mis-measures the container if it mounts before layout settles.
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // When we get a user location, drop a "you" pin and frame it with the nearest
  // few shops.
  useEffect(() => {
    const map = mapRef.current;
    const leaflet = LRef.current;
    if (!map || !leaflet || !userLoc) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const youIcon = leaflet.divIcon({
      html: pinHtml("#b91c1c"),
      className: "luft-pin",
      iconSize: [26, 34],
      iconAnchor: [13, 34],
      popupAnchor: [0, -30],
    });
    userMarkerRef.current = leaflet
      .marker([userLoc.lat, userLoc.lng], { icon: youIcon })
      .addTo(map)
      .bindPopup(`<strong>You</strong><br/>${userLoc.label}`);
    const nearest = SHOPS.map((s) => ({ s, d: distMiles(userLoc, s) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map(({ s }) => [s.lat, s.lng] as [number, number]);
    const bounds = leaflet.latLngBounds([[userLoc.lat, userLoc.lng], ...nearest]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
  }, [userLoc]);

  function focusShop(s: Shop) {
    const map = mapRef.current;
    const m = markersRef.current.get(s.id);
    if (!map || !m) return;
    map.flyTo([s.lat, s.lng], 10, { duration: 0.6 });
    m.openPopup();
    mapDiv.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function searchZip(e: React.FormEvent) {
    e.preventDefault();
    const z = zip.trim();
    if (!/^\d{5}$/.test(z)) {
      setStatus("Enter a 5-digit US ZIP code.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${z}`);
      if (!res.ok) throw new Error("not found");
      const j = await res.json();
      const p = j.places?.[0];
      if (!p) throw new Error("not found");
      setUserLoc({
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        label: `${p["place name"]}, ${p["state abbreviation"]} ${z}`,
      });
    } catch {
      setStatus("Couldn't find that ZIP. Try another, or use your location.");
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("Your browser doesn't support location.");
      return;
    }
    setBusy(true);
    setStatus("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        });
        setBusy(false);
      },
      () => {
        setStatus("Couldn't get your location. Enter a ZIP instead.");
        setBusy(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid #e6e5e2",
    background: "#fafafa",
    padding: "12px 14px",
    fontSize: 15,
    color: "#0d0d0d",
    fontFamily: "var(--font-jetbrains-mono), monospace",
    width: 160,
    outline: "none",
  };

  return (
    <div style={{ background: "#ffffff" }}>
      <section className="luft-container" style={{ padding: "48px 40px 0" }}>
        <div className="lbl" style={{ color: "#0d0d0d", fontSize: 11, letterSpacing: "0.24em" }}>
          Directory · Air-Cooled Specialists
        </div>
        <h1
          className="display luft-h1"
          style={{ fontWeight: 600, fontSize: 56, lineHeight: 1, textTransform: "uppercase", marginTop: 12 }}
        >
          Shops near me
        </h1>
        <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 560 }}>
          Find air-cooled Porsche specialists — restorers, engine builders, and
          marque techs who know the 911, 912, 930, 964, and 993. Enter your ZIP
          to sort the map and list by distance.
        </p>

        <form
          onSubmit={searchZip}
          style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}
        >
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
            placeholder="ZIP code"
            inputMode="numeric"
            aria-label="ZIP code"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              background: "#0d0d0d",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 22px",
              border: "none",
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "Searching…" : "Find shops"}
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={busy}
            style={{
              background: "#fff",
              color: "#0d0d0d",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 18px",
              border: "1px solid #0d0d0d",
              cursor: busy ? "default" : "pointer",
            }}
          >
            Use my location
          </button>
          {userLoc && (
            <span style={{ fontSize: 13, color: "#5e5e5a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              Sorted from {userLoc.label}
            </span>
          )}
        </form>
        {status && (
          <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c" }}>{status}</div>
        )}
      </section>

      <section className="luft-container" style={{ padding: "28px 40px 0" }}>
        <div
          ref={mapDiv}
          style={{
            width: "100%",
            height: 460,
            border: "1px solid #e6e5e2",
            background: "#f1f0ed",
          }}
        />
      </section>

      <section className="luft-container" style={{ padding: "34px 40px 60px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: "2px solid #0d0d0d",
            paddingBottom: 12,
            marginBottom: 8,
          }}
        >
          <div className="lbl" style={{ color: "#0d0d0d", fontSize: 12, letterSpacing: "0.14em" }}>
            {SHOPS.length} shops listed
          </div>
          <div className="lbl" style={{ color: "#8a8a85", fontSize: 12 }}>
            {userLoc ? "Nearest first" : "By state"}
          </div>
        </div>

        <div className="luft-grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {sorted.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => focusShop(s)}
              style={{
                textAlign: "left",
                border: "1px solid #e6e5e2",
                borderTop: "none",
                background: "#ffffff",
                padding: "20px 22px",
                cursor: "pointer",
                display: "block",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <div className="display" style={{ fontWeight: 600, fontSize: 21, textTransform: "uppercase", color: "#0d0d0d" }}>
                  {s.name}
                </div>
                {s.miles != null && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0d0d0d", whiteSpace: "nowrap", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {s.miles < 10 ? s.miles.toFixed(1) : Math.round(s.miles)} mi
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#8a8a85", marginTop: 4, fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                {s.city}, {s.state}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "#5e5e5a", marginTop: 10 }}>{s.blurb}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {s.specialties.map((sp) => (
                  <span
                    key={sp}
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "#0d0d0d",
                      border: "1px solid #e6e5e2",
                      padding: "3px 8px",
                    }}
                  >
                    {sp}
                  </span>
                ))}
              </div>
              {(s.website || s.phone) && (
                <div style={{ marginTop: 14, fontSize: 13, display: "flex", gap: 16 }}>
                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: "#0d0d0d", fontWeight: 600, borderBottom: "1px solid #0d0d0d", paddingBottom: 1 }}
                    >
                      Website →
                    </a>
                  )}
                  {s.phone && <span style={{ color: "#5e5e5a" }}>{s.phone}</span>}
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 28, fontSize: 14, color: "#5e5e5a", lineHeight: 1.6 }}>
          Know an air-cooled shop we're missing, or own one?{" "}
          <a
            href="mailto:shops@driveluft.com?subject=Air-cooled%20shop%20suggestion"
            style={{ color: "#0d0d0d", fontWeight: 600, borderBottom: "1px solid #0d0d0d" }}
          >
            Suggest a shop →
          </a>
          <br />
          <span style={{ fontSize: 12, color: "#8a8a85" }}>
            Distances are approximate to each shop's city. Not affiliated with, or
            an endorsement by, any shop listed.
          </span>
        </div>
      </section>

      <FooterSimple />
    </div>
  );
}
