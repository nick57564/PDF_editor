"use client";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { createCheckoutSession } from "@/lib/api";
import toast from "react-hot-toast";
import { useState } from "react";
import { clsx } from "clsx";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, itemCount } = useCartStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    if (!email.includes("@")) { toast.error("Invalid email address"); return; }
    setLoading(true);
    try {
      const checkoutItems = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
      const session = await createCheckoutSession(checkoutItems, email);
      window.location.href = session.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const freeShipping = subtotal >= 100;

  return (
    <>
      {/* Overlay */}
      <div onClick={closeCart}
        className={clsx("fixed inset-0 bg-black/40 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")} />

      {/* Drawer */}
      <div className={clsx(
        "fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col",
        "shadow-2xl transition-transform duration-400 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-maison-border">
          <h2 className="font-serif text-xl font-light">Your Cart ({itemCount})</h2>
          <button onClick={closeCart} className="p-1 text-zinc-400 hover:text-maison-black transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Free shipping progress */}
        {!freeShipping && subtotal > 0 && (
          <div className="px-6 py-3 bg-maison-light border-b border-maison-border">
            <p className="text-xs text-zinc-500 mb-1.5">
              Add <span className="font-semibold text-maison-black">€{(100 - subtotal).toFixed(2)}</span> more for free shipping
            </p>
            <div className="h-1 bg-maison-border rounded-full overflow-hidden">
              <div className="h-full bg-gold transition-all duration-500 rounded-full"
                style={{ width: `${Math.min((subtotal / 100) * 100, 100)}%` }} />
            </div>
          </div>
        )}
        {freeShipping && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-700 font-medium">
            🎉 You qualify for free shipping!
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
              <ShoppingBag size={40} strokeWidth={1} />
              <p className="text-sm">Your cart is empty</p>
              <button onClick={closeCart} className="btn-outline text-xs py-2.5 px-6">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4 py-3 border-b border-maison-border last:border-0">
                  <div className="w-16 h-20 bg-maison-light flex items-center justify-center text-3xl flex-shrink-0">
                    🛍️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.65rem] tracking-widest uppercase text-zinc-400 mb-0.5">
                      {item.product.category?.name}
                    </p>
                    <p className="text-sm font-medium text-maison-black truncate">{item.product.name}</p>
                    <p className="text-sm font-semibold mt-0.5">€{item.product.price}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-maison-border">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-maison-light transition-colors">
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-maison-light transition-colors"
                          disabled={item.quantity >= item.product.stock}>
                          <Plus size={11} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.product.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-maison-border px-6 py-5 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-semibold">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Shipping</span>
              <span>{freeShipping ? "Free" : "Calculated at checkout"}</span>
            </div>

            {/* Email for checkout */}
            <div>
              <label className="label">Email for order confirmation</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" className="input text-sm" />
            </div>

            <button onClick={handleCheckout} disabled={loading}
              className="btn-primary w-full justify-center gap-2">
              {loading ? "Redirecting…" : (<>Checkout <ArrowRight size={14} /></>)}
            </button>
            <p className="text-center text-[0.65rem] text-zinc-400">
              Secure payment by Stripe · SSL encrypted
            </p>
          </div>
        )}
      </div>
    </>
  );
}
