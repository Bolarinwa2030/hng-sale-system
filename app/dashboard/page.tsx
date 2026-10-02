"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAuthHeaders } from "@/lib/client-auth";
import { createBrowserSupabaseClient, hasSupabaseConfiguration } from "@/lib/supabase";

type DashboardSummary = {
  totalSales: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalPayments: number;
  lowStockCount: number;
};

const modules = [
  "Dashboard",
  "Customers",
  "Products",
  "Orders",
  "Invoices",
  "Payments",
  "Inventory",
  "Reports",
];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/reports", {
          headers,
        });

        if (!response.ok) {
          throw new Error("Unable to load summary.");
        }

        const data = await response.json();
        setSummary(data.summary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load summary.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [router]);

  async function handleLogout() {
    try {
      if (hasSupabaseConfiguration()) {
        const { error: signOutError } = await createBrowserSupabaseClient().auth.signOut();
        if (signOutError) throw signOutError;
      }
      router.push("/");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to sign out.");
    }
  }

  const stats = summary
    ? [
        { label: "Total sales", value: `₦ ${summary.totalSales.toLocaleString()}`, change: "+12.4%", tone: "emerald" },
        { label: "Paid invoices", value: String(summary.paidInvoices), change: "+8.1%", tone: "sky" },
        { label: "Overdue invoices", value: String(summary.overdueInvoices), change: "-4.2%", tone: "amber" },
        { label: "Low stock", value: `${summary.lowStockCount} items`, change: "needs review", tone: "rose" },
      ]
    : [
        { label: "Total sales", value: "—", change: "—", tone: "emerald" },
        { label: "Paid invoices", value: "—", change: "—", tone: "sky" },
        { label: "Overdue invoices", value: "—", change: "—", tone: "amber" },
        { label: "Low stock", value: "—", change: "—", tone: "rose" },
      ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 bg-slate-950 px-5 py-8 text-slate-200">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-bold text-slate-950">
              S
            </div>
            <div>
              <p className="text-lg font-semibold text-white">SalesFlow</p>
              <p className="text-xs text-slate-400">Operations Suite</p>
            </div>
          </div>

          <nav className="space-y-2">
            {modules.map((item, index) => (
              <Link
                key={item}
                href={index === 0 ? "/dashboard" : "/dashboard"}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                  index === 0
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{item}</span>
                <span className="text-xs text-slate-400">{index + 1}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">System status</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">Paystack sync</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                Healthy
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-300">Inventory alerts</span>
              <span className="rounded-full bg-orange-500/15 px-2 py-1 text-xs font-medium text-orange-300">
                {summary ? `${summary.lowStockCount} urgent` : "Checking"}
              </span>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Business overview</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                This month
              </div>
              <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500">
                New sale
              </button>
              <button onClick={handleLogout} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Logout
              </button>
            </div>
          </header>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              Loading business metrics...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
              {error}
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      stat.tone === "emerald"
                        ? "bg-emerald-100 text-emerald-700"
                        : stat.tone === "sky"
                          ? "bg-sky-100 text-sky-700"
                          : stat.tone === "amber"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
