"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { getProducts, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import type { Product, Category, SortOption } from "@/types";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest", value: "created_at_desc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating_desc" },
  { label: "Name A-Z", value: "name_asc" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [sort, setSort] = useState<SortOption>("created_at_desc");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        page, sort,
        category: category || undefined,
        search: search || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
      });
      setProducts(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, search, minPrice, maxPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories().then(setCategories); }, []);

  const clearFilters = () => { setCategory(""); setSearch(""); setMinPrice(""); setMaxPrice(""); setPage(1); };

  return (
    <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="section-eyebrow">Discover</p>
          <h1 className="section-title">All Products</h1>
          <p className="text-xs text-zinc-400 mt-1">{total} products</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-maison-border px-4 py-2.5 text-xs tracking-widest uppercase hover:border-maison-black transition-colors">
            <SlidersHorizontal size={13} /> Filters
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
            className="border border-maison-border px-4 py-2.5 text-xs bg-white outline-none hover:border-maison-black transition-colors cursor-pointer">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-widest uppercase">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-zinc-400 hover:text-maison-black flex items-center gap-1">
                <X size={11} /> Clear all
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="label">Search</label>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products…" className="input text-sm" />
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <div className="space-y-1.5">
                <button onClick={() => { setCategory(""); setPage(1); }}
                  className={`w-full text-left text-xs px-3 py-2 transition-colors ${!category ? "bg-maison-black text-white" : "hover:bg-maison-light"}`}>
                  All Categories
                </button>
                {categories.map((c) => (
                  <button key={c.id} onClick={() => { setCategory(c.slug); setPage(1); }}
                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${category === c.slug ? "bg-maison-black text-white" : "hover:bg-maison-light"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="label">Price Range</label>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  placeholder="Min €" className="input text-sm w-1/2" type="number" min="0" />
                <span className="text-zinc-300">—</span>
                <input value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  placeholder="Max €" className="input text-sm w-1/2" type="number" min="0" />
              </div>
            </div>
          </aside>
        )}

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-maison-light aspect-[3/4] mb-3" />
                  <div className="h-3 bg-maison-light rounded w-1/2 mb-2" />
                  <div className="h-4 bg-maison-light rounded w-3/4 mb-2" />
                  <div className="h-3 bg-maison-light rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-sm">No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 text-xs font-medium transition-colors ${page === p ? "bg-maison-black text-white" : "border border-maison-border hover:border-maison-black"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
