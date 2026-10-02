"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { categories, products, type ShopProduct } from "@/lib/shop-data";

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

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [visibleCount, setVisibleCount] = useState(8);

  const filteredProducts = useMemo(() => {
    const normalized = search.toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.category.toLowerCase().includes(normalized) ||
        product.shortDescription.toLowerCase().includes(normalized);

      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesPrice = product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    switch (sortBy) {
      case "price-low":
        return [...filtered].sort((a, b) => a.price - b.price);
      case "price-high":
        return [...filtered].sort((a, b) => b.price - a.price);
      case "rating":
        return [...filtered].sort((a, b) => b.rating - a.rating);
      default:
        return filtered;
    }
  }, [search, selectedCategory, sortBy, maxPrice]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  function addToCart(product: ShopProduct) {
    const current = readCart();
    const itemIndex = current.findIndex((item) => item.id === product.id);

    if (itemIndex >= 0) {
      current[itemIndex].quantity += 1;
    } else {
      current.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
      });
    }

    window.localStorage.setItem(CART_KEY, JSON.stringify(current));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Shop all</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">Everything your home needs</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back home</Link>
            <Link href="/cart" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Cart</Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-lg text-slate-400">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, categories, or staples" className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-500">
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
            <input type="range" min="2000" max="50000" step="1000" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full accent-amber-500" />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => setSelectedCategory("All")} className={`rounded-full px-4 py-2 text-sm font-medium ${selectedCategory === "All" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
          All
        </button>
        {categories.map((category) => (
          <button key={category.slug} type="button" onClick={() => setSelectedCategory(category.name)} className={`rounded-full px-4 py-2 text-sm font-medium ${selectedCategory === category.name ? "bg-amber-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
            {category.name}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 text-sm text-slate-600">
        <p>{filteredProducts.length} products found</p>
        <p>Max price: ₦ {maxPrice.toLocaleString()}</p>
      </div>

      {filteredProducts.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <Image src={product.image} alt={product.name} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
                  {product.badge ? <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-800">{product.badge}</span> : null}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">{product.category}</span>
                    <span className="text-sm text-slate-500">★ {product.rating}</span>
                  </div>
                  <Link href={`/product/${product.slug}`} className="mt-3 block text-xl font-semibold text-slate-900 hover:text-amber-700">{product.name}</Link>
                  <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xl font-bold text-slate-900">₦ {product.price.toLocaleString()}</p>
                      {product.oldPrice ? <p className="text-sm text-slate-400 line-through">₦ {product.oldPrice.toLocaleString()}</p> : null}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">{product.stockLabel}</span>
                  </div>
                  <button onClick={() => addToCart(product)} className="mt-4 w-full rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-400">Add to cart</button>
                </div>
              </article>
            ))}
          </div>

          {visibleCount < filteredProducts.length ? (
            <div className="mt-8 text-center">
              <button onClick={() => setVisibleCount((value) => value + 4)} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Load more products
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">No results</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">No products match your filters.</h2>
          <button onClick={() => { setSearch(""); setSelectedCategory("All"); setMaxPrice(50000); }} className="mt-5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Reset filters
          </button>
        </div>
      )}
    </main>
  );
}
