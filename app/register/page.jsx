"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const benefits = [
  "Request feedback from the right person",
  "Keep every response in one place",
  "Track requests from start to completion",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create account");

      router.push("/login");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7ff] text-slate-950 lg:grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#252d70] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

        <Link className="relative flex w-fit items-center gap-3" href="/">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-400 shadow-lg shadow-blue-950/30">
            <MessageCircle aria-hidden="true" size={24} />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">Feedback Hub</span>
            <span className="block text-sm text-blue-200">Feedback Process</span>
          </span>
        </Link>

        <div className="relative max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-blue-100">
            <Sparkles aria-hidden="true" size={16} />
            Grow through meaningful feedback
          </div>
          <h1 className="max-w-lg text-4xl font-bold tracking-tight xl:text-5xl">
            Better conversations begin with better feedback.
          </h1>
          <p className="mt-5 max-w-lg text-base text-blue-100 xl:text-lg">
            Create your account to request, share, and revisit thoughtful feedback with your team.
          </p>
          <ul className="mt-8 grid gap-4">
            {benefits.map((benefit) => (
              <li className="flex items-center gap-3 text-blue-50" key={benefit}>
                <CheckCircle2 aria-hidden="true" className="shrink-0 text-sky-300" size={20} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-blue-200">
          Private by design. Your feedback stays with the people you choose.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-xl">
          <Link className="mb-8 flex w-fit items-center gap-3 lg:hidden" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#252d70] text-white shadow-md">
              <MessageCircle aria-hidden="true" size={21} />
            </span>
            <span className="text-lg font-bold text-[#252d70]">Feedback Hub</span>
          </Link>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(37,45,112,0.12)] sm:p-9 xl:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4c57a7]">Get started</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Create your account</h2>
            <p className="mt-3 text-base text-slate-600">Enter your details to join your feedback workspace.</p>

            <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
              <AuthField autoComplete="name" id="name" label="Full name" onChange={updateField} placeholder="Enter your full name" type="text" value={form.name} />
              <AuthField autoComplete="email" id="email" label="Email address" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
              <div className="grid gap-5 sm:grid-cols-2">
                <AuthField autoComplete="new-password" id="password" label="Password" onChange={updateField} placeholder="Minimum 8 characters" type="password" value={form.password} />
                <AuthField autoComplete="new-password" id="confirmPassword" label="Confirm password" onChange={updateField} placeholder="Enter it again" type="password" value={form.confirmPassword} />
              </div>

              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p> : null}

              <p className="flex items-start gap-2 text-sm text-slate-500">
                <LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0 text-[#4c57a7]" size={16} />
                Use at least 8 characters. Your password will be securely protected.
              </p>

              <button className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#252d70] px-5 text-base font-semibold text-white shadow-lg shadow-indigo-950/15 transition hover:bg-[#1e255e] focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating account…" : "Create Account"}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link className="font-semibold text-[#36429a] hover:underline" href="/login">Log in</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthField({ autoComplete, id, label, onChange, placeholder, type, value }) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        autoComplete={autoComplete}
        className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-[#4c57a7] focus:ring-4 focus:ring-indigo-100"
        id={id}
        name={id}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  );
}
