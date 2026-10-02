"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient, hasSupabaseConfiguration } from "@/lib/supabase";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  customer_name: string;
  total_amount: number;
  payment_status?: string;
  order_items: OrderItem[];
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        if (!hasSupabaseConfiguration()) {
          setError("Supabase is not configured yet. Add the project URL and anon key to your environment to enable login and order history.");
          setLoading(false);
          return;
        }

        const client = createBrowserSupabaseClient();
        const { data: sessionData, error: sessionError } = await client.auth.getSession();

        if (sessionError || !sessionData.session) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load your orders.");
        }

        setOrders(payload.orders ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [router]);

  async function handleLogout() {
    try {
      if (!hasSupabaseConfiguration()) {
        router.push("/");
        return;
      }

      const client = createBrowserSupabaseClient();
      await client.auth.signOut();
      router.push("/");
    } catch {
      router.push("/");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Order history</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">My Orders</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/products" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Continue shopping</Link>
          <button onClick={handleLogout} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Logout</button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">Loading your orders...</div>
      ) : error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>
      ) : !orders.length ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
          You do not have any saved orders yet. Start with a few essentials from the shop.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Order reference</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{order.order_number}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">{order.status}</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">{order.payment_status ?? "paid"}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Placed</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{new Date(order.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Customer</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">₦ {Number(order.total_amount).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.order_items ?? []).map((item: OrderItem) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-slate-700">{item.product_name}</td>
                        <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">₦ {Number(item.total_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
