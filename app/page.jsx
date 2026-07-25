"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Home as HomeIcon,
  Inbox,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

const USERS = [
  { id: "rani", name: "Rani Singh", email: "ranisingh21@navugurukul.org", initials: "RS" },
  { id: "shanti", name: "Shanti Singh", email: "shantisingh22@navgurukul.org", initials: "SS" },
  { id: "pooja", name: "Pooja", email: "pooja@navgurukul.org", initials: "P" },
];

const TEMPLATES = [
  {
    id: "learning",
    name: "Learning Feedback",
    questions: [
      "What did this person learn well?",
      "Where can they improve?",
      "Share one specific example.",
      "What should be their next learning step?",
    ],
  },
  {
    id: "project-completion",
    name: "Project Completion Feedback",
    questions: [
      "What went well in the project?",
      "What could be improved next time?",
      "How was this person's ownership or contribution?",
      "What is one suggested action for the next project?",
    ],
  },
];

const STORAGE_KEY = "feedback-process-requests";
const primaryButton = "btn btn-primary";
const secondaryButton = "btn btn-secondary";
const fieldClass = "field-control";

function loadRequests() {
  if (typeof window === "undefined") return [];
  try {
    const savedRequests = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    const cleanRequests = dedupeRequests(savedRequests);
    if (cleanRequests.length !== savedRequests.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanRequests));
    }
    return cleanRequests;
  } catch {
    return [];
  }
}

