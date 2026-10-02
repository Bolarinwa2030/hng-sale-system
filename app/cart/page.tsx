"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

function writeCart(items: CartItem[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = subtotal * 0.08;
    const shipping = subtotal > 0 ? 2500 : 0;
    const total = subtotal - discount + shipping;

    return { subtotal, discount, shipping, total };
  }, [items]);

  function updateQuantity(id: string, delta: number) {
    const nextItems = items
      .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
      .filter((item) => item.quantity > 0);

    setItems(nextItems);
    writeCart(nextItems);
  }

  function removeItem(id: string) {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    writeCart(nextItems);
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 text-slate-900 sm:px-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Your cart</p>
          <h1 className="mt-3 text-4xl font-bold">Your cart is empty</h1>
          <p className="mt-3 text-slate-600">Add a few essentials from the shop and come back here to check out.</p>
          <Link href="/products" className="mt-6 inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-400">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Checkout</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Your cart</h1>
        </div>
        <Link href="/products" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Continue shopping</Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.45fr_0.75fr]">
        <section className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-[18px] bg-slate-100">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
                <p className="mt-1 text-sm text-slate-600">₦ {item.price.toLocaleString()} each</p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-700">−</button>
                <span className="w-6 text-center font-semibold text-slate-800">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-700">+</button>
              </div>

              <div className="text-lg font-bold text-slate-900">₦ {(item.price * item.quantity).toLocaleString()}</div>
              <button onClick={() => removeItem(item.id)} className="text-sm font-medium text-rose-600 hover:text-rose-500">Remove</button>
            </div>
          ))}
        </section>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₦ {totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-₦ {totals.discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>₦ {totals.shipping.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>₦ {totals.total.toLocaleString()}</span>
            </div>
          </div>

          <button onClick={() => router.push("/checkout")} className="mt-6 block w-full rounded-full bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-amber-400">Proceed to checkout</button>
        </aside>
      </div>
    </main>
  );
}
