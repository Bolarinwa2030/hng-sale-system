"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

const CART_KEY = "mariam-market-cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(() => readCart());
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!items.length) {
      router.push("/cart");
    }
  }, [items.length, router]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = subtotal * 0.08;
    const shipping = subtotal > 0 ? 2500 : 0;
    const total = subtotal - discount + shipping;

    return { subtotal, discount, shipping, total };
  }, [items]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const client = createBrowserSupabaseClient();
      const { data: sessionData, error: sessionError } = await client.auth.getSession();

      if (sessionError || !sessionData.session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          paymentStatus: paymentMethod === "paystack" ? "pending" : "paid",
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Checkout failed.");
      }

      const orderNumber = data.order?.order_number ?? "MKT-000000";
      const finalName = customerName || "Customer";

      window.localStorage.removeItem(CART_KEY);
      setItems([]);
      router.push(`/order-success?orderNumber=${encodeURIComponent(orderNumber)}&customerName=${encodeURIComponent(finalName)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Checkout</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Complete your order</h1>
        </div>
        <Link href="/cart" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Back to cart
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Customer information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500" required />
              <input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} type="email" placeholder="Email address" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500" required />
              <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Phone number" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 sm:col-span-2" />
              <textarea value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} placeholder="Delivery address" className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 sm:col-span-2" required />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${paymentMethod === "cod" ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Cash on delivery</span>
                  <span className="text-xs text-slate-500">Pay when the order arrives</span>
                </span>
                <input type="radio" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="h-4 w-4 accent-amber-500" />
              </label>

              <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${paymentMethod === "paystack" ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Paystack</span>
                  <span className="text-xs text-slate-500">Secure card payment</span>
                </span>
                <input type="radio" checked={paymentMethod === "paystack"} onChange={() => setPaymentMethod("paystack")} className="h-4 w-4 accent-amber-500" />
              </label>
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Order review</h2>

          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="text-slate-500">Qty: {item.quantity}</div>
                </div>
                <span className="font-semibold text-slate-900">₦ {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
            <div className="flex justify-between"><span>Subtotal</span><span>₦ {totals.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-₦ {totals.discount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>₦ {totals.shipping.toLocaleString()}</span></div>
            <div className="flex justify-between text-base font-semibold text-slate-900"><span>Total</span><span>₦ {totals.total.toLocaleString()}</span></div>
          </div>

          {message ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p> : null}

          <button type="submit" disabled={loading} className="mt-6 block w-full rounded-full bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-75">
            {loading ? "Placing order..." : "Place order"}
          </button>
        </aside>
      </form>
    </main>
  );
}
