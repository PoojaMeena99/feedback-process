"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Ban,
  Check,
  Home as HomeIcon,
  Inbox,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const primaryButton = "btn btn-primary";
const secondaryButton = "btn btn-secondary";
const fieldClass = "field-control";

async function apiRequest(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "API request failed");
  }

  return data;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Home() {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = users.find((user) => user.id === Number(currentUserId)) ?? users[0];
  const pendingForMe = requests.filter(
    (request) => request.giverId === currentUser?.id && request.status === "requested",
  );
  const sentByMe = requests.filter((request) => request.requesterId === currentUser?.id);
  const submittedCount = requests.filter(
    (request) =>
      ["submitted", "acknowledged", "closed"].includes(request.status) &&
      (request.giverId === currentUser?.id || request.requesterId === currentUser?.id),
  ).length;

  const tableRows = useMemo(
    () =>
      requests
        .filter(
          (request) =>
            request.giverId === currentUser?.id ||
            request.requesterId === currentUser?.id,
        )
        .map(toTableRow),
    [requests, currentUser],
  );

  async function loadDashboard(userId = currentUserId) {
    if (!userId) return;
    setError("");
    const [received, sent] = await Promise.all([
      apiRequest(`/feedback-requests/giver/${userId}`),
      apiRequest(`/feedback-requests/requester/${userId}`),
    ]);

    const mergedRequests = [
      ...received.feedbackRequests,
      ...sent.feedbackRequests,
    ].filter(
      (request, index, allRequests) =>
        allRequests.findIndex((item) => item.id === request.id) === index,
    );

    setRequests(mergedRequests);
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [usersResponse, templatesResponse] = await Promise.all([
          apiRequest("/users"),
          apiRequest("/templates"),
        ]);
        const loadedUsers = usersResponse.users ?? [];
        setUsers(loadedUsers);
        setTemplates(templatesResponse.templates ?? []);

        if (loadedUsers[0]) {
          setCurrentUserId(String(loadedUsers[0].id));
          await loadDashboard(loadedUsers[0].id);
        }
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadDashboard(currentUserId).catch((apiError) => setError(apiError.message));
    }
  }, [currentUserId]);

  async function createRequest(payload) {
    setError("");
    try {
      await apiRequest("/feedback-requests", {
        method: "POST",
        body: JSON.stringify({
          requesterId: Number(currentUserId),
          giverId: Number(payload.giverId),
          templateId: Number(payload.templateId),
          dueDate: payload.dueDate || null,
          message: payload.message,
        }),
      });
      await loadDashboard(currentUserId);
      return { ok: true };
    } catch (apiError) {
      setError(apiError.message);
      return { ok: false, message: apiError.message };
    }
  }

  async function openRequest(requestId) {
    setError("");
    try {
      const response = await apiRequest(`/feedback-requests/${requestId}`);
      setSelectedRequest(response.feedbackRequest);
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function submitAnswers(requestId, answers) {
    setError("");
    await apiRequest(`/feedback-requests/${requestId}/answers`, {
      method: "POST",
      body: JSON.stringify({
        giverId: Number(currentUserId),
        answers,
      }),
    });
    setSelectedRequest(null);
    await loadDashboard(currentUserId);
  }

  async function runRequestAction(requestId, action) {
    setError("");
    await apiRequest(`/feedback-requests/${requestId}/${action}`, {
      method: "PATCH",
      body: JSON.stringify({
        actorId: Number(currentUserId),
      }),
    });
    setSelectedRequest(null);
    await loadDashboard(currentUserId);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f6f8ff] via-[#fbfcfe] to-[#eef7ff] text-ink">
      <AppHeader />

      <div className="grid flex-1 lg:grid-cols-[260px_1fr_420px]">
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
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-white px-4 text-slate-900 shadow-sm">
              <Avatar initials={getInitials(currentUser?.name)} small />
              <span className="text-sm font-medium text-muted">Viewing as</span>
              <select
                className="bg-transparent text-base font-semibold outline-none"
                value={currentUserId}
                onChange={(event) => setCurrentUserId(event.target.value)}
                aria-label="Choose current user"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-700">
              {error}
            </div>
          ) : null}

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
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-2xl font-bold text-[#111827]">Feedback Requests</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{tableRows.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-[#f8fafc] text-xs font-bold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-4">Requester</th>
                    <th className="px-4 py-4">Feedback Giver</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Due Date</th>
                    <th className="px-4 py-4">Created</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {isLoading ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-base text-muted" colSpan={6}>
                        Loading feedback data...
                      </td>
                    </tr>
                  ) : tableRows.length ? tableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f9fbff]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar initials={row.requesterInitials} />
                          <div>
                            <p className="text-base font-semibold text-[#111827]">{row.requesterName}</p>
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
                        <p className="font-semibold">{row.createdAt}</p>
                      </td>
                      <td className="px-4 py-5">
                        <span className={statusClass(row.status)}>{row.status}</span>
                      </td>
                      <td className="px-4 py-5">
                        <button
                          className="rounded-lg border border-blue-200 px-5 py-2 text-base font-semibold text-blue-700 transition hover:bg-blue-50"
                          type="button"
                          onClick={() => openRequest(row.id)}
                        >
                          {row.giverId === currentUser?.id && row.status === "requested" ? "Fill" : "View"}
                        </button>
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
              <span>Showing {tableRows.length} requests</span>
            </div>
          </section>
        </main>

        <CreateFeedbackPanel
          currentUserId={currentUser?.id}
          users={users}
          templates={templates}
          onCreate={createRequest}
        />
      </div>

      <AppFooter />

      {selectedRequest ? (
        <FeedbackDetail
          request={selectedRequest}
          currentUserId={currentUser?.id}
          onClose={() => setSelectedRequest(null)}
          onSubmit={submitAnswers}
          onAction={runRequestAction}
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
        <p className="font-medium text-slate-300">Feedback Process Prototype</p>
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

function CreateFeedbackPanel({ currentUserId, users, templates, onCreate }) {
  const possibleGivers = users.filter((user) => user.id !== currentUserId);
  const [giverId, setGiverId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState(
    "Please share feedback for my learning progress.",
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!possibleGivers.some((user) => user.id === Number(giverId))) {
      setGiverId(String(possibleGivers[0]?.id ?? ""));
    }
  }, [currentUserId, giverId, possibleGivers]);

  useEffect(() => {
    if (!templates.some((template) => template.id === Number(templateId))) {
      setTemplateId(String(templates[0]?.id ?? ""));
    }
  }, [templateId, templates]);

  async function submit(event) {
    event.preventDefault();
    if (!giverId || Number(giverId) === currentUserId || !templateId) return;
    const result = await onCreate({ giverId, templateId, dueDate, message });
    setNotice(result.ok ? "Request saved in database." : result.message);
  }

  return (
    <aside className="border-l border-line/80 bg-white px-6 py-7 shadow-[-10px_0_30px_rgba(15,23,42,0.04)] sm:px-7 sm:py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-blue-600">New request</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#111827]">Ask for feedback</h2>
        </div>
        <button className="rounded-lg p-2 text-muted transition hover:bg-slate-100 hover:text-ink" type="button" aria-label="Close">
          <X size={26} />
        </button>
      </div>

      <form className="grid gap-6" onSubmit={submit}>
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

        <Field label="Feedback receiver">
          <SelectShell>
            <Avatar initials={getInitials(possibleGivers.find((user) => user.id === Number(giverId))?.name)} small />
            <select className="w-full bg-transparent outline-none" value={giverId} onChange={(event) => setGiverId(event.target.value)}>
              {possibleGivers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>

        <Field label="Due date (optional)">
          <input
            className={fieldClass}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
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

        <button className={`${primaryButton} mt-4 w-full py-4 text-lg shadow-lg shadow-blue-100`} type="submit">
          <Send size={22} />
          Send Request
        </button>
        {notice ? <p className="text-center text-base font-medium text-blue-700">{notice}</p> : null}
      </form>
    </aside>
  );
}

function SelectShell({ children }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white px-4 text-base shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
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

function FeedbackDetail({ request, currentUserId, onClose, onSubmit, onAction }) {
  const canSubmit = currentUserId === request.giverId && request.status === "requested";
  const canDecline = currentUserId === request.giverId && request.status === "requested";
  const canCancel = currentUserId === request.requesterId && request.status === "requested";
  const canAcknowledge = currentUserId === request.requesterId && request.status === "submitted";
  const canClose = currentUserId === request.requesterId && request.status === "acknowledged";
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const response = await apiRequest(`/templates/${request.templateId}/questions`);
        setQuestions(response.questions ?? []);
      } catch (apiError) {
        setError(apiError.message);
      }
    }

    loadQuestions();
  }, [request.templateId]);

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      await onSubmit(
        request.id,
        questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? "",
        })),
      );
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function runAction(action) {
    setError("");

    try {
      await onAction(request.id, action);
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6">
      <section className="max-h-[calc(100vh-32px)] w-full max-w-3xl overflow-auto rounded-3xl border border-white/30 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-6 py-6 sm:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm">
              <Sparkles size={14} />
              {request.templateName}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              {request.requesterName} requested feedback from {request.giverName}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Status: <span className="font-semibold capitalize">{request.status}</span>
              {request.dueDate ? ` • Due ${formatDate(request.dueDate)}` : ""}
            </p>
          </div>
          <button className={secondaryButton} type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="grid gap-5 p-6 sm:p-8" onSubmit={submit}>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {request.answers?.length ? (
            request.answers.map((item, index) => (
              <Field
                key={item.id}
                label={<QuestionLabel index={index} text={item.questionText} />}
              >
                <textarea
                  className={`${fieldClass} min-h-28 resize-y border-slate-200 bg-slate-50/70 leading-7 disabled:bg-surface disabled:text-muted`}
                  value={item.answer}
                  disabled
                />
              </Field>
            ))
          ) : (
            questions.map((question, index) => (
              <Field
                key={question.id}
                label={<QuestionLabel index={index} text={question.questionText} />}
              >
                <textarea
                  className={`${fieldClass} min-h-28 resize-y border-slate-200 bg-slate-50/70 leading-7 focus:bg-white disabled:bg-surface disabled:text-muted`}
                  value={answers[question.id] ?? ""}
                  disabled={!canSubmit}
                  onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
                  required
                />
              </Field>
            ))
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-sm text-muted">Your feedback will be shared with {request.requesterName}.</p>
            <div className="flex flex-wrap gap-2">
              <button className={secondaryButton} type="button" onClick={onClose}>
                Close
              </button>
              {canCancel ? (
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 font-semibold text-red-700 transition hover:bg-red-100" type="button" onClick={() => runAction("cancel")}>
                  <X size={16} />
                  Cancel request
                </button>
              ) : null}
              {canDecline ? (
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-5 font-semibold text-orange-700 transition hover:bg-orange-100" type="button" onClick={() => runAction("decline")}>
                  <Ban size={16} />
                  Decline
                </button>
              ) : null}
              {canAcknowledge ? (
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 font-semibold text-white shadow-lg shadow-emerald-100 transition hover:from-emerald-700 hover:to-teal-700" type="button" onClick={() => runAction("acknowledge")}>
                  <Check size={16} />
                  Acknowledge
                </button>
              ) : null}
              {canClose ? (
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800" type="button" onClick={() => runAction("close")}>
                  <Check size={16} />
                  Close request
                </button>
              ) : null}
              {canSubmit && !request.answers?.length ? (
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700" type="submit">
                  <Check size={16} />
                  Submit feedback
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function QuestionLabel({ index, text }) {
  return (
    <span className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
        {index + 1}
      </span>
      <span>{text}</span>
    </span>
  );
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function Avatar({ initials, small = false }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 ${
        small ? "h-8 w-8 text-sm" : "h-12 w-12 text-base"
      }`}
    >
      {initials || "U"}
    </span>
  );
}

function statusClass(status) {
  const base = "status-pill";
  if (status === "submitted") return `${base} bg-green-100 text-green-700`;
  if (status === "acknowledged") return `${base} bg-emerald-100 text-emerald-700`;
  if (status === "closed") return `${base} bg-slate-200 text-slate-700`;
  if (status === "declined") return `${base} bg-orange-100 text-orange-700`;
  if (status === "cancelled") return `${base} bg-red-100 text-red-700`;
  return `${base} bg-blue-50 text-blue-700`;
}

function toTableRow(request) {
  return {
    id: request.id,
    requesterName: request.requesterName,
    requesterInitials: getInitials(request.requesterName),
    giverId: request.giverId,
    giverName: request.giverName,
    giverInitials: getInitials(request.giverName),
    type: request.templateName,
    dueDate: formatDate(request.dueDate),
    createdAt: formatDate(request.createdAt),
    status: request.status,
  };
}
