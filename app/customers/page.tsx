"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAuthHeaders } from "@/lib/client-auth";

type Customer = {
  id: string;
  name: string;
  customerCode: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  companyName: string | null;
  status: string;
  ordersCount: number;
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/customers", {
          headers,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? "Unable to load customers.");
        }

        setCustomers(data.customers ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Customer management</p>
            <h1 className="mt-2 text-3xl font-bold">Customers</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back to dashboard
            </Link>
            <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
              Add customer
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading customers...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{customer.name}</div>
                      <div className="text-xs text-slate-500">{customer.customerCode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{customer.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.phone ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{customer.ordersCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          customer.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : customer.status === "PRIORITY"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
