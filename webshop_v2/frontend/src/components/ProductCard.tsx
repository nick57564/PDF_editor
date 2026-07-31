"use client";
import Link from "next/link";
import { ShoppingBag, Heart, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { clsx } from "clsx";

const EMOJI_MAP: Record<string, string> = {
  "silk-midi-dress": "👗", "linen-blazer": "🧥", "cashmere-turtleneck": "🧣",
  "tailored-wool-suit": "👔", "oxford-button-down": "👕", "merino-crewneck": "🧶",
  "leather-chelsea-boots": "👢", "suede-loafers": "👟",
  "structured-leather-tote": "👜", "silk-scarf": "🧣",
  "linen-throw-blanket": "🏠", "ceramic-candle-set": "🕯️",
};

interface Props {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: Props) {
  const { addItem } = useCartStore();
  const emoji = EMOJI_MAP[product.slug] || "🛍️";
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className={clsx("group cursor-pointer", className)}>
      <Link href={`/products/${product.slug}`}>
        {/* Image */}
        <div className="relative bg-maison-light aspect-[3/4] overflow-hidden mb-3">
          <div className="w-full h-full flex items-center justify-center text-7xl
                          transition-transform duration-500 group-hover:scale-105">
            {emoji}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="bg-maison-black text-white text-[0.6rem] font-bold tracking-widest uppercase px-2 py-0.5">
                New
              </span>
            )}
            {discount && (
              <span className="bg-red-600 text-white text-[0.6rem] font-bold tracking-widest uppercase px-2 py-0.5">
                -{discount}%
              </span>
            )}
          </div>

          {/* Hover actions */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2
                          translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                          transition-all duration-300">
            <button onClick={handleAddToCart}
              className="flex-1 bg-maison-black text-white text-[0.65rem] font-semibold
                         tracking-widest uppercase py-2.5 hover:bg-zinc-700 transition-colors
                         flex items-center justify-center gap-2">
              <ShoppingBag size={13} /> Add to Cart
            </button>
            <button className="bg-white w-10 flex items-center justify-center hover:bg-maison-light transition-colors">
              <Heart size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="text-[0.65rem] tracking-widest uppercase text-zinc-400 mb-1">
          {product.category?.name}
        </div>
        <div className="text-sm font-medium text-maison-black mb-1.5 group-hover:text-zinc-600 transition-colors">
          {product.name}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.compare_at_price && (
              <span className="text-xs text-zinc-400 line-through">€{product.compare_at_price}</span>
            )}
            <span className={clsx("text-sm font-semibold", product.compare_at_price ? "text-red-600" : "text-maison-black")}>
              €{product.price}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[0.65rem] text-zinc-400">
            <Star size={10} className="fill-gold text-gold" />
            {product.rating} ({product.review_count})
          </div>
        </div>
      </Link>
    </div>
  );
}
