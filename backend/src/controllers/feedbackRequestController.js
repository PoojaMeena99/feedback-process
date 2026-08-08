import { submitFeedbackAnswers as saveFeedbackAnswers } from "../services/feedbackAnswerService.js";
import {
  createFeedbackRequest as createFeedbackRequestInDatabase,
  getFeedbackRequestById as getFeedbackRequestByIdFromDatabase,
  getRequestsForGiver as getRequestsForGiverFromDatabase,
  getRequestsForRequester as getRequestsForRequesterFromDatabase,
  updateFeedbackRequestStatus as updateFeedbackRequestStatusInDatabase,
} from "../services/feedbackRequestService.js";
import { respondWithError } from "./respondWithError.js";

const allowedStatuses = ["requested", "submitted", "closed"];

function parsePositiveInteger(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export async function createFeedbackRequest(req, res) {
  const requesterId = parsePositiveInteger(req.body.requesterId);
  const giverId = parsePositiveInteger(req.body.giverId);
  const templateId = parsePositiveInteger(req.body.templateId);
  const { message } = req.body;

  if (!requesterId || !giverId || !templateId) {
    return res.status(400).json({
      message: "requesterId, giverId, and templateId must be positive integers",
    });
  }

  try {
    const feedbackRequest = await createFeedbackRequestInDatabase({
      requesterId,
      giverId,
      templateId,
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
  const { status } = req.body;

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID must be a positive integer",
    });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "status must be requested, submitted, or closed",
    });
  }

  try {
    const feedbackRequest = await updateFeedbackRequestStatusInDatabase(
      requestId,
      status,
    );

    return res.status(200).json({
      message: "Feedback request status updated",
      feedbackRequest,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}
