"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Home as HomeIcon,
  Inbox,
  MessageCircle,
  Plus,
  Send,
  User,
  Users,
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

const SAMPLE_ROWS = [
  {
    id: "sample-1",
    receiverName: "Pooja Sharma",
    initials: "PS",
    project: "CCL Launch",
    dueDate: "Due Jul 28",
    dueMeta: "in 3 days",
    visibility: "Receiver + Mentor",
    status: "requested",
    helper: "Give feedback to Pooja Sharma",
  },
  {
    id: "sample-2",
    receiverName: "Rohan Kapoor",
    initials: "RK",
    project: "Mobile App Redesign",
    dueDate: "Due Aug 04",
    dueMeta: "in 10 days",
    visibility: "Private",
    status: "requested",
    helper: "Give feedback to Rohan Kapoor",
  },
  {
    id: "sample-3",
    receiverName: "Neha Patel",
    initials: "NP",
    project: "Customer Onboarding",
    dueDate: "Due Aug 06",
    dueMeta: "in 12 days",
    visibility: "Receiver + Mentor",
    status: "submitted",
    helper: "Give feedback to Neha Patel",
  },
  {
    id: "sample-4",
    receiverName: "Arjun Mehta",
    initials: "AM",
    project: "Data Migration",
    dueDate: "Due Aug 10",
    dueMeta: "in 16 days",
    visibility: "Private",
    status: "requested",
    helper: "Give feedback to Arjun Mehta",
  },
];

const STORAGE_KEY = "feedback-process-requests";
const primaryButton = "btn btn-primary";
const secondaryButton = "btn btn-secondary";
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
  const pendingForMe = requests.filter((request) => request.giverId === currentUserId);
  const feedbackForMe = requests.filter((request) => request.requesterId === currentUserId);
  const submittedCount = requests.filter((request) => request.status === "submitted").length;
  const tableRows = requests.length ? requests.map(toTableRow) : SAMPLE_ROWS;

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
      project: payload.project,
      visibility: payload.visibility,
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-ink">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr_420px]">
        <Sidebar currentUser={currentUser} currentUserId={currentUserId} onUserChange={setCurrentUserId} />

        <main className="border-x border-line bg-[#fbfcfe] px-7 py-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-[#111827]">Feedback Hub</h1>
            <button className={primaryButton} type="button">
              <Plus size={20} />
              New Feedback
            </button>
          </div>

          <section className="grid gap-5 xl:grid-cols-3">
            <StatCard
              icon={<Inbox size={28} />}
              tone="blue"
              label="Pending Requests"
              value={pendingForMe.length || 4}
              helper="Requests awaiting feedback"
            />
            <StatCard
              icon={<Users size={28} />}
              tone="green"
              label="Feedback Received"
              value={feedbackForMe.length || 12}
              helper="Feedback received this month"
            />
            <StatCard
              icon={<MessageCircle size={28} />}
              tone="amber"
              label="Follow-ups"
              value={submittedCount || 3}
              helper="Actions needing attention"
            />
          </section>

          <section className="mt-7 overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <div className="border-b border-line px-6 py-5">
              <h2 className="text-2xl font-bold text-[#111827]">Pending Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-[#f8fafc] text-xs font-bold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-4">Feedback Receiver</th>
                    <th className="px-4 py-4">Project</th>
                    <th className="px-4 py-4">Due Date</th>
                    <th className="px-4 py-4">Visibility</th>
                    <th className="px-4 py-4">Feedback Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f9fbff]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar initials={row.initials} />
                          <div>
                            <p className="text-base font-semibold text-[#111827]">{row.receiverName}</p>
                            <p className="mt-1 text-sm text-muted">{row.helper}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-base font-medium">{row.project}</td>
                      <td className="px-4 py-5">
                        <p className={row.id === "sample-1" ? "font-semibold text-red-600" : "font-semibold"}>
                          {row.dueDate}
                        </p>
                        <p className="mt-1 text-sm text-muted">{row.dueMeta}</p>
                      </td>
                      <td className="px-4 py-5 text-base">{row.visibility}</td>
                      <td className="px-4 py-5">
                        <span className={statusClass(row.status)}>{row.status}</span>
                      </td>
                      <td className="px-4 py-5">
                        <button
                          className="rounded-md border border-blue-200 px-5 py-2 text-base font-semibold text-blue-700 hover:bg-blue-50"
                          type="button"
                          onClick={() => !row.id.startsWith("sample") && setSelectedRequestId(row.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-6 py-4 text-base text-muted">
              <span>Showing 1 to {tableRows.length} of {tableRows.length} requests</span>
              <button className="inline-flex items-center gap-2 font-semibold text-blue-700" type="button">
                View all requests
                <ChevronRight size={18} />
              </button>
            </div>
          </section>

          <section className="mt-7 rounded-xl border border-line bg-white shadow-sm">
            <div className="border-b border-line px-6 py-5">
              <h2 className="text-2xl font-bold text-[#111827]">Follow-up Actions</h2>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <p className="text-lg font-semibold">Improve weekly project updates</p>
                  <p className="mt-1 text-base text-muted">For Pooja Sharma • Project: CCL Launch</p>
                </div>
              </div>
              <span className="rounded-md bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700">
                Follow-up Needed
              </span>
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

function Sidebar({ currentUser, currentUserId, onUserChange }) {
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
        <SidebarItem icon={<User size={22} />} label="My Feedback" />
        <SidebarItem icon={<FileText size={22} />} label="Requests" />
        <SidebarItem icon={<MessageCircle size={22} />} label="Follow-ups" />
      </nav>

      <div className="mt-auto border-t border-line pt-7">
        <div className="flex items-center gap-3">
          <Avatar initials={currentUser.initials} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{currentUser.name}</p>
            <label className="mt-1 block">
              <select
                className="w-full bg-transparent text-sm text-muted outline-none"
                value={currentUserId}
                onChange={(event) => onUserChange(event.target.value)}
              >
                {USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ChevronDown size={18} className="text-muted" />
        </div>
      </div>
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
  const [project, setProject] = useState("CCL Launch");
  const [visibility, setVisibility] = useState("Receiver + Mentor");
  const [message, setMessage] = useState(
    "I'd appreciate your feedback on my contributions to the CCL Launch project, especially around collaboration and communication.",
  );
  const [dueDate, setDueDate] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!giverId || giverId === currentUserId) return;
    onCreate({ giverId, templateId, project, visibility, message, dueDate });
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

        <Field label="Related project">
          <SelectShell>
            <select className="w-full bg-transparent outline-none" value={project} onChange={(event) => setProject(event.target.value)}>
              <option>CCL Launch</option>
              <option>Mobile App Redesign</option>
              <option>Customer Onboarding</option>
              <option>Data Migration</option>
            </select>
          </SelectShell>
        </Field>

        <Field label="Visibility">
          <SelectShell>
            <select className="w-full bg-transparent outline-none" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
              <option>Receiver + Mentor</option>
              <option>Private</option>
              <option>Team Lead</option>
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
  const giver = getUser(request.giverId);
  return {
    id: request.id,
    receiverName: giver.name,
    initials: giver.initials,
    project: request.project || "CCL Launch",
    dueDate: request.dueDate ? `Due ${request.dueDate}` : "No due date",
    dueMeta: request.dueDate ? "scheduled" : "not set",
    visibility: request.visibility || "Receiver + Mentor",
    status: request.status,
    helper: `Give feedback to ${giver.name}`,
  };
}

function getUser(userId) {
  return USERS.find((user) => user.id === userId) ?? USERS[0];
}

function getTemplate(templateId) {
  return TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];
}
