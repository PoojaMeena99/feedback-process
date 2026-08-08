"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Home as HomeIcon,
  Inbox,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const primaryButton = "btn btn-primary";
const secondaryButton = "btn btn-secondary";
const fieldClass = "field-control";

async function api(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }
  return data;
}

export default function Home() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const latestRequestLoad = useRef(0);

  const currentUser = users.find((user) => user.id === currentUserId);
  const pendingForMe = requests.filter((request) => request.giverId === currentUserId);
  const sentByMe = requests.filter((request) => request.requesterId === currentUserId);
  const submittedCount = requests.filter((request) => request.status === "submitted").length;
  const tableRows = requests
    .filter((request) => request.giverId === currentUserId || request.requesterId === currentUserId)
    .map(toTableRow);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [authData, userData, templateData] = await Promise.all([api("/auth/me"), api("/users"), api("/templates")]);
        setUsers(userData.users);
        setTemplates(templateData.templates);
        setCurrentUserId(authData.user.id);
      } catch (loadError) {
        if (loadError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(loadError.message);
      } finally {
        setIsAuthLoading(false);
      }
    }
    void loadReferenceData();
  }, [router]);

  async function loadRequests(userId = currentUserId) {
    if (!userId) return;
    const loadId = latestRequestLoad.current + 1;
    latestRequestLoad.current = loadId;

    try {
      const [received, sent] = await Promise.all([
        api(`/feedback-requests/giver/${userId}`),
        api(`/feedback-requests/requester/${userId}`),
      ]);

      // When the selected user changes quickly, ignore an older response.
      if (loadId !== latestRequestLoad.current) return;

      const merged = new Map([...received.feedbackRequests, ...sent.feedbackRequests].map((request) => [request.id, request]));
      const newestFirst = [...merged.values()].sort((first, second) => {
        const dateDifference = new Date(second.createdAt) - new Date(first.createdAt);
        return dateDifference || second.id - first.id;
      });
      setRequests(newestFirst);
      setError("");
    } catch (loadError) {
      if (loadId !== latestRequestLoad.current) return;
      setError(loadError.message);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [currentUserId]);

  async function createRequest(payload) {
    try {
      await api("/feedback-requests", { method: "POST", body: JSON.stringify({ ...payload, requesterId: currentUserId }) });
      setIsCreateOpen(false);
      await loadRequests();
      return { ok: true };
    } catch (createError) {
      return { ok: false, message: createError.message };
    }
  }

  async function openRequest(requestId) {
    try {
      const detail = await api(`/feedback-requests/${requestId}`);
      const template = await api(`/templates/${detail.feedbackRequest.templateId}/questions`);
      setSelectedRequest({ ...detail.feedbackRequest, template });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitAnswers(requestId, answers) {
    await api(`/feedback-requests/${requestId}/answers`, { method: "POST", body: JSON.stringify({ giverId: currentUserId, answers }) });
    setSelectedRequest(null);
    await loadRequests();
  }

  async function performRequestAction(requestId, action, acknowledgementComment) {
    try {
      await api(`/feedback-requests/${requestId}/actions`, {
        method: "POST",
        body: JSON.stringify({ actorId: currentUserId, action, acknowledgementComment }),
      });
      await loadRequests();
      setError("");
      return true;
    } catch (actionError) {
      setError(actionError.message);
      return false;
    }
  }

  if (isAuthLoading) {
    return <main className="flex min-h-screen items-center justify-center text-lg text-muted">Loading Feedback Hub…</main>;
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-xl font-semibold text-slate-900">Feedback Hub could not load</p>
        <p className="text-base text-muted">{error || "Please sign in to continue."}</p>
        <button className={primaryButton} onClick={() => router.push("/login")}>Go to login</button>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f6f8ff] via-[#fbfcfe] to-[#eef7ff] text-ink">
      <AppHeader />

      <div className={`grid flex-1 ${isCreateOpen ? "lg:grid-cols-[260px_1fr_420px]" : "lg:grid-cols-[260px_1fr]"}`}>
        <Sidebar />

        <main className="border-x border-line/70 bg-white/45 px-5 py-7 backdrop-blur-sm sm:px-7 sm:py-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <Sparkles size={15} />
                Feedback workspace
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Feedback Hub</h1>
              <p className="mt-2 text-base text-muted">Request, share, and review thoughtful feedback in one place.</p>
            </div>
            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-white px-4 text-slate-900 shadow-sm">
              <Avatar initials={initialsForName(currentUser.name)} small />
              <span className="text-sm font-medium text-muted">Logged in as</span>
              <span className="text-base font-semibold">{currentUser.name}</span>
            </div>
          </div>

          <section className="grid gap-5 xl:grid-cols-3">
            <StatCard
              icon={<Inbox size={28} />}
              tone="blue"
              label="Waiting For Me"
              value={pendingForMe.length}
              helper="Requests where I need to give feedback"
            />
            <StatCard
              icon={<Send size={28} />}
              tone="green"
              label="Requests Sent"
              value={sentByMe.length}
              helper="Feedback requests created by me"
            />
            <StatCard
              icon={<Check size={28} />}
              tone="amber"
              label="Submitted"
              value={submittedCount}
              helper="Feedback responses submitted"
            />
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-line/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
              <h2 className="text-2xl font-bold text-[#111827]">Feedback Requests</h2>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{tableRows.length} total</span>
                <button className="inline-flex items-center gap-2 rounded-lg bg-[#252d70] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e255e]" type="button" onClick={() => setIsCreateOpen(true)}>
                  <Plus size={17} />
                  Request feedback
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-[#f8fafc] text-xs font-bold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-4">Requester</th>
                    <th className="px-4 py-4">Feedback Giver</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Due Date</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tableRows.length ? tableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f9fbff]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar initials={row.requesterInitials} />
                          <div>
                            <p className="text-base font-semibold text-[#111827]">{row.requesterName}</p>
                            <p className="mt-1 text-sm text-muted">{row.requesterEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar initials={row.giverInitials} small />
                          <span className="font-semibold">{row.giverName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-base font-medium">{row.type}</td>
                      <td className="px-4 py-5">
                        <p className="font-semibold">{row.dueDate}</p>
                      </td>
                      <td className="px-4 py-5">
                        <span className={statusClass(row.status)}>{row.status}</span>
                        {row.status === "submitted" && row.giverId === currentUserId ? (
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            Waiting for {row.requesterName} to acknowledge
                          </p>
                        ) : null}
                        {row.status === "declined" && row.requesterId === currentUserId ? (
                          <p className="mt-1 text-xs font-medium text-red-700">
                            {row.giverName} declined this feedback request
                          </p>
                        ) : null}
                        {row.status === "acknowledged" && row.giverId === currentUserId ? (
                          <p className="mt-1 text-xs font-medium text-violet-700">
                            {row.requesterName} acknowledged this feedback
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-5">
                        <RequestActions
                          row={row}
                          currentUserId={currentUserId}
                          onView={() => void openRequest(row.id)}
                          onAction={(action) => void performRequestAction(row.id, action)}
                        />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-6 py-12 text-center text-base text-muted" colSpan={6}>
                        No feedback requests yet. Create a request from the right panel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-6 py-4 text-base text-muted">
              <span>Showing 1 to {tableRows.length} of {tableRows.length} requests</span>
            </div>
          </section>
          {error ? (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}
        </main>

        {isCreateOpen ? (
          <CreateFeedbackPanel
            currentUserId={currentUserId}
            currentUser={currentUser}
            users={users}
            templates={templates}
            onCreate={createRequest}
            onClose={() => setIsCreateOpen(false)}
          />
        ) : null}
      </div>

      <AppFooter />

      {selectedRequest ? (
        <FeedbackDetail
          request={selectedRequest}
          currentUserId={currentUserId}
          onClose={() => setSelectedRequest(null)}
          onSubmit={submitAnswers}
          onAcknowledge={(requestId, acknowledgementComment) => performRequestAction(requestId, "acknowledge", acknowledgementComment)}
        />
      ) : null}
    </div>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/15 bg-[#252d70] px-5 py-3.5 shadow-lg sm:px-7">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-blue-950/30">
            <MessageCircle size={21} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">Feedback Hub</p>
            <p className="text-xs font-medium text-blue-200">Feedback Process</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-sm font-medium text-blue-100 sm:flex">
          <Bell size={18} />
          <span>Share better feedback</span>
        </div>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-5 py-5 text-sm text-slate-400 sm:px-7">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Feedback Hub. Built for clear, thoughtful feedback.</p>
        <p className="font-medium text-slate-300">Feedback Process</p>
      </div>
    </footer>
  );
}

function Sidebar() {
  return (
    <aside className="hidden border-r border-indigo-400/25 bg-[#252d70] px-4 py-8 text-slate-200 lg:flex lg:flex-col">
      <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.14em] text-indigo-200/70">Workspace</p>
      <nav className="space-y-2 text-base font-medium">
        <SidebarItem active icon={<HomeIcon size={22} />} label="Dashboard" />
        <SidebarItem icon={<Inbox size={22} />} label="Feedback Requests" />
      </nav>
    </aside>
  );
}

function SidebarItem({ active = false, icon, label }) {
  return (
    <a
      className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${
        active ? "bg-white/18 text-white shadow-lg shadow-indigo-950/20" : "text-indigo-100/75 hover:bg-white/10 hover:text-white"
      }`}
      href="#"
    >
      {icon}
      {label}
    </a>
  );
}

function StatCard({ icon, tone, label, value, helper }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-orange-50 text-orange-700",
  }[tone];

  return (
    <article className="rounded-2xl border border-line/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-6">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full ${toneClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-lg font-medium">{label}</p>
          <p className={`mt-3 text-5xl font-bold ${tone === "amber" ? "text-orange-600" : tone === "green" ? "text-green-700" : "text-blue-700"}`}>
            {value}
          </p>
        </div>
      </div>
      <p className="mt-6 text-base text-muted">{helper}</p>
    </article>
  );
}

function CreateFeedbackPanel({ currentUserId, currentUser, users, templates, onCreate, onClose }) {
  const possibleGivers = users.filter((user) => user.id !== currentUserId);
  const [giverId, setGiverId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [message, setMessage] = useState(
    "Please share feedback for my learning progress.",
  );
  const [dueDate, setDueDate] = useState("");
  const [notice, setNotice] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!possibleGivers.some((user) => user.id === Number(giverId))) {
      setGiverId(possibleGivers[0]?.id ?? "");
    }
  }, [currentUserId, giverId, possibleGivers]);

  useEffect(() => {
    if (!templates.some((template) => template.id === Number(templateId))) {
      setTemplateId(templates[0]?.id ?? "");
    }
  }, [templateId, templates]);

  async function submit(event) {
    event.preventDefault();
    if (!giverId || Number(giverId) === currentUserId) return;
    if (dueDate && dueDate < today) {
      setNotice("Due date cannot be in the past.");
      return;
    }
    const result = await onCreate({ giverId: Number(giverId), templateId: Number(templateId), message, dueDate });
    if (result.ok) {
      onClose();
      return;
    }
    setNotice(result.message);
  }

  return (
    <aside className="border-l border-line/80 bg-white px-6 py-7 shadow-[-10px_0_30px_rgba(15,23,42,0.04)] sm:px-7 sm:py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-blue-600">New request</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#111827]">Request feedback</h2>
        </div>
        <button className="rounded-lg p-2 text-muted transition hover:bg-slate-100 hover:text-ink" type="button" aria-label="Close request form" onClick={onClose}>
          ×
        </button>
      </div>

      <form className="grid gap-6" onSubmit={submit}>
        <Field label="Request sent by">
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-slate-50 px-4 text-base font-semibold text-slate-700">
            <Avatar initials={initialsForName(currentUser.name)} small />
            {currentUser.name}
          </div>
        </Field>

        <Field label="Feedback type">
          <SelectShell>
            <select className="w-full bg-transparent outline-none" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>

        <Field label="Who will give feedback?">
          <SelectShell>
            <Avatar initials={initialsForName(possibleGivers.find((user) => user.id === Number(giverId))?.name)} small />
            <select className="w-full bg-transparent outline-none" value={giverId} onChange={(event) => setGiverId(event.target.value)}>
              {possibleGivers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </SelectShell>
          <p className="text-sm font-normal text-muted">This person will receive the request and fill the feedback form.</p>
        </Field>

        <Field label="Due date">
          <input className={fieldClass} type="date" min={today} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </Field>

        <Field label="Feedback request message (optional)">
          <textarea
            className={`${fieldClass} min-h-48 resize-y leading-7`}
            value={message}
            maxLength={500}
            onChange={(event) => setMessage(event.target.value)}
          />
          <p className="text-sm font-normal text-muted">{message.length} / 500 characters</p>
        </Field>

        <button className={`${primaryButton} mt-4 w-full py-4 text-lg`} type="submit">
          <Send size={22} />
          Send Request
        </button>
        {notice ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">{notice}</p> : null}
      </form>
    </aside>
  );
}

function SelectShell({ children }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-white px-4 text-base shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-base font-medium text-[#1f2937]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function FeedbackDetail({ request, currentUserId, onClose, onSubmit, onAcknowledge }) {
  const template = request.template;
  const canSubmit = currentUserId === request.giverId && request.status === "requested";
  const canAcknowledge = currentUserId === request.requesterId && request.status === "submitted";
  const [answers, setAnswers] = useState(() => Object.fromEntries(request.answers.map((item) => [item.questionId, item.answer])));
  const [acknowledgementComment, setAcknowledgementComment] = useState("");

  async function submit(event) {
    event.preventDefault();
    await onSubmit(request.id, template.questions.map((question) => ({ questionId: question.id, answer: answers[question.id] || "" })));
  }

  async function acknowledge() {
    const wasAcknowledged = await onAcknowledge(request.id, acknowledgementComment);
    if (wasAcknowledged) onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6">
      <section className="max-h-[calc(100vh-32px)] w-full max-w-3xl overflow-auto rounded-3xl border border-white/30 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-6 py-6 sm:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm">
              <Sparkles size={14} />
              {template.templateName}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              {request.requesterName} requested feedback from {request.giverName}
            </h2>
            <p className="mt-2 text-sm text-slate-600">Share clear, kind, and actionable feedback.</p>
          </div>
        </div>

        <form className="grid gap-5 p-6 sm:p-8" onSubmit={submit}>
          {template.questions.map((question, index) => (
            <Field key={question.id} label={<span className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span><span>{question.questionText}</span></span>}>
              <textarea
                className={`${fieldClass} min-h-28 resize-y border-slate-200 bg-slate-50/70 leading-7 focus:bg-white disabled:bg-surface disabled:text-muted`}
                value={answers[question.id] ?? ""}
                disabled={!canSubmit}
                onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
                required
              />
            </Field>
          ))}
          {canAcknowledge ? (
            <Field label="Acknowledgement comment (optional)">
              <textarea
                className={`${fieldClass} min-h-24 resize-y border-violet-200 bg-violet-50/40 leading-7 focus:bg-white`}
                value={acknowledgementComment}
                maxLength={500}
                placeholder="For example: Thank you, this feedback is helpful."
                onChange={(event) => setAcknowledgementComment(event.target.value)}
              />
              <p className="text-sm font-normal text-muted">{acknowledgementComment.length} / 500 characters</p>
            </Field>
          ) : null}
          {!canSubmit && !canAcknowledge && request.acknowledgementComment ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-950">
              <p className="font-semibold">Acknowledgement comment</p>
              <p className="mt-1 whitespace-pre-wrap text-violet-800">{request.acknowledgementComment}</p>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-sm text-muted">Your feedback will be shared with {request.requesterName}.</p>
            <div className="flex flex-wrap gap-2">
            <button className={secondaryButton} type="button" onClick={onClose}>
              Close
            </button>
            {canSubmit ? (
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700" type="submit">
                <Check size={16} />
                Submit feedback
              </button>
            ) : null}
            {canAcknowledge ? (
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700" type="button" onClick={() => void acknowledge()}>
                <Check size={16} />
                Acknowledge feedback
              </button>
            ) : null}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function RequestActions({ row, currentUserId, onView, onAction }) {
  const isGiver = row.giverId === currentUserId;
  const isRequester = row.requesterId === currentUserId;
  const buttonClass = "rounded-md border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50";
  const destructiveButtonClass = "rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50";

  if (isGiver && row.status === "requested") {
    return (
      <div className="flex gap-2">
        <button className={buttonClass} type="button" onClick={onView}>Fill</button>
        <button className={destructiveButtonClass} type="button" onClick={() => onAction("decline")}>Decline</button>
      </div>
    );
  }

  if (isRequester && row.status === "requested") {
    return <button className={destructiveButtonClass} type="button" onClick={() => onAction("cancel")}>Cancel</button>;
  }

  if (isRequester && row.status === "submitted") {
    return (
      <div className="flex gap-2">
        <button className={buttonClass} type="button" onClick={onView}>View Feedback</button>
        <button className={buttonClass} type="button" onClick={() => onAction("acknowledge")}>Acknowledge</button>
      </div>
    );
  }

  if (isRequester && row.status === "acknowledged") {
    return (
      <div className="flex gap-2">
        <button className={buttonClass} type="button" onClick={onView}>View Feedback</button>
        <button className={buttonClass} type="button" onClick={() => onAction("close")}>Close</button>
      </div>
    );
  }

  return <button className={buttonClass} type="button" onClick={onView}>View</button>;
}

function Avatar({ initials, small = false }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 ${
        small ? "h-8 w-8 text-sm" : "h-12 w-12 text-base"
      }`}
    >
      {initials}
    </span>
  );
}

function statusClass(status) {
  const base = "status-pill";
  if (status === "submitted") return `${base} bg-green-100 text-green-700`;
  if (status === "acknowledged") return `${base} bg-violet-100 text-violet-700`;
  if (status === "closed") return `${base} bg-slate-200 text-slate-700`;
  if (status === "declined" || status === "cancelled") return `${base} bg-red-100 text-red-700`;
  return `${base} bg-blue-50 text-blue-700`;
}

function toTableRow(request) {
  return {
    id: request.id,
    requesterName: request.requesterName,
    requesterId: request.requesterId,
    requesterEmail: "",
    requesterInitials: initialsForName(request.requesterName),
    giverId: request.giverId,
    giverName: request.giverName,
    giverInitials: initialsForName(request.giverName),
    type: request.templateName,
    dueDate: formatDueDate(request.dueDate),
    status: request.status,
  };
}

function initialsForName(name = "?") {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatDueDate(dueDate) {
  if (!dueDate) return "No due date";

  const [year, month, day] = dueDate.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "No due date";
}
