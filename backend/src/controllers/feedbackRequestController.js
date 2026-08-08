import { submitFeedbackAnswers as saveFeedbackAnswers } from "../services/feedbackAnswerService.js";
import {
  applyFeedbackRequestAction,
  createFeedbackRequest as createFeedbackRequestInDatabase,
  getFeedbackRequestById as getFeedbackRequestByIdFromDatabase,
  getRequestsForGiver as getRequestsForGiverFromDatabase,
  getRequestsForRequester as getRequestsForRequesterFromDatabase,
} from "../services/feedbackRequestService.js";
import { respondWithError } from "./respondWithError.js";

const statusActions = {
  acknowledged: "acknowledge",
  cancelled: "cancel",
  closed: "close",
  declined: "decline",
};

function parsePositiveInteger(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function isValidDateString(value) {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function createFeedbackRequest(req, res) {
  const requesterId = parsePositiveInteger(req.body.requesterId);
  const giverId = parsePositiveInteger(req.body.giverId);
  const templateId = parsePositiveInteger(req.body.templateId);
  const { dueDate, message } = req.body;

  if (!requesterId || !giverId || !templateId) {
    return res.status(400).json({
      message: "requesterId, giverId, and templateId must be positive integers",
    });
  }

  if (!isValidDateString(dueDate)) {
    return res.status(400).json({
      message: "dueDate must use YYYY-MM-DD format",
    });
  }

  try {
    const feedbackRequest = await createFeedbackRequestInDatabase({
      requesterId,
      giverId,
      templateId,
      dueDate,
      message,
    });

    return res.status(201).json({
      message: "Feedback request created",
      feedbackRequest,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getRequestsForGiver(req, res) {
  const giverId = parsePositiveInteger(req.params.userId);

  if (!giverId) {
    return res.status(400).json({
      message: "User ID must be a positive integer",
    });
  }

  try {
    const feedbackRequests = await getRequestsForGiverFromDatabase(giverId);
    return res.status(200).json({ feedbackRequests });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getRequestsForRequester(req, res) {
  const requesterId = parsePositiveInteger(req.params.userId);

  if (!requesterId) {
    return res.status(400).json({
      message: "User ID must be a positive integer",
    });
  }

  try {
    const feedbackRequests =
      await getRequestsForRequesterFromDatabase(requesterId);
    return res.status(200).json({ feedbackRequests });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getFeedbackRequestById(req, res) {
  const requestId = parsePositiveInteger(req.params.id);

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID must be a positive integer",
    });
  }

  try {
    const feedbackRequest =
      await getFeedbackRequestByIdFromDatabase(requestId);
    return res.status(200).json({ feedbackRequest });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function submitFeedbackAnswers(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const giverId = parsePositiveInteger(req.body.giverId);
  const { answers } = req.body;

  if (!requestId || !giverId) {
    return res.status(400).json({
      message: "Request ID and giverId must be positive integers",
    });
  }

  try {
    const feedbackRequest = await saveFeedbackAnswers(
      requestId,
      giverId,
      answers,
    );

    return res.status(200).json({
      message: "Feedback submitted",
      feedbackRequest,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function updateFeedbackRequestStatus(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const actorId = parsePositiveInteger(req.body.actorId);
  const { status } = req.body;

  if (!requestId || !actorId) {
    return res.status(400).json({
      message: "Request ID and actorId must be positive integers",
    });
  }

  const action = statusActions[status];

  if (!action) {
    return res.status(400).json({
      message:
        "status must be acknowledged, closed, declined, or cancelled. Use submit answers for submitted status.",
    });
  }

  try {
    const feedbackRequest = await applyFeedbackRequestAction(
      requestId,
      actorId,
      action,
    );

    return res.status(200).json({
      message: "Feedback request status updated",
      feedbackRequest,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function runFeedbackRequestAction(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const actorId = parsePositiveInteger(req.body.actorId);
  const { action } = req.params;

  if (!requestId || !actorId) {
    return res.status(400).json({
      message: "Request ID and actorId must be positive integers",
    });
  }

  try {
    const feedbackRequest = await applyFeedbackRequestAction(
      requestId,
      actorId,
      action,
    );

    return res.status(200).json({
      message: `Feedback request ${action} completed`,
      feedbackRequest,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}
