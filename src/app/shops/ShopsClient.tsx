"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { SHOPS, SERVICES, type Shop } from "@/data/shops";
import { FooterSimple } from "@/components/luft/Footer";

type LatLng = { lat: number; lng: number };
type UserLoc = LatLng & { label: string };

const US_CENTER: [number, number] = [39.5, -98.35];
const PAGE_SIZE = 12;

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

// Google-Maps-style directions deep link.
function directionsUrl(s: Shop): string {
  const q = encodeURIComponent([s.name, s.city, s.state].filter(Boolean).join(", "));
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

function esc(x: string): string {
  return x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

// Small circular marker (white with black ring) — a clean chip on the colored
// basemap. Selected markers invert to a solid black dot.
function dotIcon(leaflet: typeof L, active: boolean): L.DivIcon {
  const bg = active ? "#0d0d0d" : "#ffffff";
  const dot = active ? "#ffffff" : "#0d0d0d";
  return leaflet.divIcon({
    className: "luft-dot",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${bg};border:2px solid #0d0d0d;box-shadow:0 1px 3px rgba(0,0,0,.35)"><span style="display:block;width:5px;height:5px;border-radius:50%;background:${dot};margin:3.5px auto"></span></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

export function ShopsClient() {
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const LRef = useRef<typeof L | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const readyRef = useRef(false);
  const autoTriedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  const [zip, setZip] = useState("");
  const [userLoc, setUserLoc] = useState<UserLoc | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [stateFilter, setStateFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const states = useMemo(
    () => Array.from(new Set(SHOPS.map((s) => s.state))).sort(),
    []
  );

  // Sort (nearest-first when we have a location, else by state/city), then apply
  // the state / service / verified filters. Paging is applied after.
  const filtered = useMemo<(Shop & { miles?: number })[]>(() => {
    const base = userLoc
      ? SHOPS.map((s) => ({ ...s, miles: distMiles(userLoc, s) })).sort(
          (a, b) => a.miles! - b.miles!
        )
      : [...SHOPS].sort((a, b) =>
          a.state === b.state ? a.city.localeCompare(b.city) : a.state.localeCompare(b.state)
        );
    return base.filter(
      (s) =>
        (!stateFilter || s.state === stateFilter) &&
        (!serviceFilter || s.services.includes(serviceFilter)) &&
        (!verifiedOnly || s.verified)
    );
  }, [userLoc, stateFilter, serviceFilter, verifiedOnly]);

  const shown = filtered.slice(0, visible);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [stateFilter, serviceFilter, verifiedOnly, userLoc]);

  // Default to the visitor's location: try geolocation once on mount.
  useEffect(() => {
    if (autoTriedRef.current || typeof navigator === "undefined" || !navigator.geolocation)
      return;
    autoTriedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  // Init the map once (colored CARTO Voyager basemap for a Google-Maps look).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !mapDiv.current || mapRef.current) return;
      LRef.current = leaflet;
      const map = leaflet.map(mapDiv.current, { scrollWheelZoom: false }).setView(US_CENTER, 4);
      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        })
        .addTo(map);
      // Cluster overlapping/coincident pins (many shops share a city-center
      // coordinate) — clicking a cluster spiderfies them so each is clickable.
      // The plugin augments Leaflet's module/default export, not the ESM
      // namespace object, so read the factory off whichever carries it.
      await import("leaflet.markercluster");
      const lany = leaflet as unknown as {
        markerClusterGroup?: typeof leaflet.markerClusterGroup;
        default?: { markerClusterGroup?: typeof leaflet.markerClusterGroup };
      };
      const makeCluster = lany.markerClusterGroup ?? lany.default?.markerClusterGroup;
      const cluster = makeCluster
        ? makeCluster({
            maxClusterRadius: 44,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            spiderLegPolylineOptions: { weight: 1.5, color: "#0d0d0d", opacity: 0.5 },
            iconCreateFunction: (c: L.MarkerCluster) =>
              leaflet.divIcon({
                html: `<div class="luft-cluster">${c.getChildCount()}</div>`,
                className: "luft-cluster-wrap",
                iconSize: leaflet.point(38, 38),
              }),
          })
        : (leaflet.layerGroup() as unknown as L.MarkerClusterGroup);
      cluster.addTo(map);
      clusterRef.current = cluster;
      mapRef.current = map;
      readyRef.current = true;
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // Rebuild markers whenever the filtered set changes, and frame the map to
  // match (nearest-few when a location is set, the filtered extent when a filter
  // narrows things, otherwise the whole US).
  useEffect(() => {
    const map = mapRef.current;
    const leaflet = LRef.current;
    const cluster = clusterRef.current;
    if (!mapReady || !map || !leaflet || !cluster) return;
    cluster.clearLayers();
    markersRef.current.clear();
    const icon = dotIcon(leaflet, false);
    const batch: L.Marker[] = [];
    for (const s of filtered) {
      const services = s.services.length ? s.services.join(" · ") : "";
      const actions =
        `<a href="${esc(directionsUrl(s))}" target="_blank" rel="noopener" class="luft-pop-btn">Directions</a>` +
        (s.website ? `<a href="${esc(s.website)}" target="_blank" rel="noopener" class="luft-pop-btn">Website</a>` : "") +
        (s.phone ? `<a href="tel:${esc(s.phone)}" class="luft-pop-btn">Call</a>` : "");
      const html =
        `<div class="luft-pop"><div class="luft-pop-name">${esc(s.name)}` +
        (s.verified ? ` <span class="luft-pop-vf">✓</span>` : "") +
        `</div>` +
        `<div class="luft-pop-meta">${esc([s.city, s.state].filter(Boolean).join(", "))}${
          services ? ` · ${esc(services)}` : ""
        }</div>` +
        `<div class="luft-pop-actions">${actions}</div></div>`;
      const m = leaflet.marker([s.lat, s.lng], { icon }).bindPopup(html, {
        closeButton: true,
        offset: [0, -2],
      });
      batch.push(m);
      markersRef.current.set(s.id, m);
    }
    if (typeof cluster.addLayers === "function") cluster.addLayers(batch);
    else batch.forEach((m) => cluster.addLayer(m));

    if (userLoc && !stateFilter && !serviceFilter) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = leaflet
        .marker([userLoc.lat, userLoc.lng], {
          icon: leaflet.divIcon({
            className: "luft-you",
            html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#b91c1c;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        })
        .addTo(map)
        .bindPopup(`<div class="luft-pop"><div class="luft-pop-name">You</div><div class="luft-pop-meta">${esc(userLoc.label)}</div></div>`);
      const near = filtered.slice(0, 5).map((s) => [s.lat, s.lng] as [number, number]);
      map.fitBounds(leaflet.latLngBounds([[userLoc.lat, userLoc.lng], ...near]), {
        padding: [50, 50],
        maxZoom: 9,
      });
    } else if ((stateFilter || serviceFilter) && filtered.length) {
      map.fitBounds(
        leaflet.latLngBounds(filtered.map((s) => [s.lat, s.lng] as [number, number])),
        { padding: [50, 50], maxZoom: 9 }
      );
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      map.setView(US_CENTER, 4);
    }
  }, [filtered, mapReady, userLoc, stateFilter, serviceFilter]);

  function focusShop(s: Shop) {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    const m = markersRef.current.get(s.id);
    if (!map || !m) return;
    mapDiv.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Reveal the marker if it's inside a cluster, then open its popup.
    if (cluster && typeof cluster.zoomToShowLayer === "function") {
      cluster.zoomToShowLayer(m, () => m.openPopup());
    } else {
      map.flyTo([s.lat, s.lng], 11, { duration: 0.6 });
      m.openPopup();
    }
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
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" });
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

  const chip = (active: boolean): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.02em",
    padding: "7px 13px",
    border: "1px solid #0d0d0d",
    background: active ? "#0d0d0d" : "#ffffff",
    color: active ? "#ffffff" : "#0d0d0d",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ background: "#ffffff" }}>
      {/* Google-style popup + marker chrome (global, injected once). */}
      <style>{`
        .leaflet-popup-content-wrapper{border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.18);padding:2px 4px}
        .leaflet-popup-content{margin:12px 14px;font-family:var(--font-libre-franklin),Arial,sans-serif}
        .luft-pop-name{font-weight:700;font-size:15px;color:#0d0d0d}
        .luft-pop-vf{color:#0d7a3f;font-weight:700}
        .luft-pop-meta{font-size:12px;color:#6b6b66;margin-top:3px;line-height:1.4}
        .luft-pop-actions{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}
        .luft-pop-btn{font-size:12px;font-weight:700;color:#0d0d0d !important;text-decoration:none;border:1px solid #d9d6cf;border-radius:999px;padding:6px 13px}
        .luft-pop-btn:hover{background:#f2f1ef}
        .luft-cluster-wrap{background:transparent}
        .luft-cluster{width:38px;height:38px;border-radius:50%;background:#0d0d0d;color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-jetbrains-mono),monospace;font-size:13px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)}
      `}</style>

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
        <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 580 }}>
          {SHOPS.length}+ air-cooled Porsche specialists — restorers, engine
          builders, and marque techs for the 911, 912, 930, 964, and 993. Enter
          your ZIP or filter by service to find the right shop.
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
            style={{ background: "#0d0d0d", color: "#fff", fontWeight: 600, fontSize: 14, padding: "12px 22px", border: "none", cursor: busy ? "default" : "pointer" }}
          >
            {busy ? "Searching…" : "Find shops"}
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={busy}
            style={{ background: "#fff", color: "#0d0d0d", fontWeight: 600, fontSize: 14, padding: "12px 18px", border: "1px solid #0d0d0d", cursor: busy ? "default" : "pointer" }}
          >
            Use my location
          </button>
          {userLoc && (
            <span style={{ fontSize: 13, color: "#5e5e5a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              Sorted from {userLoc.label}
            </span>
          )}
        </form>
        {status && <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c" }}>{status}</div>}

        {/* Service filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
          <button type="button" onClick={() => setServiceFilter("")} style={chip(!serviceFilter)}>
            All services
          </button>
          {SERVICES.map((sv) => (
            <button
              key={sv}
              type="button"
              onClick={() => setServiceFilter((c) => (c === sv ? "" : sv))}
              style={chip(serviceFilter === sv)}
            >
              {sv}
            </button>
          ))}
        </div>
      </section>

      <section className="luft-container" style={{ padding: "22px 40px 0" }}>
        <div
          ref={mapDiv}
          style={{ width: "100%", height: 460, border: "1px solid #e6e5e2", background: "#e8eef2" }}
        />
      </section>

      <section className="luft-container" style={{ padding: "28px 40px 60px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            borderBottom: "2px solid #0d0d0d",
            paddingBottom: 12,
            marginBottom: 8,
          }}
        >
          <div className="lbl" style={{ color: "#0d0d0d", fontSize: 12, letterSpacing: "0.14em" }}>
            {filtered.length} shop{filtered.length === 1 ? "" : "s"}
            {serviceFilter ? ` · ${serviceFilter}` : ""}
            {stateFilter ? ` · ${stateFilter}` : ""} · {userLoc ? "nearest first" : "by state"}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, color: "#5e5e5a", display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              Verified only
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              aria-label="Filter by state"
              style={{ border: "1px solid #e6e5e2", background: "#fafafa", padding: "8px 12px", color: "#0d0d0d", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, cursor: "pointer" }}
            >
              <option value="">All states</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 0", color: "#8a8a85", fontSize: 15 }}>
            No shops match those filters. Try clearing the service or state filter.
          </div>
        ) : (
          <div className="luft-grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {shown.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => focusShop(s)}
                style={{
                  textAlign: "left",
                  border: "1px solid #e6e5e2",
                  borderTop: "none",
                  background: "#ffffff",
                  padding: "18px 20px",
                  cursor: "pointer",
                  display: "block",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div className="display" style={{ fontWeight: 600, fontSize: 19, textTransform: "uppercase", color: "#0d0d0d" }}>
                    {s.name}
                  </div>
                  {s.miles != null && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0d0d0d", whiteSpace: "nowrap", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                      {s.miles < 10 ? s.miles.toFixed(1) : Math.round(s.miles)} mi
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#8a8a85", marginTop: 4, fontFamily: "var(--font-jetbrains-mono), monospace", display: "flex", alignItems: "center", gap: 8 }}>
                  {[s.city, s.state].filter(Boolean).join(", ")}
                  {s.verified && (
                    <span style={{ color: "#0d7a3f", fontWeight: 700, letterSpacing: 0 }}>✓ Verified</span>
                  )}
                </div>
                {s.focus && (
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "#5e5e5a", marginTop: 9 }}>{s.focus}</p>
                )}
                {s.services.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 11 }}>
                    {s.services.map((sp) => (
                      <span
                        key={sp}
                        style={{ fontSize: 10.5, letterSpacing: "0.03em", textTransform: "uppercase", color: "#0d0d0d", border: "1px solid #e6e5e2", padding: "3px 7px" }}
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <a
                    href={directionsUrl(s)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "#0d0d0d", fontWeight: 600, borderBottom: "1px solid #0d0d0d", paddingBottom: 1 }}
                  >
                    Directions →
                  </a>
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
              </button>
            ))}
          </div>
        )}

        {shown.length < filtered.length && (
          <div style={{ marginTop: 22, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              style={{ background: "#fff", color: "#0d0d0d", fontWeight: 600, fontSize: 14, padding: "13px 26px", border: "1px solid #0d0d0d", cursor: "pointer" }}
            >
              Load more ({filtered.length - shown.length} more)
            </button>
          </div>
        )}

        <div style={{ marginTop: 28, fontSize: 14, color: "#5e5e5a", lineHeight: 1.6 }}>
          Know an air-cooled shop we're missing, or own one?{" "}
          <a
            href="mailto:info@driveluft.com?subject=Air-cooled%20shop%20suggestion"
            style={{ color: "#0d0d0d", fontWeight: 600, borderBottom: "1px solid #0d0d0d" }}
          >
            Suggest a shop →
          </a>
          <br />
          <span style={{ fontSize: 12, color: "#8a8a85" }}>
            Distances are approximate to each shop's city. Listing is not an
            endorsement; verify details with the shop directly.
          </span>
        </div>
      </section>

      <FooterSimple />
    </div>
  );
}
