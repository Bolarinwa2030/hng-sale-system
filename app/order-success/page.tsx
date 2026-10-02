"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") ?? "MKT-000000";
  const customerName = searchParams.get("customerName") ?? "Customer";

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-slate-900 sm:px-6">
      <div className="rounded-[32px] border border-emerald-200 bg-white p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] md:p-12">
        <div className="flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Order confirmed</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Thank you, {customerName}.</h1>
          <p className="mt-4 text-lg text-slate-600">Your order has been placed successfully.</p>
        </div>

        <div className="mt-8 grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Order number</p>
            <p className="mt-2 text-lg font-bold text-slate-800">{orderNumber}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment status</p>
            <p className="mt-2 text-lg font-bold text-emerald-700">Paid</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
            <p className="mt-2 text-lg font-bold text-slate-800">Processing</p>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-5 text-slate-600">
          A confirmation email has been sent to your inbox with the details of your order. You can also track it from your order history.
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/orders" className="rounded-full bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">
            View order
          </Link>
          <Link href="/products" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-4 py-12 text-slate-900 sm:px-6"><div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm md:p-12">Loading order details...</div></main>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
