"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  initialsFor,
  prettyName,
  useAuth,
  type LuftUser,
} from "./AuthProvider";

type Variant = "inline" | "menu";

const INTENTS = ["Buy a car", "Sell a car", "Both"] as const;

export function Auth({
  variant = "inline",
  onDark = false,
}: {
  variant?: Variant;
  onDark?: boolean;
}) {
  const { user, ready, signIn, signOut } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("Buy a car");
  const [error, setError] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  // Avoid a signed-out flash before localStorage is read.
  if (!ready) {
    return <span style={{ display: "inline-flex", width: 60, height: 32 }} />;
  }

  const isCreate = mode === "create";

  function openSignin() {
    setMode("signin");
    setError("");
    setModalOpen(true);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    if (isCreate && !name.trim()) {
      setError("Tell us your name.");
      return;
    }
    const displayName = isCreate ? name.trim() : prettyName(email.split("@")[0]);
    const next: LuftUser = {
      name: displayName,
      email,
      initials: initialsFor(name, email),
    };
    finish(next);
  }

  function social(provider: string) {
    const em = email || "you@" + provider.toLowerCase() + ".com";
    const displayName = name.trim() || prettyName(em.split("@")[0]);
    finish({
      name: displayName,
      email: em,
      initials: initialsFor(displayName, em),
      via: provider,
    });
  }

  function finish(next: LuftUser) {
    signIn(next);
    setPassword("");
    setError("");
    setModalOpen(false);
  }

  // --- Trigger --------------------------------------------------------------
  let trigger: React.ReactNode;

  if (variant === "menu") {
    // Mobile menu variant.
    trigger = user ? (
      <Link href="/account" className="luft-mm-link" style={{ display: "block" }}>
        {user.name}
      </Link>
    ) : (
      <button
        type="button"
        className="luft-mm-link"
        onClick={openSignin}
      >
        Sign in
      </button>
    );
  } else if (user) {
    trigger = (
      <div style={{ position: "relative" }} ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontFamily: "var(--font-libre-franklin), sans-serif",
          }}
        >
          <Avatar initials={user.initials} size={32} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#0d0d0d" }}>
            {user.name}
          </span>
        </button>
        {menuOpen && (
          <div className="auth-menu-pop" style={{ position: "absolute", top: 44, right: 0 }}>
            <Link href="/account" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/account" onClick={() => setMenuOpen(false)}>
              Saved cars
            </Link>
            <Link href="/sell" onClick={() => setMenuOpen(false)}>
              Sell a car
            </Link>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                signOut();
              }}
              style={{ color: "#8a8a85" }}
            >
              Sign out
            </a>
          </div>
        )}
      </div>
    );
  } else {
    trigger = (
      <button
        type="button"
        onClick={openSignin}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "var(--font-libre-franklin), sans-serif",
          fontSize: 14,
          fontWeight: onDark ? 600 : 500,
          color: onDark ? "#ffffff" : "#0d0d0d",
        }}
      >
        Sign in
      </button>
    );
  }

  return (
    <>
      {trigger}
      {modalOpen && (
        <div
          className="auth-scrim"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <form
            onSubmit={submit}
            style={{
              width: "100%",
              maxWidth: 428,
              marginTop: "6vh",
              background: "#ffffff",
              border: "1px solid #0d0d0d",
              padding: "38px 36px 34px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 26,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                <span
                  className="display"
                  style={{ fontWeight: 700, fontSize: 22, letterSpacing: "0.02em" }}
                >
                  LUFT
                </span>
                <span className="lbl">Account</span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 5 19 19" />
                  <path d="M19 5 5 19" />
                </svg>
              </button>
            </div>

            <h2
              className="display"
              style={{
                fontWeight: 600,
                fontSize: 30,
                lineHeight: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {isCreate ? "Create your account" : "Welcome back"}
            </h2>
            <p style={{ fontSize: 14, color: "#8a8a85", lineHeight: 1.5, marginBottom: 24 }}>
              {isCreate
                ? "Save cars, list your own, and get comp-priced valuations."
                : "Sign in to your watchlist, listings, and Garage."}
            </p>

            <div
              style={{
                display: "flex",
                gap: 24,
                borderBottom: "1px solid #e6e5e2",
                marginBottom: 24,
              }}
            >
              <Tab active={!isCreate} onClick={() => { setMode("signin"); setError(""); }}>
                Sign in
              </Tab>
              <Tab active={isCreate} onClick={() => { setMode("create"); setError(""); }}>
                Create account
              </Tab>
            </div>

            {isCreate && (
              <Field label="Name">
                <input
                  className="luft-field"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Your name or dealership"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                className="luft-field"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@email.com"
              />
            </Field>
            <Field
              label="Password"
              extra={
                !isCreate ? (
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{ fontSize: 12, color: "#8a8a85" }}
                  >
                    Forgot?
                  </a>
                ) : undefined
              }
            >
              <input
                className="luft-field"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
              />
            </Field>

            {isCreate && (
              <div style={{ margin: "18px 0 6px" }}>
                <div className="lbl" style={{ color: "#0d0d0d", marginBottom: 10 }}>
                  I&apos;m here to
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {INTENTS.map((label) => {
                    const on = intent === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setIntent(label)}
                        style={{
                          fontFamily: "var(--font-libre-franklin), sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          padding: "9px 15px",
                          cursor: "pointer",
                          background: on ? "#0d0d0d" : "#fff",
                          color: on ? "#fff" : "#0d0d0d",
                          border: on ? "1px solid #0d0d0d" : "1px solid #d9d8d4",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: "#0d0d0d",
                  background: "#f2f1ef",
                  padding: "9px 12px",
                  margin: "4px 0",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                background: "#0d0d0d",
                color: "#fff",
                fontFamily: "var(--font-libre-franklin), sans-serif",
                fontSize: 15,
                fontWeight: 600,
                padding: 15,
                border: "none",
                cursor: "pointer",
                marginTop: 18,
              }}
            >
              {isCreate ? "Create account" : "Sign in"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
              <span style={{ flex: 1, height: 1, background: "#e6e5e2" }} />
              <span
                className="mono"
                style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#adaca7" }}
              >
                or
              </span>
              <span style={{ flex: 1, height: 1, background: "#e6e5e2" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SocialButton onClick={() => social("Google")}>Continue with Google</SocialButton>
              <SocialButton onClick={() => social("Apple")}>Continue with Apple</SocialButton>
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "#8a8a85", marginTop: 22 }}>
              {isCreate ? "Already have an account?" : "New to LUFT?"}{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode((m) => (m === "create" ? "signin" : "create"));
                  setError("");
                }}
                style={{ color: "#0d0d0d", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}
              >
                {isCreate ? "Sign in" : "Create one"}
              </a>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

export function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#0d0d0d",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: size <= 32 ? 12 : 14,
        flex: "0 0 auto",
      }}
    >
      {initials}
    </span>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-libre-franklin), sans-serif",
        fontSize: 14,
        fontWeight: 600,
        padding: "0 0 12px",
        marginBottom: -1,
        color: active ? "#0d0d0d" : "#adaca7",
        borderBottom: active ? "2px solid #0d0d0d" : "2px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  extra,
  children,
}: {
  label: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#0d0d0d",
          }}
        >
          {label}
        </span>
        {extra}
      </div>
      {children}
    </div>
  );
}

function SocialButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: "#fff",
        border: "1px solid #0d0d0d",
        fontFamily: "var(--font-libre-franklin), sans-serif",
        fontSize: 14,
        fontWeight: 600,
        padding: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
