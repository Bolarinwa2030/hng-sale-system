"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { getProductBySlug, products, type ShopProduct } from "@/lib/shop-data";

const CART_KEY = "mariam-market-cart";

function readCart(): Array<{ id: string; name: string; price: number; quantity: number; image: string }> {
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

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const product = getProductBySlug(params.slug);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Product not found</p>
          <h1 className="mt-3 text-3xl font-bold">This item is no longer available.</h1>
          <Link href="/products" className="mt-6 inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-400">
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  const relatedProducts = useMemo(
    () => products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4),
    [product]
  );

  function addToCart(selectedProduct: ShopProduct) {
    const current = readCart();
    const nextItems = [...current];
    const itemIndex = nextItems.findIndex((item) => item.id === selectedProduct.id);

    if (itemIndex >= 0) {
      nextItems[itemIndex].quantity += quantity;
    } else {
      nextItems.push({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity,
        image: selectedProduct.image,
      });
    }

    window.localStorage.setItem(CART_KEY, JSON.stringify(nextItems));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-700">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-slate-700">Shop</Link>
        <span>/</span>
        <span className="text-slate-700">{product.name}</span>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-slate-100">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" priority />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{product.badge ?? product.category}</span>
            <button className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Wishlist</button>
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900 md:text-4xl">{product.name}</h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1 font-medium text-amber-500">★ {product.rating}</span>
            <span>({product.reviews} reviews)</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{product.stockLabel}</span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-bold text-slate-900">₦ {product.price.toLocaleString()}</span>
            {product.oldPrice ? <span className="text-lg text-slate-400 line-through">₦ {product.oldPrice.toLocaleString()}</span> : null}
            {product.discount ? <span className="rounded-full bg-rose-100 px-2 py-1 text-sm font-semibold text-rose-700">-{product.discount}%</span> : null}
          </div>

          <p className="mt-5 text-base leading-7 text-slate-600">{product.description}</p>

          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 text-lg font-semibold text-slate-700">−</button>
              <span className="min-w-10 text-center font-semibold text-slate-800">{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-10 w-10 text-lg font-semibold text-slate-700">+</button>
            </div>

            <button onClick={() => addToCart(product)} className="flex-1 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-400">
              Add to cart
            </button>
          </div>

          <button className="mt-3 w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Buy now</button>
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Product details</h2>
          <dl className="mt-6 space-y-4">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <dt className="text-sm text-slate-500">{spec.label}</dt>
                <dd className="text-sm font-medium text-slate-800">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Description</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{product.shortDescription}</p>
          <p className="mt-4 text-base leading-7 text-slate-600">{product.description}</p>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Related products</h2>
          <Link href="/products" className="text-sm font-semibold text-amber-600 hover:text-amber-500">View all</Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((item) => (
            <Link key={item.id} href={`/product/${item.slug}`} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <Image src={item.image} alt={item.name} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
              </div>
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.category}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-slate-900">₦ {item.price.toLocaleString()}</p>
                    {item.oldPrice ? <p className="text-sm text-slate-400 line-through">₦ {item.oldPrice.toLocaleString()}</p> : null}
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{item.rating}★</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
