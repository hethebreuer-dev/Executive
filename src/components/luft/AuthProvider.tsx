"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LuftUser = {
  name: string;
  email: string;
  initials: string;
  via?: string;
};

type AuthContextValue = {
  user: LuftUser | null;
  ready: boolean;
  signIn: (user: LuftUser) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "luft_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LuftUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate persisted auth once on mount. Reading a browser-only store on
    // mount is exactly the sync-from-external-system case; the initial setState
    // here is intentional (not a cascading-render smell).
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);

    // Keep in sync across tabs / other mounts.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signIn = useCallback((next: LuftUser) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signOut }),
    [user, ready, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

// Helpers shared by the auth control ---------------------------------------
export function prettyName(local: string) {
  return local
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initialsFor(name: string, email: string) {
  const src = (name || "").trim() || email || "";
  const parts = src
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (!parts.length) return "LU";
  const a = parts[0][0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "";
  return (a + b).toUpperCase();
}
