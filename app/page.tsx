"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const tools = [
  { href: "/editor",   num: "01", title: "Edit Text",   desc: "Click any word to rewrite it. Color, bold and italic preserved." },
  { href: "/merge",    num: "02", title: "Merge PDFs",   desc: "Combine multiple files into one. Drag to reorder." },
  { href: "/split",    num: "03", title: "Split Pages",  desc: "Visual page grid. Extract or remove pages." },
  { href: "/sign",     num: "04", title: "Fill & Sign",  desc: "Draw a signature and place it anywhere." },
  { href: "/annotate", num: "05", title: "Annotate",     desc: "Highlight, draw and add text notes." },
];

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Count from 0 → 100 over ~1.6s
    let current = 0;
    const step = () => {
      const increment = Math.ceil(Math.random() * 8) + 2;
      current = Math.min(current + increment, 100);
      setProgress(current);
      if (current < 100) {
        setTimeout(step, 18 + Math.random() * 30);
      } else {
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => setLoaded(true), 950);
        }, 300);
      }
    };
    setTimeout(step, 200);
  }, []);

  return (
    <>
      {/* ── Loader ── */}
      {!loaded && (
        <div className={`loader ${exiting ? "exit" : ""}`}>
          <div style={{
            fontFamily: "var(--font-inter)",
            fontSize: "0.75rem", letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(245,244,240,0.4)",
            marginBottom: "0.75rem",
          }}>
            Loading content
          </div>
          <div style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(4rem, 12vw, 9rem)",
            fontWeight: 800, lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "#f5f4f0",
          }}>
            {progress}%
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      {loaded && (
        <div style={{ minHeight: "100vh", background: "#f5f4f0" }}>

          {/* ── Hero ── */}
          <section style={{
            minHeight: "100vh",
            display: "flex", flexDirection: "column",
            justifyContent: "flex-end",
            padding: "0 3rem 4rem",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Big background number */}
            <div style={{
              position: "absolute", top: "50%", right: "3rem",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(12rem, 30vw, 26rem)",
              fontWeight: 900, lineHeight: 1,
              letterSpacing: "-0.06em",
              color: "rgba(12,12,12,0.04)",
              userSelect: "none", pointerEvents: "none",
              animation: "reveal-up 1.2s cubic-bezier(0.16,1,0.3,1) 0.1s both",
            }}>
              PDF
            </div>

            {/* Eyebrow */}
            <div className="animate-fade-in delay-100" style={{
              fontSize: "0.75rem", fontWeight: 500,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "#888880", marginBottom: "2rem",
              display: "flex", alignItems: "center", gap: "0.75rem",
            }}>
              <span style={{ width: 24, height: 1, background: "#888880", display: "inline-block" }} />
              Free · No account · Files stay local
            </div>

            {/* Main headline */}
            <h1 className="animate-reveal-up delay-100" style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(3.5rem, 9vw, 8rem)",
              fontWeight: 800, lineHeight: 1.0,
              letterSpacing: "-0.04em",
              maxWidth: "14ch",
              marginBottom: "3rem",
            }}>
              We build the<br />
              <em style={{ fontStyle: "italic", color: "#444" }}>future of</em><br />
              PDF editing.
            </h1>

            {/* Sub + CTA row */}
            <div className="animate-fade-in delay-300" style={{
              display: "flex", alignItems: "flex-end",
              justifyContent: "space-between", flexWrap: "wrap", gap: "2rem",
            }}>
              <p style={{
                fontSize: "1rem", color: "#888880",
                maxWidth: "36ch", lineHeight: 1.7,
                fontWeight: 400,
              }}>
                Everything Adobe Acrobat charges for —
                rebuilt as a free browser tool that processes
                your files entirely on your device.
              </p>
              <Link href="/editor" style={{
                display: "inline-flex", alignItems: "center", gap: "0.75rem",
                padding: "1rem 2rem",
                background: "#0c0c0c", color: "#f5f4f0",
                borderRadius: "100px",
                fontWeight: 500, fontSize: "0.9rem",
                textDecoration: "none", letterSpacing: "0.01em",
                transition: "transform 0.3s, box-shadow 0.3s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
              >
                Explore tools
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>

            {/* Scroll hint */}
            <div className="animate-fade-in delay-500" style={{
              position: "absolute", bottom: "2rem", right: "3rem",
              fontSize: "0.7rem", letterSpacing: "0.15em",
              textTransform: "uppercase", color: "#bbb",
              display: "flex", alignItems: "center", gap: "0.5rem",
              writingMode: "vertical-rl",
            }}>
              Scroll ↓
            </div>
          </section>

          {/* ── Tools section ── */}
          <section style={{ padding: "6rem 3rem", borderTop: "1px solid #e0ddd6" }}>
            {/* Section header */}
            <div className="animate-fade-in" style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-end", marginBottom: "1rem",
            }}>
              <h2 style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                fontWeight: 700, letterSpacing: "-0.03em",
              }}>
                Our tools
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#888880", letterSpacing: "0.1em" }}>
                {tools.length} available
              </span>
            </div>

            {/* Tool list */}
            <div style={{ marginTop: "0" }}>
              {tools.map((t) => (
                <Link key={t.href} href={t.href} className="tool-card">
                  {/* Number */}
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 600,
                    color: "#bbb", letterSpacing: "0.08em",
                    paddingTop: "0.4rem",
                  }}>{t.num}</span>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                    fontWeight: 700, letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}>{t.title}</h3>

                  {/* Description */}
                  <p style={{ fontSize: "0.875rem", color: "#888880", lineHeight: 1.6 }}>
                    {t.desc}
                  </p>

                  {/* Arrow */}
                  <div className="card-arrow" style={{ paddingTop: "0.3rem", textAlign: "right" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 16L16 4M16 4H8M16 4v8" stroke="#0c0c0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>
              ))}
              {/* Last border */}
              <div style={{ borderTop: "1px solid #e0ddd6" }} />
            </div>
          </section>

          {/* ── Values strip ── */}
          <section style={{
            padding: "4rem 3rem",
            background: "#0c0c0c",
            display: "flex", flexWrap: "wrap", gap: "3rem",
          }}>
            {["Open source", "Zero tracking", "Files stay local", "No account needed"].map((v) => (
              <div key={v} style={{ flex: "1 1 200px" }}>
                <div style={{
                  width: 32, height: 1,
                  background: "rgba(245,244,240,0.2)",
                  marginBottom: "1rem",
                }} />
                <p style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "1.2rem", fontWeight: 600,
                  color: "#f5f4f0", letterSpacing: "-0.01em",
                }}>{v}</p>
              </div>
            ))}
          </section>

          {/* ── Footer ── */}
          <footer style={{
            padding: "2rem 3rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: "1rem",
            borderTop: "1px solid #e0ddd6",
          }}>
            <span style={{
              fontFamily: "var(--font-playfair)",
              fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em",
            }}>
              PDF<em style={{ fontStyle: "italic" }}>editor</em>
            </span>
            <span style={{ fontSize: "0.8rem", color: "#888880" }}>
              Built with Next.js · pdf-lib · PDF.js
            </span>
            <a href="https://github.com/nick57564/PDF_editor" target="_blank" rel="noopener"
              style={{ fontSize: "0.8rem", color: "#0c0c0c", textDecoration: "none", borderBottom: "1px solid #ccc" }}>
              GitHub →
            </a>
          </footer>
        </div>
      )}
    </>
  );
}
