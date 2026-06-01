"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tools = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/editor", label: "Edit Text", icon: "✏️" },
  { href: "/merge", label: "Merge", icon: "🔗" },
  { href: "/split", label: "Split", icon: "✂️" },
  { href: "/sign", label: "Sign", icon: "✍️" },
  { href: "/annotate", label: "Annotate", icon: "🖊️" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1 overflow-x-auto flex-shrink-0">
      {tools.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
            ${path === t.href
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"}`}
        >
          <span>{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
