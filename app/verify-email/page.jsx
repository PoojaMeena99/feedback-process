"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] p-6">Loading…</main>}><VerificationContent /></Suspense>;
}

function VerificationContent() {
  const token = useSearchParams().get("token");
  const [message, setMessage] = useState("Verifying your email…");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (!token) { setMessage("This verification link is missing its token."); return; }
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message); setSuccess(true); setMessage(data.message); })
      .catch((error) => setMessage(error.message || "We could not verify this email."));
  }, [token]);
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] p-6"><section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-bold text-slate-950">Email verification</h1><p className={`mt-4 ${success ? "text-emerald-700" : "text-slate-600"}`}>{message}</p><Link className="mt-7 inline-block rounded-xl bg-[#252d70] px-5 py-3 font-semibold text-white" href="/login">Go to login</Link></section></main>;
}
