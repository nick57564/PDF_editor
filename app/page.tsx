"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

const tools = [
  {
    href: "/editor",
    icon: "✏️",
    num: "01",
    title: "Edit Text",
    desc: "Click any word in your PDF to rewrite it. Color, font weight, and style preserved automatically.",
    tag: "Most used",
  },
  {
    href: "/merge",
    icon: "🔗",
    num: "02",
    title: "Merge PDFs",
    desc: "Drag and drop multiple files, reorder them, and combine into one seamless document.",
    tag: null,
  },
  {
    href: "/split",
    icon: "✂️",
    num: "03",
    title: "Split Pages",
    desc: "Visual thumbnail grid. Select the pages you want to extract or remove, then download.",
    tag: null,
  },
  {
    href: "/sign",
    icon: "✍️",
    num: "04",
    title: "Fill & Sign",
    desc: "Draw your signature on a pad, then click anywhere on the PDF to place it.",
    tag: null,
  },
  {
    href: "/annotate",
    icon: "🖊️",
    num: "05",
    title: "Annotate",
    desc: "Highlight passages, draw freehand, or drop text notes directly on your PDF.",
    tag: null,
  },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse-tracking glow on cards
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".tool-card");
    const onMove = (e: MouseEvent) => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden" style={{ paddingTop: "56px" }}>

      {/* ── Background orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,110,247,0.12) 0%, transparent 70%)",
          animation: "orb-float 18s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
          animation: "orb-float 24s ease-in-out infinite reverse",
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">

        {/* ── Hero ── */}
        <div className="mb-20">
          {/* Eyebrow */}
          <div className="animate-fade-up flex items-center gap-2 mb-8">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "4px 12px", borderRadius: 999,
              border: "1px solid rgba(79,110,247,0.3)",
              background: "rgba(79,110,247,0.08)",
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
              color: "#818cf8", textTransform: "uppercase",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f6ef7", display: "inline-block" }} />
              100% Free · No account · Files stay local
            </div>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100" style={{
            fontSize: "clamp(3rem, 8vw, 7rem)",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            marginBottom: "1.5rem",
          }}>
            <span className="text-gradient">Edit any PDF.</span>
            <br />
            <span style={{ color: "rgba(240,240,255,0.25)", fontWeight: 700 }}>In your browser.</span>
          </h1>

          {/* Sub */}
          <p className="animate-fade-up delay-200" style={{
            fontSize: "1.125rem",
            color: "rgba(240,240,255,0.45)",
            maxWidth: 540,
            lineHeight: 1.7,
          }}>
            Text editing, merging, signing, annotating — everything Adobe charges for,
            rebuilt as a free tool that processes files entirely on your device.
          </p>

          {/* CTA */}
          <div className="animate-fade-up delay-300" style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/editor" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 28px", borderRadius: 12, fontWeight: 600, fontSize: "0.9rem",
              background: "linear-gradient(135deg, #4f6ef7, #a78bfa)",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(79,110,247,0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 40px rgba(79,110,247,0.55)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(79,110,247,0.4)"; }}
            >
              Start editing
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <a href="https://github.com/nick57564/PDF_editor" target="_blank" rel="noopener" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 28px", borderRadius: 12, fontWeight: 600, fontSize: "0.9rem",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="animate-fade-up delay-300" style={{
          display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem",
        }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", fontWeight: 600 }}>Tools</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* ── Tool cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}>
          {tools.map((t, i) => (
            <Link
              key={t.href}
              href={t.href}
              className={`tool-card animate-fade-up delay-${(i + 3) * 100} glow-border`}
              style={{ textDecoration: "none" }}
            >
              {/* Number + tag */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
                  {t.num}
                </span>
                {t.tag && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                    padding: "3px 8px", borderRadius: 999,
                    background: "rgba(79,110,247,0.15)", border: "1px solid rgba(79,110,247,0.3)",
                    color: "#818cf8",
                  }}>{t.tag}</span>
                )}
              </div>

              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: "1.25rem",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}>
                {t.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: "1.1rem", fontWeight: 700, color: "#f0f0ff",
                marginBottom: "0.6rem", letterSpacing: "-0.02em",
              }}>{t.title}</h3>

              {/* Description */}
              <p style={{ fontSize: "0.85rem", color: "rgba(240,240,255,0.4)", lineHeight: 1.6, margin: 0 }}>
                {t.desc}
              </p>

              {/* Arrow */}
              <div style={{
                marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "6px",
                fontSize: "12px", fontWeight: 600, color: "rgba(79,110,247,0.7)",
                transition: "gap 0.2s, color 0.2s",
              }}>
                Open tool
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Footer bar ── */}
        <div className="animate-fade-up delay-600" style={{
          marginTop: "5rem", paddingTop: "2rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem",
        }}>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.2)" }}>
            Files are processed in your browser. Nothing is ever uploaded.
          </p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.15)" }}>
            Built with Next.js · pdf-lib · PDF.js
          </p>
        </div>
      </div>
    </div>
  );
}
