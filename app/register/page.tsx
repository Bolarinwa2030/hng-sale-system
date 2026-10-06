"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient, getRedirectToUrl, hasSupabaseConfiguration } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  function handleChange(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Registration failed.");
      }

      if (data.session) {
        const client = createBrowserSupabaseClient();
        const { error: sessionError } = await client.auth.setSession(data.session);
        if (sessionError) throw sessionError;
        router.push("/");
      } else {
        setSuccess("Account created. Check your email to confirm your account, then sign in.");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
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
                <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Create account</p>
                <h2 className="mt-2 text-4xl font-bold leading-tight">Start shopping with a faster checkout.</h2>
              </div>
              <p className="max-w-md text-base text-slate-300">
                Register to save your order history, track purchases, and enjoy a smoother shopping experience on future visits.
              </p>
              <ul className="space-y-3 text-sm text-slate-200">
                <li>• Save your cart and order history</li>
                <li>• Faster repeat checkout</li>
                <li>• Personalized shopping experience</li>
              </ul>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Account</p>
                <h3 className="mt-2 text-3xl font-bold">Register</h3>
              </div>
              <Link href="/" className="text-sm font-medium text-amber-600 hover:text-amber-500">Back to home</Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={(event) => handleChange("firstName", event.target.value)}
                    placeholder="First name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={(event) => handleChange("lastName", event.target.value)}
                    placeholder="Last name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  placeholder="Create a strong password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-amber-500 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

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
              {loading ? "Redirecting..." : "Sign up with Google"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account? <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-500">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
