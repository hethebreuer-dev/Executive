"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FooterGrid } from "@/components/luft/Footer";
import { useAuth } from "@/components/luft/AuthProvider";
import { PART_MODELS } from "@/lib/luft/parts-model";

type Photo = { id: string; url: string; name: string; file: File };
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;

export default function SellPartPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("all");
  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState("Email");

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function addFiles(files: FileList | File[]) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setPhotos((prev) => [
      ...prev,
      ...imgs.map((f) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url: URL.createObjectURL(f), name: f.name, file: f })),
    ]);
    setErr("");
  }
  function removePhoto(id: string) {
    setPhotos((prev) => {
      const t = prev.find((p) => p.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function uploadPhotos(): Promise<string[]> {
    if (!WORKER_URL || !photos.length) return [];
    const base = WORKER_URL.replace(/\/$/, "");
    const urls: string[] = [];
    for (const ph of photos) {
      const res = await fetch(`${base}/upload`, { method: "POST", headers: { "content-type": ph.file.type }, body: ph.file });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.url) throw new Error(j.error || "A photo failed to upload.");
      urls.push(j.url as string);
    }
    return urls;
  }

  async function submit() {
    if (!title.trim()) return setErr("Add a title for your part.");
    if (!description.trim()) return setErr("Add a description.");
    const contactEmail = (user?.email || email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return setErr("Enter a valid contact email.");
    setErr("");
    setBusy(true);
    try {
      const photoUrls = await uploadPhotos();
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title, description, model, partNumber, price,
          photos: photoUrls,
          sellerName, sellerEmail: contactEmail, sellerPhone: phone, sellerContact: contactMethod,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not post your part. Please try again.");
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not post your part.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={{ background: "#ffffff" }}>
        <section className="luft-container" style={{ padding: "80px 40px" }}>
          <div style={{ border: "1px solid #0d0d0d", padding: "56px 48px", maxWidth: 720 }}>
            <div className="lbl" style={{ color: "#0d0d0d" }}>Posted · Live now</div>
            <h1 className="display" style={{ fontWeight: 600, fontSize: 44, lineHeight: 1, textTransform: "uppercase", margin: "14px 0 8px" }}>
              Your part is live.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5e5e5a", maxWidth: 520 }}>
              &ldquo;{title}&rdquo; is now on the parts marketplace. Buyers can reach you at{" "}
              <strong>{(user?.email || email).trim()}</strong>.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <Link href="/parts" style={{ background: "#0d0d0d", color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "15px 28px" }}>
                View the parts marketplace →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setTitle(""); setDescription(""); setPartNumber(""); setPrice("");
                  setPhotos([]); setModel("all");
                }}
                style={{ border: "1px solid #0d0d0d", background: "#fff", fontSize: 15, fontWeight: 600, padding: "14px 26px", cursor: "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
              >
                List another part
              </button>
            </div>
          </div>
        </section>
        <FooterGrid />
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff" }}>
      <section className="luft-container" style={{ padding: "56px 40px 0" }}>
        <Link href="/parts" style={{ fontSize: 13, color: "#5e5e5a" }}>← Parts marketplace</Link>
        <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 56, lineHeight: 0.98, textTransform: "uppercase", margin: "12px 0 12px" }}>
          List a part
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 560 }}>
          Used, NOS, or restored — post it in a minute. It goes live immediately;
          buyers contact you directly.
        </p>
      </section>

      <section className="luft-container" style={{ padding: "40px 40px 0", maxWidth: 760 }}>
        <Field label="Title">
          <input className="luft-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='e.g. Fuchs 15" wheel set (4)' />
        </Field>
        <div className="luft-stack-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
          <Field label="Fits (model)" mb={0}>
            <select className="luft-field" value={model} onChange={(e) => setModel(e.target.value)}>
              {PART_MODELS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Part number (optional)" mb={0}>
            <input className="luft-field" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="911.361.011.40" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className="luft-field" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, fitment notes, what's included, any flaws…" />
        </Field>
        <Field label="Asking price (USD) — leave blank for “make an offer”">
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #d9d8d4", background: "#ffffff" }}>
            <span className="mono" style={{ padding: "0 12px 0 14px", fontSize: 16, color: "#8a8a85" }}>$</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="4,200" inputMode="numeric" style={{ flex: 1, border: "none", background: "transparent", padding: "13px 14px 13px 0", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 16, color: "#0d0d0d", outline: "none" }} />
          </div>
        </Field>

        {/* PHOTOS */}
        <Field label="Photos (optional)">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 12 }}>
            {photos.map((p) => (
              <div key={p.id} style={{ position: "relative", aspectRatio: "1 / 1", border: "1px solid #e6e5e2", background: "#0d0d0d", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button type="button" aria-label="Remove" onClick={() => removePhoto(p.id)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(13,13,13,0.82)", color: "#fff", cursor: "pointer", lineHeight: 0 }}>×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              className="luft-hatch"
              style={{ aspectRatio: "1 / 1", border: dragging ? "1px solid #0d0d0d" : "1px dashed #c9c8c4", background: "#fafafa", cursor: "pointer", color: "#a3a29d", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11 }}
            >
              + Add
            </button>
          </div>
        </Field>

        {/* CONTACT */}
        <div style={{ borderTop: "1px solid #0d0d0d", marginTop: 30, paddingTop: 26 }}>
          <div className="lbl" style={{ color: "#0d0d0d", marginBottom: 16 }}>How buyers reach you</div>
          <div className="luft-stack-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
            <Field label="Name (optional)" mb={0}>
              <input className="luft-field" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Name or shop" />
            </Field>
            <Field label="Preferred contact" mb={0}>
              <select className="luft-field" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}>
                <option>Email</option>
                <option>Phone</option>
                <option>Text</option>
              </select>
            </Field>
          </div>
          <div className="luft-stack-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 4 }}>
            <Field label="Email" mb={0}>
              <input className="luft-field" value={user?.email || email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" disabled={!!user?.email} />
            </Field>
            <Field label="Phone (optional)" mb={0}>
              <input className="luft-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 —" />
            </Field>
          </div>
        </div>

        {err && (
          <div style={{ marginTop: 22, fontSize: 13, color: "#0d0d0d", background: "#f2f1ef", padding: "10px 14px" }}>{err}</div>
        )}

        <div style={{ margin: err ? "16px 0 64px" : "32px 0 64px" }}>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            style={{ background: busy ? "#8a8a85" : "#0d0d0d", color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "15px 32px", border: "none", cursor: busy ? "default" : "pointer", fontFamily: "var(--font-libre-franklin), sans-serif" }}
          >
            {busy ? "Posting…" : "Post part →"}
          </button>
        </div>
      </section>

      <FooterGrid />
    </div>
  );
}

function Field({ label, children, mb = 22 }: { label: string; children: React.ReactNode; mb?: number }) {
  return (
    <div style={{ marginBottom: mb }}>
      <div className="lbl" style={{ color: "#0d0d0d", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}