function dedupeRequests(savedRequests) {
  const seen = new Set();
  return savedRequests.filter((request) => {
    if (request.status !== "requested") return true;
    const key = `${request.requesterId}:${request.giverId}:${request.templateId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Home() {
  const [currentUserId, setCurrentUserId] = useState("rani");
  const [requests, setRequests] = useState(loadRequests);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const currentUser = getUser(currentUserId);
  const selectedRequest = requests.find((request) => request.id === selectedRequestId);
  const pendingForMe = requests.filter((request) => request.giverId === currentUserId);
  const sentByMe = requests.filter((request) => request.requesterId === currentUserId);
  const submittedCount = requests.filter((request) => request.status === "submitted").length;
  const tableRows = requests
    .filter((request) => request.giverId === currentUserId || request.requesterId === currentUserId)
    .map(toTableRow);

  function saveRequests(nextRequests) {
    setRequests(nextRequests);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRequests));
  }

  function createRequest(payload) {
    const duplicateRequest = requests.find(
      (request) =>
        request.requesterId === currentUserId &&
        request.giverId === payload.giverId &&
        request.templateId === payload.templateId &&
        request.status === "requested",
    );

    if (duplicateRequest) {
      setSelectedRequestId(duplicateRequest.id);
      return false;
    }

    const nextRequest = {
      id: crypto.randomUUID(),
      requesterId: currentUserId,
      giverId: payload.giverId,
      templateId: payload.templateId,
      message: payload.message,
      dueDate: payload.dueDate,
      status: "requested",
      answers: {},
      createdAt: new Date().toISOString(),
    };
    saveRequests([nextRequest, ...requests]);
    return true;
  }

  function updateRequest(requestId, changes) {
    saveRequests(
      requests.map((request) =>
        request.id === requestId ? { ...request, ...changes } : request,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-ink">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr_420px]">
        <Sidebar />

        <main className="border-x border-line bg-[#fbfcfe] px-7 py-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-[#111827]">Feedback Hub</h1>
            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-line bg-white px-4 shadow-sm">
              <Avatar initials={currentUser.initials} small />
              <select
                className="bg-transparent text-base font-semibold outline-none"
                value={currentUserId}
                onChange={(event) => setCurrentUserId(event.target.value)}
              >
                {USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="text-muted" />
            </label>
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

          <section className="mt-7 overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <div className="border-b border-line px-6 py-5">
              <h2 className="text-2xl font-bold text-[#111827]">Feedback Requests</h2>
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
                      </td>
                      <td className="px-4 py-5">
                        <button
                          className="rounded-md border border-blue-200 px-5 py-2 text-base font-semibold text-blue-700 hover:bg-blue-50"
                          type="button"
                          onClick={() => setSelectedRequestId(row.id)}
                        >
                          {row.giverId === currentUserId && row.status === "requested" ? "Fill" : "View"}
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
              <span>Showing 1 to {tableRows.length} of {tableRows.length} requests</span>
            </div>
          </section>
        </main>

        <CreateFeedbackPanel currentUserId={currentUserId} onCreate={createRequest} />
      </div>

      {selectedRequest ? (
        <FeedbackDetail
          request={selectedRequest}
          currentUserId={currentUserId}
          onClose={() => setSelectedRequestId(null)}
          onUpdate={updateRequest}
        />
      ) : null}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden bg-white px-4 py-8 shadow-sm lg:flex lg:flex-col">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <MessageCircle size={20} />
        </div>
        <h2 className="text-2xl font-bold text-[#111827]">Feedback Hub</h2>
      </div>

      <nav className="space-y-3 text-lg font-medium">
        <SidebarItem active icon={<HomeIcon size={22} />} label="Dashboard" />
        <SidebarItem icon={<Inbox size={22} />} label="Feedback Requests" />
      </nav>
    </aside>
  );
}

function SidebarItem({ active = false, icon, label }) {
  return (
    <a
      className={`flex items-center gap-4 rounded-lg px-4 py-3 ${
        active ? "bg-blue-50 text-blue-700" : "text-muted hover:bg-surface hover:text-ink"
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
    <article className="rounded-xl border border-line bg-white p-7 shadow-sm">
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

function CreateFeedbackPanel({ currentUserId, onCreate }) {
  const possibleGivers = USERS.filter((user) => user.id !== currentUserId);
  const [giverId, setGiverId] = useState(possibleGivers[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState(
    "Please share feedback for my learning progress.",
  );
  const [dueDate, setDueDate] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!possibleGivers.some((user) => user.id === giverId)) {
      setGiverId(possibleGivers[0]?.id ?? "");
    }
  }, [currentUserId, giverId, possibleGivers]);

  function submit(event) {
    event.preventDefault();
    if (!giverId || giverId === currentUserId) return;
    const created = onCreate({ giverId, templateId, message, dueDate });
    setNotice(created ? "Request sent." : "This request already exists.");
  }

  return (
    <aside className="bg-white px-7 py-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#111827]">Create Feedback Request</h2>
        <button className="text-muted hover:text-ink" type="button" aria-label="Close">
          <X size={26} />
        </button>
      </div>

      <form className="grid gap-6" onSubmit={submit}>
        <Field label="Feedback type">
          <SelectShell>
            <select className="w-full bg-transparent outline-none" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>

        <Field label="Feedback receiver">
          <SelectShell>
            <Avatar initials={getUser(giverId).initials} small />
            <select className="w-full bg-transparent outline-none" value={giverId} onChange={(event) => setGiverId(event.target.value)}>
              {possibleGivers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>

        <Field label="Due date">
          <input className={fieldClass} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
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
        {notice ? <p className="text-center text-base font-medium text-blue-700">{notice}</p> : null}
      </form>
    </aside>
  );
}

function SelectShell({ children }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-white px-4 text-base shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      {children}
      <ChevronDown size={18} className="shrink-0 text-muted" />
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

function FeedbackDetail({ request, currentUserId, onClose, onUpdate }) {
  const template = getTemplate(request.templateId);
  const requester = getUser(request.requesterId);
  const giver = getUser(request.giverId);
  const canSubmit = currentUserId === request.giverId && request.status === "requested";
  const [answers, setAnswers] = useState(request.answers ?? {});

  function submit(event) {
    event.preventDefault();
    onUpdate(request.id, { answers, status: "submitted" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 p-5">
      <section className="max-h-[calc(100vh-40px)] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">{template.name}</p>
            <h2 className="mt-1 text-2xl font-bold">
              {requester.name} requested feedback from {giver.name}
            </h2>
          </div>
          <button className={secondaryButton} type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="grid gap-4 p-6" onSubmit={submit}>
          {template.questions.map((question, index) => (
            <Field key={question} label={question}>
              <textarea
                className={`${fieldClass} min-h-24 resize-y disabled:bg-surface disabled:text-muted`}
                value={answers[index] ?? ""}
                disabled={!canSubmit}
                onChange={(event) => setAnswers({ ...answers, [index]: event.target.value })}
                required
              />
            </Field>
          ))}
          <div className="flex flex-wrap justify-end gap-2">
            <button className={secondaryButton} type="button" onClick={onClose}>
              Cancel
            </button>
            {canSubmit ? (
              <button className={primaryButton} type="submit">
                <Check size={16} />
                Submit feedback
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
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
  return `${base} bg-blue-50 text-blue-700`;
}

function toTableRow(request) {
  const requester = getUser(request.requesterId);
  const giver = getUser(request.giverId);
  const template = getTemplate(request.templateId);
  return {
    id: request.id,
    requesterName: requester.name,
    requesterEmail: requester.email,
    requesterInitials: requester.initials,
    giverId: request.giverId,
    giverName: giver.name,
    giverInitials: giver.initials,
    type: template.name,
    dueDate: request.dueDate ? `Due ${request.dueDate}` : "No due date",
    status: request.status,
  };
}

function getUser(userId) {
  return USERS.find((user) => user.id === userId) ?? USERS[0];
}

function getTemplate(templateId) {
  return TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];
}
