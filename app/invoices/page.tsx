"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAuthHeaders } from "@/lib/client-auth";

type Invoice = {
  id: string;
  invoiceNumber: string;
  total: number;
  dueDate: string | null;
  status: string;
  customer: { name: string };
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvoices() {
      try {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/invoices", {
          headers,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? "Unable to load invoices.");
        }

        setInvoices(data.invoices ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load invoices.");
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Finance</p>
            <h1 className="mt-2 text-3xl font-bold">Invoices</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back to dashboard
            </Link>
            <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
              Create invoice
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading invoices...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{invoice.customer.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">₦ {Number(invoice.total).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          invoice.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : invoice.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : invoice.status === "OVERDUE"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {invoice.status}
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
