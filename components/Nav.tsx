"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tools = [
  { href: "/editor",   label: "Edit Text" },
  { href: "/merge",    label: "Merge" },
  { href: "/split",    label: "Split" },
  { href: "/sign",     label: "Sign" },
  { href: "/annotate", label: "Annotate" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="site-nav">
        <Link href="/" style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "1.1rem", fontWeight: 700,
          color: path === "/" ? "#f5f4f0" : "#0c0c0c",
          textDecoration: "none", letterSpacing: "-0.02em",
        }}>
          PDF<em style={{ fontStyle: "italic" }}>editor</em>
        </Link>

        <button
          onClick={() => setOpen(!open)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: path === "/" ? "#f5f4f0" : "#0c0c0c",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}
        >
          {open ? "Close" : "Menu"}
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{open ? "×" : "≡"}</span>
        </button>
      </nav>

      {/* Full-screen menu overlay */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "#0c0c0c",
          display: "flex", flexDirection: "column",
          justifyContent: "flex-end",
          padding: "3rem",
          animation: "fade-in 0.3s ease both",
        }}>
          <button onClick={() => setOpen(false)} style={{
            position: "absolute", top: "1.5rem", right: "3rem",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#f5f4f0",
          }}>Close ×</button>

          <div style={{ marginBottom: "3rem" }}>
            {tools.map((t, i) => (
              <Link key={t.href} href={t.href} onClick={() => setOpen(false)} style={{
                display: "block",
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                fontWeight: 700, letterSpacing: "-0.03em",
                color: path === t.href ? "#888880" : "#f5f4f0",
                textDecoration: "none",
                lineHeight: 1.1,
                borderTop: i === 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                paddingTop: "0.6rem",
                paddingBottom: "0.6rem",
                marginTop: "0.4rem",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { if (path !== t.href) (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = path === t.href ? "#888880" : "#f5f4f0"; }}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <p style={{ fontSize: "0.8rem", color: "rgba(245,244,240,0.3)", letterSpacing: "0.05em" }}>
            Free · No account · Files stay local
          </p>
        </div>
      )}
    </>
  );
}
