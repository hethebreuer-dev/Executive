"use client";

import { useState } from "react";

export function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setSaved((s) => !s)}
      style={{
        border: saved ? "1px solid #0d0d0d" : "1px solid #e6e5e2",
        background: saved ? "#0d0d0d" : "transparent",
        color: saved ? "#ffffff" : "#0d0d0d",
        fontFamily: "var(--font-libre-franklin), sans-serif",
        fontWeight: 500,
        fontSize: 13,
        padding: "8px 16px",
        cursor: "pointer",
      }}
    >
      {saved ? "Saved ✓" : "+ Save"}
    </button>
  );
}
