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
    request.status,
    request.created_at AS createdAt
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

export async function createFeedbackRequest({
  requesterId,
  giverId,
  templateId,
  message,
}) {
  if (requesterId === giverId) {
    throw new ServiceError(400, "You cannot request feedback from yourself");
  }

  const pool = getDatabasePool();
  await requireUser(pool, requesterId, "Requester");
  await requireUser(pool, giverId, "Feedback giver");
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

  const [result] = await pool.execute(
    `INSERT INTO feedback_requests
       (requester_id, giver_id, template_id, message, status)
     VALUES (?, ?, ?, ?, 'requested')`,
    [requesterId, giverId, templateId, message || null],
  );

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

export async function getRequestsForGiver(giverId) {
  const pool = getDatabasePool();
  await requireUser(pool, giverId, "Feedback giver");

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

  const [requests] = await pool.execute(
    `${requestSelect}
     WHERE request.requester_id = ?
     ORDER BY request.created_at DESC, request.id DESC`,
    [requesterId],
  );

  return requests;
}

export async function getFeedbackRequestById(requestId) {
  const pool = getDatabasePool();
  const [[request]] = await pool.execute(
    `${requestSelect}
     WHERE request.id = ?`,
    [requestId],
  );

  if (!request) {
    throw new ServiceError(404, "Feedback request not found");
  }

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

  return {
    ...request,
    answers,
  };
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
