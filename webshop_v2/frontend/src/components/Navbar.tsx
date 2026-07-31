"use client";
import Link from "next/link";
import { ShoppingBag, Search, User, Heart, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

const NAV_LINKS = [
  { label: "New In", href: "/products?is_new=true" },
  { label: "Women", href: "/products?category=womens" },
  { label: "Men", href: "/products?category=mens" },
  { label: "Footwear", href: "/products?category=footwear" },
  { label: "Accessories", href: "/products?category=accessories" },
  { label: "Sale", href: "/products?has_sale=true" },
];

export function Navbar() {
  const { itemCount, toggleCart } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Announcement */}
      <div className="bg-maison-black text-white text-center py-2.5 text-[0.65rem] tracking-[0.25em] uppercase">
        Free worldwide shipping on orders over €100 —{" "}
        <Link href="/products?is_new=true" className="text-gold underline underline-offset-2">Shop New Arrivals</Link>
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-maison-border">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="font-serif text-2xl tracking-[0.25em] uppercase text-maison-black">
            Maison
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href}
                className="text-[0.7rem] font-medium tracking-[0.15em] uppercase text-zinc-500 hover:text-maison-black transition-colors border-b border-transparent hover:border-maison-black pb-0.5">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-zinc-500 hover:text-maison-black transition-colors hidden sm:block">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-maison-black transition-colors hidden sm:block">
              <User size={18} strokeWidth={1.5} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-maison-black transition-colors hidden sm:block">
              <Heart size={18} strokeWidth={1.5} />
            </button>
            <button onClick={toggleCart} className="p-2 text-zinc-500 hover:text-maison-black transition-colors relative">
              <ShoppingBag size={18} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-maison-black text-white text-[0.55rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-maison-border px-6 py-3 bg-maison-light">
            <div className="max-w-screen-xl mx-auto flex items-center gap-3">
              <Search size={16} className="text-zinc-400" />
              <input autoFocus type="text" placeholder="Search products, categories…"
                className="flex-1 bg-transparent outline-none text-sm text-maison-black placeholder:text-zinc-400"
                onKeyDown={(e) => { if (e.key === "Escape") setSearchOpen(false); }}
              />
              <button onClick={() => setSearchOpen(false)} className="text-zinc-400 hover:text-maison-black">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-maison-border bg-white">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-6 py-3.5 text-sm border-b border-maison-border text-zinc-600 hover:text-maison-black hover:bg-maison-light transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
