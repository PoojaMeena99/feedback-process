"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LockKeyhole, MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function ResetForm() {
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

function PasswordField({ id, label, onChange, value }) { return <label className="grid gap-2" htmlFor={id}><span className="text-sm font-semibold text-slate-800">{label}</span><span className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input autoComplete="new-password" className="min-h-12 w-full rounded-xl border border-slate-300 px-4 pl-11 outline-none focus:border-[#4c57a7] focus:ring-4 focus:ring-indigo-100" id={id} name={id} onChange={onChange} placeholder="Minimum 8 characters" required type="password" value={value} /></span></label>; }

export default function ResetPasswordPage() { return <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] px-4 py-8 text-slate-950"><div className="w-full max-w-md"><Link className="mx-auto mb-8 flex w-fit items-center gap-3" href="/login"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#252d70] text-white"><MessageCircle size={21} /></span><span><b className="block text-lg text-[#252d70]">Feedback Hub</b><small className="text-slate-500">Feedback Process</small></span></Link><Suspense fallback={<p className="text-center">Loading reset form…</p>}><ResetForm /></Suspense></div></main>; }
