import { getDatabasePool } from "../db/connection.js";
import { sendFeedbackRequestNotification } from "../integrations/mattermost.js";
import { ServiceError } from "./serviceError.js";

const requestSelect = `
  SELECT
    request.id,
    request.requester_id AS requesterId,
    requester.name AS requesterName,
    requester.email AS requesterEmail,
    request.giver_id AS giverId,
    giver.name AS giverName,
    giver.email AS giverEmail,
    request.template_id AS templateId,
    template.name AS templateName,
    request.message,
    request.purpose,
    request.visibility,
    request.due_date AS dueDate,
    request.status,
    request.decline_reason AS declineReason,
    request.acknowledgement_comment AS acknowledgementComment,
    request.acknowledged_at AS acknowledgedAt,
    EXISTS(
      SELECT 1 FROM feedback_follow_ups AS follow_up
      WHERE follow_up.request_id = request.id AND follow_up.status != 'completed'
    ) AS hasOpenFollowUps,
    request.created_at AS createdAt,
    request.updated_at AS updatedAt
  FROM feedback_requests AS request
  JOIN users AS requester ON requester.id = request.requester_id
  JOIN users AS giver ON giver.id = request.giver_id
  JOIN feedback_templates AS template ON template.id = request.template_id
`;

async function requireUser(pool, userId, label) {
  const [[user]] = await pool.execute(
    "SELECT id FROM users WHERE id = ?",
    [userId],
  );

  if (!user) {
    throw new ServiceError(404, `${label} not found`);
  }
}

async function requireTemplate(pool, templateId) {
  const [[template]] = await pool.execute(
    "SELECT id FROM feedback_templates WHERE id = ?",
    [templateId],
  );

  if (!template) {
    throw new ServiceError(404, "Feedback template not found");
  }
}

// This runs whenever requests are read. The dashboard refreshes every 3 seconds,
// so an unanswered request changes from Requested to Overdue shortly after its due date passes.
async function markOverdueRequests(pool) {
  await pool.execute(
    `UPDATE feedback_requests
     SET status = 'overdue'
     WHERE status = 'requested'
       AND due_date IS NOT NULL
       AND due_date < CURRENT_DATE()`,
  );
}

