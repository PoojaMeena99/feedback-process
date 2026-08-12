"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  MessageCircle,
} from "lucide-react";


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
        "/api/auth/register",
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
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] px-4 py-8 text-slate-950 sm:px-8">
      <div className="w-full max-w-lg">
        <Link className="mx-auto mb-8 flex w-fit items-center gap-3" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#252d70] text-white shadow-md">
            <MessageCircle aria-hidden="true" size={21} />
          </span>
          <span>
            <span className="block text-lg font-bold text-[#252d70]">Feedback Hub</span>
            <span className="block text-xs text-slate-500">Feedback Process</span>
          </span>
        </Link>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(37,45,112,0.12)] sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4c57a7]">Get started</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-3 text-base text-slate-600">Enter your details to continue.</p>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <AuthField autoComplete="name" id="name" label="Full name" onChange={updateField} placeholder="Enter your full name" type="text" value={form.name} />
            <AuthField autoComplete="email" id="email" label="Email address" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
            <AuthField autoComplete="new-password" id="password" label="Password" onChange={updateField} placeholder="Minimum 8 characters" type="password" value={form.password} />
            <AuthField autoComplete="new-password" id="confirmPassword" label="Confirm password" onChange={updateField} placeholder="Enter password again" type="password" value={form.confirmPassword} />

            {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p> : null}

            <button className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#252d70] px-5 text-base font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating account…" : "Create Account"}
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account? <Link className="font-semibold text-[#36429a] hover:underline" href="/login">Log in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function AuthField({ autoComplete, id, label, onChange, placeholder, type, value }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-slate-800" htmlFor={id}>{label}</label>
      <div className="relative">
      <input
        autoComplete={autoComplete}
        className={`min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-[#4c57a7] focus:ring-4 focus:ring-indigo-100 ${isPassword ? "pr-12" : ""}`}
        id={id}
        name={id}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={isPassword && showPassword ? "text" : type}
        value={value}
      />
      {isPassword ? (
        <button
          aria-label={`${showPassword ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-controls={id}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#252d70] focus:outline-none focus:ring-2 focus:ring-indigo-200"
          onClick={() => setShowPassword((current) => !current)}
          type="button"
        >
          {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
        </button>
      ) : null}
      </div>
    </div>
  );
}
