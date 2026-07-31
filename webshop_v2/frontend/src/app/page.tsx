import Link from "next/link";
import { getFeaturedProducts, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Truck, RotateCcw, Shield, MessageCircle } from "lucide-react";

const CATEGORY_EMOJIS: Record<string, string> = {
  womens: "👗", mens: "👔", footwear: "👟", accessories: "👜", home: "🏠",
};

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getCategories().catch(() => []),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="grid lg:grid-cols-2 min-h-[88vh]">
        <div className="bg-maison-light flex flex-col justify-center px-10 lg:px-20 py-20">
          <p className="section-eyebrow">Summer Collection 2026</p>
          <h1 className="font-serif text-5xl lg:text-7xl font-light leading-[1.05] text-maison-black mt-3 mb-5">
            Dressed for<br />the Life You <em className="text-gold italic">Want</em>
          </h1>
          <p className="text-zinc-500 text-base leading-relaxed max-w-md mb-8 font-light">
            Timeless pieces crafted from the world&apos;s finest materials. Designed to last a lifetime, worn every day.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary">Shop Collection <ArrowRight size={14} /></Link>
            <Link href="/products?is_new=true" className="btn-outline">New Arrivals</Link>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-12 pt-10 border-t border-maison-border">
            {[["12k+", "Happy Customers"], ["4.9★", "Avg. Rating"], ["200+", "Products"]].map(([n, l]) => (
              <div key={l}>
                <div className="font-serif text-3xl font-light text-maison-black">{n}</div>
                <div className="text-[0.65rem] tracking-widest uppercase text-zinc-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-maison-mid flex items-center justify-center overflow-hidden min-h-[400px]">
          <span className="font-serif text-[20rem] font-light text-white/20 select-none leading-none">M</span>
          <div className="absolute bottom-8 left-8 bg-white p-4 flex items-center gap-3 shadow-lg">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="text-xs font-semibold text-maison-black">Sustainably Crafted</p>
              <p className="text-[0.65rem] text-zinc-400">100% Certified Materials</p>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-maison-border py-3 bg-white">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {["Free Returns", "Sustainable Fashion", "Handcrafted Quality", "Express Shipping", "30-Day Guarantee",
            "Free Returns", "Sustainable Fashion", "Handcrafted Quality", "Express Shipping", "30-Day Guarantee"].map((t, i) => (
            <span key={i} className="text-[0.65rem] tracking-[0.25em] uppercase text-zinc-400 flex-shrink-0 flex items-center gap-3">
              <span className="text-gold text-[0.4rem]">◆</span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="bg-maison-light py-20 px-6 lg:px-10">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-eyebrow">Shop by Category</p>
              <h2 className="section-title">Find Your Style</h2>
            </div>
            <Link href="/products" className="text-xs tracking-widest uppercase border-b border-maison-black pb-0.5 hover:opacity-60 transition-opacity hidden sm:block">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`}
                className="group bg-white border border-maison-border p-6 flex flex-col items-center gap-3 hover:border-maison-black transition-all duration-300 hover:shadow-sm">
                <span className="text-4xl">{CATEGORY_EMOJIS[cat.slug] || "🛍️"}</span>
                <span className="text-xs font-medium tracking-widest uppercase text-zinc-600 group-hover:text-maison-black transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-20 px-6 lg:px-10">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-eyebrow">Handpicked for You</p>
              <h2 className="section-title">Bestsellers</h2>
            </div>
            <Link href="/products?featured=true" className="text-xs tracking-widest uppercase border-b border-maison-black pb-0.5 hover:opacity-60 transition-opacity hidden sm:block">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* SALE BANNER */}
      <section className="bg-maison-black text-white py-20 px-6 lg:px-10">
        <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[0.65rem] tracking-[0.3em] uppercase text-gold mb-3">Limited Time</p>
            <h2 className="font-serif text-5xl font-light leading-tight mb-5">
              Up to 40% Off<br />Summer Essentials
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md mb-8">
              Our biggest sale of the season. Premium quality at unbeatable prices — for a limited time only.
            </p>
            <Link href="/products?has_sale=true" className="btn-gold">Shop the Sale <ArrowRight size={14} /></Link>
          </div>
          <div className="font-serif text-[10rem] font-light text-white/5 text-right select-none leading-none">
            SALE
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-maison-light border-y border-maison-border py-12 px-6 lg:px-10">
        <div className="max-w-screen-xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Truck size={22} strokeWidth={1.5} />, title: "Free Shipping", desc: "On orders over €100. Delivered in 3–5 days." },
            { icon: <RotateCcw size={22} strokeWidth={1.5} />, title: "30-Day Returns", desc: "Hassle-free returns, no questions asked." },
            { icon: <Shield size={22} strokeWidth={1.5} />, title: "Secure Payment", desc: "256-bit SSL encryption via Stripe." },
            { icon: <MessageCircle size={22} strokeWidth={1.5} />, title: "24/7 Support", desc: "Our team is always here to help." },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="text-gold flex-shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <h4 className="text-sm font-semibold text-maison-black mb-1">{f.title}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 lg:px-10">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-eyebrow">Customer Reviews</p>
            <h2 className="section-title">What They Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { text: "The quality is absolutely incredible. I've ordered from many luxury brands but Maison consistently exceeds every expectation.", name: "Sophie Laurent", loc: "Paris, France" },
              { text: "Fast shipping, gorgeous packaging, and the product looks even better in person. Will definitely be shopping here again.", name: "James Mitchell", loc: "London, UK" },
              { text: "I was blown away by the attention to detail. Every stitch is perfect. This is what premium fashion should feel like.", name: "Elena Rossi", loc: "Milan, Italy" },
            ].map((t) => (
              <div key={t.name} className="bg-maison-light border border-maison-border p-8">
                <div className="text-gold text-sm tracking-widest mb-4">★★★★★</div>
                <p className="font-serif text-lg font-light italic leading-relaxed text-maison-black mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-maison-mid flex items-center justify-center text-lg">👤</div>
                  <div>
                    <p className="text-sm font-medium text-maison-black">{t.name}</p>
                    <p className="text-xs text-zinc-400">{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-maison-black text-white py-20 px-6 text-center">
        <p className="section-eyebrow text-gold">Stay Connected</p>
        <h2 className="font-serif text-4xl font-light text-white mt-2 mb-4">Join the Maison Community</h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
          Early access to new collections, exclusive offers, and style inspiration.
        </p>
        <form className="flex max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Enter your email address" required
            className="flex-1 bg-white/5 border border-white/10 px-5 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-gold transition-colors" />
          <button type="submit" className="btn-gold px-6 py-3.5 text-xs">Subscribe</button>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="bg-maison-black text-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <span className="font-serif text-xl tracking-[0.25em] uppercase block mb-4">Maison</span>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
              Premium fashion crafted for those who appreciate quality, sustainability, and timeless design.
            </p>
          </div>
          {[
            { title: "Shop", links: ["New Arrivals", "Women", "Men", "Accessories", "Sale"] },
            { title: "Help", links: ["Track Order", "Returns", "Sizing Guide", "FAQ", "Contact"] },
            { title: "Company", links: ["About Us", "Sustainability", "Careers", "Press", "Privacy"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-[0.65rem] tracking-[0.25em] uppercase text-zinc-400 mb-5">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><Link href="#" className="text-xs text-zinc-400 hover:text-gold transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 px-6 lg:px-10 py-5 max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.65rem] text-zinc-500">© 2026 Maison. All rights reserved.</p>
          <div className="flex gap-2">
            {["VISA", "MC", "AMEX", "iDEAL", "PAYPAL"].map((p) => (
              <span key={p} className="bg-white/5 text-zinc-400 text-[0.6rem] font-bold tracking-wider px-2 py-1 rounded-sm">{p}</span>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