export async function createFeedbackRequest({
  requesterId,
  giverId,
  templateId,
  message,
  dueDate,
  purpose,
  visibility,
  viewerIds,
}) {
  if (requesterId === giverId) {
    throw new ServiceError(400, "You cannot request feedback from yourself");
  }

  const pool = getDatabasePool();
  const normalizedDueDate = normalizeDueDate(dueDate);
  const normalizedPurpose = normalizePurpose(purpose);
  const normalizedVisibility = normalizeVisibility(visibility);
  const normalizedViewerIds = normalizeViewerIds(viewerIds, requesterId, giverId, normalizedVisibility);
  await requireUser(pool, requesterId, "Requester");
  await requireUser(pool, giverId, "Feedback giver");
  for (const viewerId of normalizedViewerIds) {
    await requireUser(pool, viewerId, "Selected viewer");
  }
  await requireTemplate(pool, templateId);

  const [[duplicateRequest]] = await pool.execute(
    `SELECT id
     FROM feedback_requests
     WHERE requester_id = ?
       AND giver_id = ?
       AND template_id = ?
       AND status = 'requested'
     LIMIT 1`,
    [requesterId, giverId, templateId],
  );

  if (duplicateRequest) {
    throw new ServiceError(
      409,
      "An open feedback request already exists for this requester, giver, and template",
    );
  }

  const connection = await pool.getConnection();
  let result;
  try {
    await connection.beginTransaction();
    [result] = await connection.execute(
      `INSERT INTO feedback_requests
         (requester_id, giver_id, template_id, message, due_date, purpose, visibility, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'requested')`,
      [requesterId, giverId, templateId, message || null, normalizedDueDate, normalizedPurpose, normalizedVisibility],
    );
    for (const viewerId of normalizedViewerIds) {
      await connection.execute(
        "INSERT INTO feedback_request_viewers (request_id, user_id) VALUES (?, ?)",
        [result.insertId, viewerId],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const feedbackRequest = await getFeedbackRequestById(result.insertId);

  try {
    const notification =
      await sendFeedbackRequestNotification(feedbackRequest);
    return { ...feedbackRequest, notification };
  } catch (error) {
    console.error("Mattermost notification failed:", error.message);
    return {
      ...feedbackRequest,
      notification: { sent: false, reason: "Mattermost notification failed" },
    };
  }
}

function normalizeVisibility(visibility) {
  const value = visibility || "private";
  if (!["private", "mentor_lead", "selected_group"].includes(value)) {
    throw new ServiceError(400, "visibility must be private, mentor_lead, or selected_group");
  }
  return value;
}

function normalizeViewerIds(viewerIds, requesterId, giverId, visibility) {
  const ids = viewerIds === undefined ? [] : viewerIds;
  if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
    throw new ServiceError(400, "viewerIds must contain positive user IDs");
  }
  const uniqueIds = [...new Set(ids.map(Number))];
  if (uniqueIds.some((id) => id === requesterId || id === giverId)) {
    throw new ServiceError(400, "Requester and feedback giver already have access");
  }
  if (visibility === "private" && uniqueIds.length) {
    throw new ServiceError(400, "Private feedback cannot have extra viewers");
  }
  if (visibility === "mentor_lead" && uniqueIds.length !== 1) {
    throw new ServiceError(400, "Select one mentor or lead viewer");
  }
  if (visibility === "selected_group" && uniqueIds.length === 0) {
    throw new ServiceError(400, "Select at least one group viewer");
  }
  return uniqueIds;
}

function normalizePurpose(purpose) {
  if (purpose === undefined || purpose === null || purpose === "") {
    return null;
  }

  const allowedPurposes = ["growth", "project_improvement", "one_on_one", "appraisal"];
  if (!allowedPurposes.includes(purpose)) {
    throw new ServiceError(400, "purpose must be growth, project_improvement, one_on_one, or appraisal");
  }
  return purpose;
}

function normalizeDueDate(dueDate) {
  if (dueDate === undefined || dueDate === null || dueDate === "") {
    return null;
  }

  if (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new ServiceError(400, "dueDate must use YYYY-MM-DD format");
  }

  const parsed = new Date(`${dueDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dueDate) {
    throw new ServiceError(400, "dueDate must be a valid calendar date");
  }

  const today = new Date().toISOString().slice(0, 10);
  if (dueDate < today) {
    throw new ServiceError(400, "Due date cannot be in the past");
  }

  return dueDate;
}

export async function getRequestsForGiver(giverId) {
  const pool = getDatabasePool();
  await requireUser(pool, giverId, "Feedback giver");
  await markOverdueRequests(pool);

  const [requests] = await pool.execute(
    `${requestSelect}
     WHERE request.giver_id = ?
     ORDER BY request.created_at DESC, request.id DESC`,
    [giverId],
  );

  return requests;
}

export async function getRequestsForRequester(requesterId) {
  const pool = getDatabasePool();
  await requireUser(pool, requesterId, "Requester");
  await markOverdueRequests(pool);

  const [requests] = await pool.execute(
    `${requestSelect}
     WHERE request.requester_id = ?
     ORDER BY request.created_at DESC, request.id DESC`,
    [requesterId],
  );

  return requests;
}

export async function getRequestsVisibleTo(viewerId) {
  const pool = getDatabasePool();
  await requireUser(pool, viewerId, "Viewer");
  await markOverdueRequests(pool);
  const [requests] = await pool.execute(
    `${requestSelect}
     JOIN feedback_request_viewers AS viewer ON viewer.request_id = request.id
     WHERE viewer.user_id = ?
     ORDER BY request.created_at DESC, request.id DESC`,
    [viewerId],
  );
  return requests;
}

export async function getFeedbackRequestById(requestId) {
  const pool = getDatabasePool();
  await markOverdueRequests(pool);
  const [[request]] = await pool.execute(
    `${requestSelect}
     WHERE request.id = ?`,
    [requestId],
  );

  if (!request) {
    throw new ServiceError(404, "Feedback request not found");
  }

  const [viewers] = await pool.execute(
    `SELECT viewer.user_id AS userId, user.name, user.email
     FROM feedback_request_viewers AS viewer
     JOIN users AS user ON user.id = viewer.user_id
     WHERE viewer.request_id = ?
     ORDER BY user.name`,
    [requestId],
  );

  const [answers] = await pool.execute(
    `SELECT
       answer.id,
       answer.question_id AS questionId,
       question.question_text AS questionText,
       answer.answer,
       answer.created_at AS createdAt
     FROM feedback_answers AS answer
     JOIN template_questions AS question ON question.id = answer.question_id
     WHERE answer.request_id = ?
     ORDER BY question.question_order, answer.id`,
    [requestId],
  );

  const [followUps] = await pool.execute(
    `SELECT
       follow_up.id,
       follow_up.details,
       follow_up.owner_id AS ownerId,
       owner.name AS ownerName,
       follow_up.due_date AS dueDate,
       follow_up.status,
       (follow_up.status != 'completed' AND follow_up.due_date IS NOT NULL AND follow_up.due_date < CURRENT_DATE()) AS isOverdue,
       CASE
         WHEN follow_up.status != 'completed' AND follow_up.due_date IS NOT NULL AND follow_up.due_date < CURRENT_DATE()
         THEN DATEDIFF(CURRENT_DATE(), follow_up.due_date)
         ELSE 0
       END AS overdueDays,
       follow_up.progress_note AS progressNote,
       follow_up.completed_at AS completedAt,
       follow_up.created_at AS createdAt,
       follow_up.updated_at AS updatedAt
     FROM feedback_follow_ups AS follow_up
     JOIN users AS owner ON owner.id = follow_up.owner_id
     WHERE follow_up.request_id = ?
     ORDER BY follow_up.created_at DESC, follow_up.id DESC`,
    [requestId],
  );

  return {
    ...request,
    viewers,
    answers,
    followUps,
  };
}

export async function createFollowUp({ requestId, actorId, details, ownerId, dueDate }) {
  const normalizedDueDate = normalizeDueDate(dueDate);
  const pool = getDatabasePool();
  const [[request]] = await pool.execute(
    "SELECT requester_id AS requesterId, giver_id AS giverId, status FROM feedback_requests WHERE id = ?",
    [requestId],
  );
  if (!request) throw new ServiceError(404, "Feedback request not found");
  if (actorId !== request.requesterId) throw new ServiceError(403, "Only the requester can create a follow-up");
  if (request.status !== "acknowledged") throw new ServiceError(409, "Follow-ups can be created after feedback is acknowledged");
  if (!details?.trim()) throw new ServiceError(400, "Follow-up details are required");
  if (details.trim().length > 500) throw new ServiceError(400, "Follow-up details must be 500 characters or less");
  await requireUser(pool, ownerId, "Follow-up owner");
  if (![request.requesterId, request.giverId].includes(ownerId)) {
    throw new ServiceError(400, "Follow-up owner must be part of this feedback request");
  }
  const [result] = await pool.execute(
    `INSERT INTO feedback_follow_ups (request_id, details, owner_id, due_date)
     VALUES (?, ?, ?, ?)`,
    [requestId, details.trim(), ownerId, normalizedDueDate],
  );
  return getFollowUpById(result.insertId);
}

export async function updateFollowUp({ followUpId, actorId, status, progressNote }) {
  const pool = getDatabasePool();
  const [[followUp]] = await pool.execute(
    `SELECT follow_up.id, follow_up.owner_id AS ownerId, follow_up.request_id AS requestId,
            request.requester_id AS requesterId
     FROM feedback_follow_ups AS follow_up
     JOIN feedback_requests AS request ON request.id = follow_up.request_id
     WHERE follow_up.id = ?`,
    [followUpId],
  );
  if (!followUp) throw new ServiceError(404, "Follow-up not found");
  if (![followUp.ownerId, followUp.requesterId].includes(actorId)) {
    throw new ServiceError(403, "Only the follow-up owner or requester can update it");
  }
  if (!["open", "in_progress", "completed"].includes(status)) {
    throw new ServiceError(400, "Follow-up status must be open, in_progress, or completed");
  }
  if (progressNote !== undefined && typeof progressNote !== "string") {
    throw new ServiceError(400, "Progress note must be text");
  }
  if (progressNote?.trim().length > 500) throw new ServiceError(400, "Progress note must be 500 characters or less");
  await pool.execute(
    `UPDATE feedback_follow_ups
     SET status = ?, progress_note = ?, completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE id = ?`,
    [status, progressNote?.trim() || null, status, followUpId],
  );
  return getFollowUpById(followUpId);
}

async function getFollowUpById(followUpId) {
  const pool = getDatabasePool();
  const [[followUp]] = await pool.execute(
    `SELECT follow_up.id, follow_up.request_id AS requestId, follow_up.details,
       follow_up.owner_id AS ownerId, owner.name AS ownerName, follow_up.due_date AS dueDate,
       follow_up.status,
       (follow_up.status != 'completed' AND follow_up.due_date IS NOT NULL AND follow_up.due_date < CURRENT_DATE()) AS isOverdue,
       CASE
         WHEN follow_up.status != 'completed' AND follow_up.due_date IS NOT NULL AND follow_up.due_date < CURRENT_DATE()
         THEN DATEDIFF(CURRENT_DATE(), follow_up.due_date)
         ELSE 0
       END AS overdueDays,
       follow_up.progress_note AS progressNote,
       follow_up.completed_at AS completedAt, follow_up.created_at AS createdAt
     FROM feedback_follow_ups AS follow_up
     JOIN users AS owner ON owner.id = follow_up.owner_id
     WHERE follow_up.id = ?`,
    [followUpId],
  );
  return followUp;
}

export async function updateFeedbackRequestStatus(requestId, status) {
  const pool = getDatabasePool();
  const [result] = await pool.execute(
    `UPDATE feedback_requests
     SET status = ?
     WHERE id = ?`,
    [status, requestId],
  );

  if (result.affectedRows === 0) {
    throw new ServiceError(404, "Feedback request not found");
  }

  return getFeedbackRequestById(requestId);
}

export async function updateFeedbackRequestDueDate(requestId, requesterId, dueDate) {
  const normalizedDueDate = normalizeDueDate(dueDate);
  const pool = getDatabasePool();
  const [[request]] = await pool.execute(
    "SELECT requester_id AS requesterId, status FROM feedback_requests WHERE id = ?",
    [requestId],
  );

  if (!request) {
    throw new ServiceError(404, "Feedback request not found");
  }

  if (request.requesterId !== requesterId) {
    throw new ServiceError(403, "Only the requester can change the due date");
  }

  if (!["requested", "overdue"].includes(request.status)) {
    throw new ServiceError(409, "Due date can only be changed before feedback is submitted");
  }

  await pool.execute(
    "UPDATE feedback_requests SET due_date = ?, status = 'requested' WHERE id = ?",
    [normalizedDueDate, requestId],
  );

  return getFeedbackRequestById(requestId);
}

const lifecycleActions = {
  decline: {
    actorColumn: "giver_id",
    actorLabel: "selected feedback giver",
    from: ["requested", "overdue"],
    to: "declined",
  },
  cancel: {
    actorColumn: "requester_id",
    actorLabel: "requester",
    from: ["requested", "overdue"],
    to: "cancelled",
  },
  acknowledge: {
    actorColumn: "requester_id",
    actorLabel: "requester",
    from: "submitted",
    to: "acknowledged",
  },
  close: {
    actorColumn: "requester_id",
    actorLabel: "requester",
    from: "acknowledged",
    to: "closed",
  },
};

export async function performFeedbackRequestAction(
  requestId,
  actorId,
  action,
  acknowledgementComment = null,
  declineReason = null,
) {
  const rule = lifecycleActions[action];

  if (!rule) {
    throw new ServiceError(400, "Unsupported feedback request action");
  }

  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[request]] = await connection.execute(
      `SELECT id, requester_id AS requesterId, giver_id AS giverId, status
       FROM feedback_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId],
    );

    if (!request) {
      throw new ServiceError(404, "Feedback request not found");
    }

    const expectedActorId =
      rule.actorColumn === "giver_id" ? request.giverId : request.requesterId;

    if (actorId !== expectedActorId) {
      throw new ServiceError(403, `Only the ${rule.actorLabel} can ${action} this request`);
    }

    const allowedCurrentStatuses = Array.isArray(rule.from) ? rule.from : [rule.from];
    if (!allowedCurrentStatuses.includes(request.status)) {
      throw new ServiceError(
        409,
        `This request is ${request.status}; it can only be ${action}d while it is ${allowedCurrentStatuses.join(" or ")}`,
      );
    }

    if (action === "close") {
      const [[openFollowUp]] = await connection.execute(
        `SELECT id FROM feedback_follow_ups
         WHERE request_id = ? AND status != 'completed'
         LIMIT 1`,
        [requestId],
      );
      if (openFollowUp) {
        throw new ServiceError(409, "Complete the open follow-up action before closing this request");
      }
    }

    if (action === "acknowledge") {
      await connection.execute(
        `UPDATE feedback_requests
         SET status = ?, acknowledgement_comment = ?, acknowledged_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [rule.to, acknowledgementComment, requestId],
      );
    } else if (action === "decline") {
      await connection.execute(
        "UPDATE feedback_requests SET status = ?, decline_reason = ? WHERE id = ?",
        [rule.to, declineReason, requestId],
      );
    } else {
      await connection.execute(
        "UPDATE feedback_requests SET status = ? WHERE id = ?",
        [rule.to, requestId],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getFeedbackRequestById(requestId);
}
