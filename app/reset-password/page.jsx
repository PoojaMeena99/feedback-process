"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, LockKeyhole, MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault(); setError(""); setMessage("");
    if (!token) return setError("Reset token is missing. Please use the complete reset link.");
    if (form.newPassword.length < 8) return setError("Password must contain at least 8 characters.");
    if (form.newPassword !== form.confirmPassword) return setError("Password and confirm password must match.");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword: form.newPassword }) });
      if (!(response.headers.get("content-type") || "").includes("application/json")) throw new Error("Backend is not reachable. Please check that the backend is running.");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not reset password");
      setMessage(data.message); setForm({ newPassword: "", confirmPassword: "" });
      router.replace("/login");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(37,45,112,0.12)] sm:p-9">
    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4c57a7]">Choose a new password</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight">Create new password</h1>
    <p className="mt-3 text-base text-slate-600">Use at least 8 characters, then log in with your new password.</p>
    <form className="mt-8 grid gap-5" onSubmit={submit}>
      <PasswordField id="newPassword" label="New password" onChange={update} value={form.newPassword} />
      <PasswordField id="confirmPassword" label="Confirm new password" onChange={update} value={form.confirmPassword} />
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{message}</p>}
      <button className="min-h-12 rounded-xl bg-[#252d70] px-5 font-semibold text-white disabled:opacity-60" disabled={loading || Boolean(message)} type="submit">{loading ? "Saving new password…" : "Save new password"}</button>
    </form>
    <p className="mt-7 text-center text-sm text-slate-600">{message ? "Password updated. " : "Remember your password? "}<Link className="font-semibold text-[#36429a] hover:underline" href="/login">Log in</Link></p>
  </section>;
}

function PasswordField({ id, label, onChange, value }) {
  const [showPassword, setShowPassword] = useState(false);

  return <div className="grid gap-2">
    <label className="text-sm font-semibold text-slate-800" htmlFor={id}>{label}</label>
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
      <input autoComplete="new-password" className="min-h-12 w-full rounded-xl border border-slate-300 px-4 pl-11 pr-12 outline-none focus:border-[#4c57a7] focus:ring-4 focus:ring-indigo-100" id={id} name={id} onChange={onChange} placeholder="Minimum 8 characters" required type={showPassword ? "text" : "password"} value={value} />
      <button
        aria-label={`${showPassword ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-controls={id}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#252d70] focus:outline-none focus:ring-2 focus:ring-indigo-200"
        onClick={() => setShowPassword((current) => !current)}
        type="button"
      >
        {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
      </button>
    </div>
  </div>;
}

export default function ResetPasswordPage() { return <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] px-4 py-8 text-slate-950"><div className="w-full max-w-md"><Link className="mx-auto mb-8 flex w-fit items-center gap-3" href="/login"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#252d70] text-white"><MessageCircle size={21} /></span><span><b className="block text-lg text-[#252d70]">Feedback Process</b></span></Link><Suspense fallback={<p className="text-center">Loading reset form…</p>}><ResetForm /></Suspense></div></main>; }
