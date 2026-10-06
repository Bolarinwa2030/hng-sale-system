"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient, getRedirectToUrl, hasSupabaseConfiguration } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Unable to sign in.");
      }

      const client = createBrowserSupabaseClient();
      const { error: sessionError } = await client.auth.setSession(result.session);
      if (sessionError) throw sessionError;
      router.push("/dashboard");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      if (!hasSupabaseConfiguration()) {
        setError("Google sign-in is not configured yet. Add your Supabase project and Google OAuth values to the environment first.");
        return;
      }

      setLoading(true);
      const client = createBrowserSupabaseClient();
      const { error: signInError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectToUrl(),
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Google sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid md:grid-cols-2">
          <div className="bg-slate-900 p-8 text-white md:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 font-black text-slate-900">M</div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Mariam Market</p>
                <h1 className="mt-1 text-xl font-bold">Fresh essentials</h1>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Welcome back</p>
                <h2 className="mt-2 text-4xl font-bold leading-tight">Shop smarter, faster, and with more confidence.</h2>
              </div>
              <p className="max-w-md text-base text-slate-300">
                Sign in to keep track of your orders, manage your cart, and pick up exactly where you left off.
              </p>
              <ul className="space-y-3 text-sm text-slate-200">
                <li>• Save your order history</li>
                <li>• Faster checkout on future purchases</li>
                <li>• Personalized customer experience</li>
              </ul>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Account</p>
                <h3 className="mt-2 text-3xl font-bold">Sign in</h3>
              </div>
              <Link href="/" className="text-sm font-medium text-amber-600 hover:text-amber-500">Back to home</Link>
            </div>

            <form onSubmit={handlePasswordSignIn} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  Remember me
                </label>
                <Link href="/" className="font-medium text-amber-600 hover:text-amber-500">Forgot password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] uppercase tracking-[0.28em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">G</span>
              {loading ? "Redirecting..." : "Sign in with Google"}
            </button>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Your shopping history and order tracking are tied to your authenticated account once Supabase Auth is configured.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
