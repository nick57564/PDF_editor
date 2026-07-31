"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { getOrderBySession } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import type { Order } from "@/types";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
    if (!sessionId) { setLoading(false); return; }
    getOrderBySession(sessionId)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-400 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-maison-light flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full bg-white border border-maison-border p-10 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={56} className="text-emerald-500" strokeWidth={1.5} />
        </div>

        <p className="section-eyebrow">Order Confirmed</p>
        <h1 className="font-serif text-3xl font-light text-maison-black mt-2 mb-3">Thank You!</h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          Your order has been placed successfully. You&apos;ll receive a confirmation email shortly.
        </p>

        {order && (
          <div className="bg-maison-light border border-maison-border p-5 text-left mb-8 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-zinc-400" />
              <span className="text-xs font-semibold tracking-widest uppercase">Order Details</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Order number</span>
              <span className="font-semibold text-maison-black">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Status</span>
              <span className="capitalize font-medium text-emerald-600">{order.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Total</span>
              <span className="font-semibold">€{order.total.toFixed(2)}</span>
            </div>
            <div className="border-t border-maison-border pt-3 space-y-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-zinc-500">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/products" className="btn-primary w-full justify-center">
            Continue Shopping <ArrowRight size={14} />
          </Link>
          <Link href="/" className="btn-outline w-full justify-center">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
