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
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Feedback workflow prototype</p>
          <h1>Request, submit, and close feedback</h1>
        </div>
        <label className="user-switcher">
          <CircleUserRound size={18} />
          <select value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)}>
            {USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="current-user">
        <strong>{currentUser.name}</strong>
        <span>{currentUser.email}</span>
        <button className="ghost-button" type="button" onClick={resetDemo}>
          <RotateCcw size={16} />
          Reset demo
        </button>
      </section>

      <section className="grid">
        <CreateRequest currentUserId={currentUserId} onCreate={createRequest} />
        <RequestsForMe
          currentUserId={currentUserId}
          requests={requests}
          onUpdate={updateRequest}
          onSelect={setSelectedRequestId}
        />
        <FeedbackReceived
          currentUserId={currentUserId}
          requests={requests}
          onUpdate={updateRequest}
          onSelect={setSelectedRequestId}
        />
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
      <form className="stack" onSubmit={submit}>
        <label>
          Feedback giver
          <select value={giverId} onChange={(event) => setGiverId(event.target.value)}>
            {possibleGivers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Feedback type
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            {TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Message
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <button type="submit">
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
      <RequestList emptyText="No feedback requests yet.">
        {items.map((request) => (
          <RequestCard key={request.id} request={request}>
            {request.status === "requested" ? (
              <>
                <button type="button" onClick={() => onUpdate(request.id, { status: "accepted" })}>
                  <Check size={16} />
                  Accept
                </button>
                <button
                  className="danger"
                  type="button"
                  onClick={() => onUpdate(request.id, { status: "declined" })}
                >
                  <X size={16} />
                  Decline
                </button>
              </>
            ) : null}
            {["accepted", "submitted"].includes(request.status) ? (
              <button type="button" onClick={() => onSelect(request.id)}>
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
      <RequestList emptyText="Create a request to see feedback here.">
        {items.map((request) => (
          <RequestCard key={request.id} request={request}>
            <button type="button" onClick={() => onSelect(request.id)}>
              <Eye size={16} />
              Open detail
            </button>
            {request.status === "submitted" ? (
              <button type="button" onClick={() => onUpdate(request.id, { status: "closed" })}>
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
    <div className="modal-backdrop">
      <section className="modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{template.name}</p>
            <h2>
              {requester.name} requested feedback from {giver.name}
            </h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!canRead ? (
          <p>You cannot view this feedback.</p>
        ) : (
          <form className="stack" onSubmit={submit}>
            {template.questions.map((question, index) => (
              <label key={question}>
                {question}
                <textarea
                  value={answers[index] ?? ""}
                  disabled={!canSubmit}
                  onChange={(event) =>
                    setAnswers({ ...answers, [index]: event.target.value })
                  }
                  required
                />
              </label>
            ))}
            <div className="actions end">
              <button className="secondary" type="button" onClick={onClose}>
                Cancel
              </button>
              {canSubmit ? (
                <button type="submit">
                  <Check size={16} />
                  Submit feedback
                </button>
              ) : null}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function Panel({ icon, title, children }) {
  return (
    <section className="panel">
      <div className="panel-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function RequestList({ emptyText, children }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return list.length ? <div className="request-list">{list}</div> : <p className="empty">{emptyText}</p>;
}

function RequestCard({ request, children }) {
  const template = getTemplate(request.templateId);
  const requester = getUser(request.requesterId);
  const giver = getUser(request.giverId);

  return (
    <article className="request-card">
      <div className="card-row">
        <strong>{template.name}</strong>
        <span className={`status ${request.status}`}>{request.status}</span>
      </div>
      <p>{request.message || "No message added."}</p>
      <dl>
        <div>
          <dt>From</dt>
          <dd>{requester.name}</dd>
        </div>
        <div>
          <dt>To</dt>
          <dd>{giver.name}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{request.dueDate || "Not set"}</dd>
        </div>
      </dl>
      <div className="actions">{children}</div>
    </article>
  );
}

function getUser(userId) {
  return USERS.find((user) => user.id === userId) ?? USERS[0];
}

function getTemplate(templateId) {
  return TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];
}
