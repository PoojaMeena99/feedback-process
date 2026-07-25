"use client";

import { useState } from "react";
import {
  Check,
  CircleUserRound,
  ClipboardList,
  Eye,
  Inbox,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

const USERS = [
  { id: "rani", name: "Rani Singh", email: "ranisingh21@navugurukul.org" },
  { id: "shanti", name: "Shanti Singh", email: "shantisingh22@navgurukul.org" },
  { id: "pooja", name: "Pooja", email: "pooja@navgurukul.org" },
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
const dangerButton = "btn btn-danger";
const fieldClass = "field-control";

function loadRequests() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [currentUserId, setCurrentUserId] = useState("rani");
  const [requests, setRequests] = useState(loadRequests);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const currentUser = getUser(currentUserId);
  const selectedRequest = requests.find((request) => request.id === selectedRequestId);
  const waitingCount = requests.filter((request) => request.giverId === currentUserId).length;
  const requestedCount = requests.filter((request) => request.requesterId === currentUserId).length;
  const submittedCount = requests.filter((request) => request.status === "submitted").length;

  function saveRequests(nextRequests) {
    setRequests(nextRequests);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRequests));
  }

  function createRequest(payload) {
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
  }

  function updateRequest(requestId, changes) {
    saveRequests(
      requests.map((request) =>
        request.id === requestId ? { ...request, ...changes } : request,
      ),
    );
  }

  function resetDemo() {
    saveRequests([]);
    setSelectedRequestId(null);
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
              FP
            </div>
            <div>
              <p className="text-base font-bold">Feedback Process</p>
              <p className="text-sm text-muted">Simple team feedback workflow</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex gap-1 rounded-md border border-line bg-surface p-1 text-sm font-medium text-muted">
              <a className="rounded px-3 py-2 hover:bg-white hover:text-ink" href="#create">
                Create
              </a>
              <a className="rounded px-3 py-2 hover:bg-white hover:text-ink" href="#requests">
                Requests
              </a>
              <a className="rounded px-3 py-2 hover:bg-white hover:text-ink" href="#received">
                Received
              </a>
            </nav>

            <label className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
              <CircleUserRound size={18} className="text-muted" />
              <select
                className="bg-transparent text-sm font-semibold outline-none"
                value={currentUserId}
                onChange={(event) => setCurrentUserId(event.target.value)}
              >
                {USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <section className="grid gap-5 border-b border-line pb-5 md:grid-cols-[320px_1fr]">
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Current user</p>
            <p className="mt-3 text-xl font-bold">{currentUser.name}</p>
            <p className="mt-1 break-words text-sm text-muted">{currentUser.email}</p>
            <button className={`${secondaryButton} mt-5 w-full`} type="button" onClick={resetDemo}>
              <RotateCcw size={16} />
              Reset demo
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Waiting for me" value={waitingCount} />
            <Metric label="Requested by me" value={requestedCount} />
            <Metric label="Submitted feedback" value={submittedCount} />
          </div>
        </section>

        <section className="grid gap-5 pt-5 lg:grid-cols-3">
          <div id="create">
            <CreateRequest currentUserId={currentUserId} onCreate={createRequest} />
          </div>
          <div id="requests">
            <RequestsForMe
              currentUserId={currentUserId}
              requests={requests}
              onUpdate={updateRequest}
              onSelect={setSelectedRequestId}
            />
          </div>
          <div id="received">
            <FeedbackReceived
              currentUserId={currentUserId}
              requests={requests}
              onUpdate={updateRequest}
              onSelect={setSelectedRequestId}
            />
          </div>
        </section>

        {selectedRequest ? (
          <FeedbackDetail
            request={selectedRequest}
            currentUserId={currentUserId}
            onClose={() => setSelectedRequestId(null)}
            onUpdate={updateRequest}
          />
        ) : null}
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between lg:px-8">
          <span className="font-semibold text-ink">Feedback Process Prototype</span>
          <span>Next.js + Tailwind CSS. Data is currently saved in localStorage.</span>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

function CreateRequest({ currentUserId, onCreate }) {
  const possibleGivers = USERS.filter((user) => user.id !== currentUserId);
  const [giverId, setGiverId] = useState(possibleGivers[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState("Please share feedback for my learning progress.");
  const [dueDate, setDueDate] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!giverId || giverId === currentUserId) return;
    onCreate({ giverId, templateId, message, dueDate });
    setMessage("");
    setDueDate("");
  }

  return (
    <Panel icon={<Send size={18} />} title="Create Request">
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Feedback giver">
          <select className={fieldClass} value={giverId} onChange={(event) => setGiverId(event.target.value)}>
            {possibleGivers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Feedback type">
          <select className={fieldClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            {TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Message">
          <textarea
            className={`${fieldClass} min-h-24 resize-y`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </Field>

        <Field label="Due date">
          <input
            className={fieldClass}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Field>

        <button className={primaryButton} type="submit">
          <Send size={16} />
          Send request
        </button>
      </form>
    </Panel>
  );
}

function RequestsForMe({ currentUserId, requests, onUpdate, onSelect }) {
  const items = requests.filter((request) => request.giverId === currentUserId);

  return (
    <Panel icon={<Inbox size={18} />} title="Requests For Me">
      <RequestList emptyText="No feedback requests for this user.">
        {items.map((request) => (
          <RequestCard key={request.id} request={request}>
            {request.status === "requested" ? (
              <>
                <button className={primaryButton} type="button" onClick={() => onUpdate(request.id, { status: "accepted" })}>
                  <Check size={16} />
                  Accept
                </button>
                <button
                  className={dangerButton}
                  type="button"
                  onClick={() => onUpdate(request.id, { status: "declined" })}
                >
                  <X size={16} />
                  Decline
                </button>
              </>
            ) : null}
            {["accepted", "submitted"].includes(request.status) ? (
              <button className={secondaryButton} type="button" onClick={() => onSelect(request.id)}>
                <ClipboardList size={16} />
                Fill or view form
              </button>
            ) : null}
          </RequestCard>
        ))}
      </RequestList>
    </Panel>
  );
}

function FeedbackReceived({ currentUserId, requests, onUpdate, onSelect }) {
  const items = requests.filter((request) => request.requesterId === currentUserId);

  return (
    <Panel icon={<Eye size={18} />} title="Feedback Received">
      <RequestList emptyText="Requests created by this user will appear here.">
        {items.map((request) => (
          <RequestCard key={request.id} request={request}>
            <button className={secondaryButton} type="button" onClick={() => onSelect(request.id)}>
              <Eye size={16} />
              Open detail
            </button>
            {request.status === "submitted" ? (
              <button className={primaryButton} type="button" onClick={() => onUpdate(request.id, { status: "closed" })}>
                <Check size={16} />
                Close
              </button>
            ) : null}
          </RequestCard>
        ))}
      </RequestList>
    </Panel>
  );
}

function FeedbackDetail({ request, currentUserId, onClose, onUpdate }) {
  const template = getTemplate(request.templateId);
  const requester = getUser(request.requesterId);
  const giver = getUser(request.giverId);
  const canSubmit = currentUserId === request.giverId && request.status === "accepted";
  const canRead = currentUserId === request.requesterId || currentUserId === request.giverId;
  const [answers, setAnswers] = useState(request.answers ?? {});

  function submit(event) {
    event.preventDefault();
    onUpdate(request.id, { answers, status: "submitted" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/60 p-5">
      <section className="max-h-[calc(100vh-40px)] w-full max-w-3xl overflow-auto rounded-md bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent">{template.name}</p>
            <h2 className="mt-1 text-xl font-bold">
              {requester.name} requested feedback from {giver.name}
            </h2>
          </div>
          <button className={`${secondaryButton} min-h-9 px-2.5`} type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {!canRead ? (
            <p className="card bg-surface p-4 text-sm text-muted">
              You cannot view this feedback.
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={submit}>
              {template.questions.map((question, index) => (
                <Field key={question} label={question}>
                  <textarea
                    className={`${fieldClass} min-h-24 resize-y disabled:bg-surface disabled:text-muted`}
                    value={answers[index] ?? ""}
                    disabled={!canSubmit}
                    onChange={(event) =>
                      setAnswers({ ...answers, [index]: event.target.value })
                    }
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
          )}
        </div>
      </section>
    </div>
  );
}

function Panel({ icon, title, children }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <span className="text-brand">{icon}</span>
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      <span>{label}</span>
      {children}
    </label>
  );
}

function RequestList({ emptyText, children }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return list.length ? (
    <div className="grid gap-3">{list}</div>
  ) : (
    <p className="empty-state">
      {emptyText}
    </p>
  );
}

function RequestCard({ request, children }) {
  const template = getTemplate(request.templateId);
  const requester = getUser(request.requesterId);
  const giver = getUser(request.giverId);

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <strong className="text-sm">{template.name}</strong>
        <span className={statusClass(request.status)}>{request.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{request.message || "No message added."}</p>
      <dl className="mt-4 grid gap-3 rounded-md bg-surface p-3 text-sm">
        <Info label="From" value={requester.name} />
        <Info label="To" value={giver.name} />
        <Info label="Due" value={request.dueDate || "Not set"} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

function statusClass(status) {
  const base = "status-pill";
  if (status === "requested") return `${base} status-requested`;
  if (status === "declined") return `${base} status-declined`;
  if (status === "closed") return `${base} status-closed`;
  return `${base} status-active`;
}

function getUser(userId) {
  return USERS.find((user) => user.id === userId) ?? USERS[0];
}

function getTemplate(templateId) {
  return TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];
}
