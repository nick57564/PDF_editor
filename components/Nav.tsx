"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tools = [
  { href: "/editor",   label: "Edit Text", icon: "✏️" },
  { href: "/merge",    label: "Merge",     icon: "🔗" },
  { href: "/split",    label: "Split",     icon: "✂️" },
  { href: "/sign",     label: "Sign",      icon: "✍️" },
  { href: "/annotate", label: "Annotate",  icon: "🖊️" },
];

export default function Nav() {
  const path = usePathname();
  const isHome = path === "/";

  return (
    <nav className="nav-bar">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4f6ef7] to-[#a78bfa] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/30">
            P
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-tight">PDFEditor</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-4 bg-white/10 flex-shrink-0" />

        {/* Tool links */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
          {tools.map((t) => {
            const active = path === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0
                  ${active
                    ? "bg-[#4f6ef7]/20 text-[#818cf8] border border-[#4f6ef7]/30"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
                  }`}
              >
                <span className="text-sm leading-none">{t.icon}</span>
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Badge */}
        <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-white/30 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Free
        </div>
      </div>
    </nav>
  );
}
