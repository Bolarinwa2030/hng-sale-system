"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { categories, type ShopProduct } from "@/lib/shop-data";
import { createBrowserSupabaseClient, getAuthRedirectUrl, hasSupabaseConfiguration } from "@/lib/supabase";

const CART_KEY = "mariam-market-cart";

function addToCart(product: { id: string; name: string; price: number; image: string }) {
  if (typeof window === "undefined") {
    return;
  }

  const current = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as Array<{ id: string; name: string; price: number; quantity: number; image: string }>;
  const itemIndex = current.findIndex((item) => item.id === product.id);

  if (itemIndex >= 0) {
    current[itemIndex].quantity += 1;
  } else {
    current.push({ ...product, quantity: 1 });
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(current));
}

function getCartCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) {
      return 0;
    }

    const items = JSON.parse(raw) as Array<{ quantity?: number }>;
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  } catch {
    return 0;
  }
}

export default function HomePage() {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [message, setMessage] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    async function syncSession() {
      try {
        if (!hasSupabaseConfiguration()) {
          setCartCount(getCartCount());
          return;
        }

        const client = createBrowserSupabaseClient();
        const { data } = await client.auth.getSession();
        setUserEmail(data.session?.user?.email ?? "");
        setCartCount(getCartCount());
      } catch {
        setUserEmail("");
        setCartCount(getCartCount());
      }
    }

    syncSession();

    fetch("/api/products")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message ?? "Unable to load products.");
        }
        setFeaturedProducts((result.products as ShopProduct[]).slice(0, 4));
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Unable to load products.");
      });
  }, []);

  async function handleGoogleSignIn() {
    try {
      if (!hasSupabaseConfiguration()) {
        setMessage("Google sign-in is not configured yet. Add Supabase + Google OAuth values in your environment first.");
        return;
      }

      setLoading(true);
      const client = createBrowserSupabaseClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      if (!hasSupabaseConfiguration()) {
        setUserEmail("");
        return;
      }

      const client = createBrowserSupabaseClient();
      await client.auth.signOut();
      setUserEmail("");
    } catch {
      setUserEmail("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 text-lg font-black text-white shadow-sm">M</div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-amber-600">Mariam Market</p>
                <h1 className="text-lg font-bold text-slate-900">Fresh essentials</h1>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
              <Link href="/" className="text-slate-900">Home</Link>
              <Link href="/products" className="hover:text-slate-900">Shop</Link>
              <Link href="/products?category=rice-and-grains" className="hover:text-slate-900">Rice</Link>
              <Link href="/products?category=household-care" className="hover:text-slate-900">Household</Link>
              <Link href="/orders" className="hover:text-slate-900">Orders</Link>
            </nav>

            <div className="hidden flex-1 items-center justify-center px-4 lg:flex">
              <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5">
                <span className="text-sm text-slate-400">⌕</span>
                <input type="text" placeholder="Search products" className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userEmail ? (
                <>
                  <Link href="/orders" className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:inline-flex">My orders</Link>
                  <button onClick={handleLogout} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400">Login</Link>
                  <Link href="/register" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Register</Link>
                </>
              )}
              <Link href="/cart" className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 hover:bg-slate-50">
                🛒
                {cartCount > 0 ? <span className="absolute -right-1.5 -top-1 min-w-[1.1rem] rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{cartCount}</span> : null}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="flex flex-col justify-center rounded-[28px] bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 p-6 text-white shadow-sm md:p-8">
              <p className="text-xs uppercase tracking-[0.32em] text-amber-50">Trusted local shop</p>
              <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight md:text-5xl">Fresh groceries and home essentials, delivered fast.</h2>
              <p className="mt-4 max-w-lg text-base text-amber-50/95">
                Shop premium rice, cooking staples, toiletries, and family favorites with dependable local delivery and great value.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/products" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-amber-700 shadow-sm hover:bg-amber-50">
                  Shop now
                </Link>
                <button onClick={handleGoogleSignIn} className="rounded-full border border-white/60 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  {loading ? "Redirecting..." : "Sign in with Google"}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-amber-50">
                <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2">
                  <span className="block text-xl font-bold text-white">4.9/5</span>
                  <span>Customer rating</span>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2">
                  <span className="block text-xl font-bold text-white">1.2k+</span>
                  <span>Orders delivered</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="relative h-[260px] overflow-hidden rounded-[28px] bg-slate-100 sm:h-[320px] lg:h-[420px]">
                <Image src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" alt="Market ingredients" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
              </div>

              <div className="rounded-[28px] bg-slate-900 p-5 text-white">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-300">Why shoppers choose us</p>
                <div className="mt-5 space-y-4 text-sm text-slate-200">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <span className="block text-2xl font-bold text-white">Same-day</span>
                    <span>Fast delivery in selected areas</span>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <span className="block text-2xl font-bold text-white">Daily value</span>
                    <span>Smart prices on weekly essentials</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Browse by category</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">Shop by department</h3>
            </div>
            <Link href="/products" className="text-sm font-semibold text-amber-600 hover:text-amber-500">View all</Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.slug} href={`/products?category=${category.slug}`} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-700">{category.name.charAt(0)}</div>
                <h4 className="text-xl font-semibold text-slate-900">{category.name}</h4>
                <p className="mt-2 text-sm text-slate-600">Handpicked essentials for everyday family life.</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Featured products</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">Popular picks</h3>
            </div>
            {userEmail ? <p className="text-sm text-slate-600">Signed in as {userEmail}</p> : null}
          </div>

          {message ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div> : null}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
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
                    <button onClick={() => {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                      });
                      setCartCount(getCartCount());
                      setMessage(`${product.name} added to cart.`);
                    }} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400">Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] bg-slate-900 p-8 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">This week only</p>
              <h3 className="mt-3 text-3xl font-bold">Bulk home essentials at better value.</h3>
              <p className="mt-3 max-w-md text-slate-300">Stock up on rice, oil, and household staples to keep your home running smoothly.</p>
              <Link href="/products" className="mt-6 inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-400">Explore deals</Link>
            </div>
            <div className="relative h-[220px] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm md:h-[280px] lg:h-full">
              <Image src="https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80" alt="Fresh groceries" fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Best sellers</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">Everything your home needs</h3>
            </div>
            <Link href="/products" className="text-sm font-semibold text-amber-600 hover:text-amber-500">See more</Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.slice(0, 4).map((product) => (
              <article key={product.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative h-52 overflow-hidden rounded-[18px] bg-slate-100">
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
                  <Link href={`/product/${product.slug}`} className="mt-2 block text-lg font-semibold text-slate-900 hover:text-amber-700">{product.name}</Link>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-slate-900">₦ {product.price.toLocaleString()}</p>
                      {product.oldPrice ? <p className="text-sm text-slate-400 line-through">₦ {product.oldPrice.toLocaleString()}</p> : null}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{product.stockLabel}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-base font-black text-white">M</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Mariam Market</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Essentials</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">Your neighborhood source for pantry staples, home essentials, and trusted daily essentials.</p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Shop</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link href="/products" className="hover:text-slate-900">All products</Link></li>
              <li><Link href="/products?category=rice-and-grains" className="hover:text-slate-900">Rice & grains</Link></li>
              <li><Link href="/products?category=kitchen-staples" className="hover:text-slate-900">Kitchen staples</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Customer care</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link href="/login" className="hover:text-slate-900">Login</Link></li>
              <li><Link href="/orders" className="hover:text-slate-900">Order tracking</Link></li>
              <li><Link href="/cart" className="hover:text-slate-900">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>hello@mariammarket.ng</li>
              <li>+234 (0) 800 123 4567</li>
              <li>24/7 support</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
