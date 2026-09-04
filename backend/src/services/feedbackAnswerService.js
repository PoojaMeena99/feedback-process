import { getDatabasePool } from "../db/connection.js";
import { sendFeedbackSubmittedNotification } from "../integrations/mattermost.js";
import { getFeedbackRequestById } from "./feedbackRequestService.js";
import { ServiceError } from "./serviceError.js";
import { createInAppNotification } from "./notificationService.js";
import { writeFeedbackAuditEvent } from "./feedbackAuditService.js";

function normalizeAnswers(answers, questions) {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ServiceError(400, "answers must be a non-empty array");
  }

  if (questions.length === 0) {
    throw new ServiceError(
      400,
      "The selected feedback template does not have questions",
    );
  }

  if (answers.length !== questions.length) {
    throw new ServiceError(
      400,
      "answers must include one answer for every template question",
    );
  }

  if (answers.every((answer) => typeof answer === "string")) {
    return answers.map((answer, index) => ({
      questionId: questions[index].id,
      answer: answer.trim(),
    }));
  }

  return answers.map((answer) => ({
    questionId: Number(answer?.questionId),
    answer: typeof answer?.answer === "string" ? answer.answer.trim() : "",
  }));
}

export async function submitFeedbackAnswers(requestId, giverId, answers) {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[request]] = await connection.execute(
      `SELECT id, giver_id AS giverId, template_id AS templateId, status
       FROM feedback_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId],
    );

    if (!request) {
      throw new ServiceError(404, "Feedback request not found");
    }

    if (giverId !== request.giverId) {
      throw new ServiceError(
        403,
        "Only the selected feedback giver can submit answers",
      );
    }

    if (!["requested", "in_progress", "overdue"].includes(request.status)) {
      throw new ServiceError(
        409,
        "Only an active feedback request can be submitted",
      );
    }

    const [questions] = await connection.execute(
      `SELECT id
       FROM template_questions
       WHERE template_id = ?
       ORDER BY question_order, id`,
      [request.templateId],
    );

    const normalizedAnswers = normalizeAnswers(answers, questions);
    const validQuestionIds = new Set(questions.map((question) => question.id));
    const usedQuestionIds = new Set();

    for (const item of normalizedAnswers) {
      if (!validQuestionIds.has(item.questionId)) {
        throw new ServiceError(
          400,
          "Every answer must reference a question from the selected template",
        );
      }

      if (usedQuestionIds.has(item.questionId)) {
        throw new ServiceError(400, "A question can only be answered once");
      }

      if (!item.answer) {
        throw new ServiceError(400, "Answer text cannot be empty");
      }

      usedQuestionIds.add(item.questionId);
    }

    const [[existingAnswer]] = await connection.execute(
      "SELECT id FROM feedback_answers WHERE request_id = ? LIMIT 1",
      [requestId],
    );

    if (existingAnswer) {
      throw new ServiceError(409, "Feedback has already been submitted");
    }

    for (const item of normalizedAnswers) {
      await connection.execute(
        `INSERT INTO feedback_answers (request_id, question_id, answer)
         VALUES (?, ?, ?)`,
        [requestId, item.questionId, item.answer],
      );
    }

    await connection.execute(
      `UPDATE feedback_requests
       SET status = 'submitted'
       WHERE id = ?`,
      [requestId],
    );
    await writeFeedbackAuditEvent({ requestId, actorId: giverId, eventType: "feedback_submitted", connection });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const feedbackRequest = await getFeedbackRequestById(requestId);
  const recipients = [...new Set([feedbackRequest.requesterId, feedbackRequest.receiverId])]
    .filter((userId) => userId !== giverId);
  await Promise.all(recipients.map((userId) => createInAppNotification({
    userId,
    requestId: feedbackRequest.id,
    type: "feedback_submitted",
    title: "Feedback received",
    message: `${feedbackRequest.giverName} submitted ${feedbackRequest.templateName}.`,
  })));

  try {
    const notification =
      await sendFeedbackSubmittedNotification(feedbackRequest);
    return { ...feedbackRequest, notification };
  } catch (error) {
    console.error("Mattermost notification failed:", error.message);
    return {
      ...feedbackRequest,
      notification: { sent: false, reason: "Mattermost notification failed" },
    };
  }
}
