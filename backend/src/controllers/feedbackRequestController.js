import { submitFeedbackAnswers as saveFeedbackAnswers } from "../services/feedbackAnswerService.js";
import {
  createFeedbackRequest as createFeedbackRequestInDatabase,
  getFeedbackRequestById as getFeedbackRequestByIdFromDatabase,
  getRequestsForGiver as getRequestsForGiverFromDatabase,
  getRequestsForReceiver as getRequestsForReceiverFromDatabase,
  getRequestsForRequester as getRequestsForRequesterFromDatabase,
  getRequestsVisibleTo as getRequestsVisibleToFromDatabase,
  performFeedbackRequestAction as performFeedbackRequestActionInDatabase,
  createFollowUp as createFollowUpInDatabase,
  createFeedbackDiscussion as createFeedbackDiscussionInDatabase,
  updateFollowUp as updateFollowUpInDatabase,
  updateFeedbackRequestDueDate as updateFeedbackRequestDueDateInDatabase,
} from "../services/feedbackRequestService.js";
import { respondWithError } from "./respondWithError.js";
import {
  createFeedbackSchedule as createFeedbackScheduleInDatabase,
  getFeedbackSchedules as getFeedbackSchedulesFromDatabase,
  updateFeedbackScheduleStatus as updateFeedbackScheduleStatusInDatabase,
} from "../services/feedbackScheduleService.js";

const allowedActions = ["start", "decline", "cancel", "acknowledge", "close"];

function parsePositiveInteger(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export async function createFeedbackRequest(req, res) {
  const requesterId = req.auth.user.id;
  const giverId = parsePositiveInteger(req.body.giverId);
  const receiverId = parsePositiveInteger(req.body.receiverId);
  const templateId = parsePositiveInteger(req.body.templateId);
  const { message, dueDate, purpose, visibility, viewerIds } = req.body;

  if (!giverId || !receiverId || !templateId) {
    return res.status(400).json({
      message: "giverId, receiverId and templateId must be positive integers",
    });
  }

  try {
    const feedbackRequest = await createFeedbackRequestInDatabase({
      requesterId,
      giverId,
      receiverId,
      templateId,
      message,
      dueDate,
      purpose,
      visibility,
      viewerIds,
    });

    return res.status(201).json({
      message: "Feedback request created",
      feedbackRequest,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function createFeedbackSchedule(req, res) {
  try {
    const schedule = await createFeedbackScheduleInDatabase(req.body, req.auth.user.id);
    return res.status(201).json({ message: "Recurring feedback schedule saved", schedule });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getFeedbackSchedules(req, res) {
  try {
    const schedules = await getFeedbackSchedulesFromDatabase(req.auth.user.id);
    return res.status(200).json({ schedules });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function updateFeedbackScheduleStatus(req, res) {
  const scheduleId = parsePositiveInteger(req.params.scheduleId);
  if (!scheduleId) return res.status(400).json({ message: "Schedule ID must be a positive integer" });
  try {
    const schedule = await updateFeedbackScheduleStatusInDatabase(scheduleId, req.auth.user.id, req.body.isActive);
    return res.status(200).json({ message: "Recurring feedback schedule updated", schedule });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getRequestsForReceiver(req, res) {
  const receiverId = parsePositiveInteger(req.params.userId);
  if (!receiverId) return res.status(400).json({ message: "User ID must be a positive integer" });
  if (receiverId !== req.auth.user.id) return res.status(403).json({ message: "You can only view feedback requests received by you" });
  try {
    const feedbackRequests = await getRequestsForReceiverFromDatabase(receiverId);
    return res.status(200).json({ feedbackRequests });
  } catch (error) { return respondWithError(res, error); }
}

export async function getRequestsForGiver(req, res) {
  const giverId = parsePositiveInteger(req.params.userId);

  if (!giverId) {
    return res.status(400).json({
      message: "User ID must be a positive integer",
    });
  }

  if (giverId !== req.auth.user.id) {
    return res.status(403).json({ message: "You can only view feedback requests assigned to you" });
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

  if (requesterId !== req.auth.user.id) {
    return res.status(403).json({ message: "You can only view feedback requests created by you" });
  }

  try {
    const feedbackRequests =
      await getRequestsForRequesterFromDatabase(requesterId);
    return res.status(200).json({ feedbackRequests });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getRequestsVisibleTo(req, res) {
  const viewerId = parsePositiveInteger(req.params.userId);
  if (!viewerId) return res.status(400).json({ message: "User ID must be a positive integer" });
  if (viewerId !== req.auth.user.id) return res.status(403).json({ message: "You can only view requests shared with you" });
  try {
    const feedbackRequests = await getRequestsVisibleToFromDatabase(viewerId);
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

    const hasViewerAccess = feedbackRequest.viewers.some((viewer) => viewer.userId === req.auth.user.id);
    if (feedbackRequest.requesterId !== req.auth.user.id && feedbackRequest.giverId !== req.auth.user.id && feedbackRequest.receiverId !== req.auth.user.id && !hasViewerAccess) {
      return res.status(403).json({ message: "You do not have access to this feedback request" });
    }
    return res.status(200).json({ feedbackRequest });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function submitFeedbackAnswers(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const { answers } = req.body;

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID must be a positive integer",
    });
  }

  try {
    const feedbackRequest = await saveFeedbackAnswers(
      requestId,
      req.auth.user.id,
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

export async function updateFeedbackRequestDueDate(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const { dueDate } = req.body;

  if (!requestId) {
    return res.status(400).json({ message: "Request ID must be a positive integer" });
  }

  try {
    const feedbackRequest = await updateFeedbackRequestDueDateInDatabase(
      requestId,
      req.auth.user.id,
      dueDate,
    );
    return res.status(200).json({ message: "Due date updated", feedbackRequest });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function createFollowUp(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const ownerId = parsePositiveInteger(req.body.ownerId);
  const { details, dueDate } = req.body;
  if (!requestId || !ownerId) return res.status(400).json({ message: "Request ID and owner ID must be positive integers" });
  try {
    const followUp = await createFollowUpInDatabase({ requestId, actorId: req.auth.user.id, details, ownerId, dueDate });
    return res.status(201).json({ message: "Follow-up created", followUp });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function createFeedbackDiscussion(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const { type, message, parentId } = req.body;
  const normalizedParentId = parentId === undefined || parentId === null || parentId === "" ? null : parsePositiveInteger(parentId);
  if (!requestId) return res.status(400).json({ message: "Request ID must be a positive integer" });
  if (parentId !== undefined && parentId !== null && parentId !== "" && !normalizedParentId) {
    return res.status(400).json({ message: "parentId must be a positive integer" });
  }
  try {
    const feedbackRequest = await createFeedbackDiscussionInDatabase({
      requestId,
      actorId: req.auth.user.id,
      type,
      message,
      parentId: normalizedParentId,
    });
    return res.status(201).json({ message: "Feedback discussion saved", feedbackRequest });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function updateFollowUp(req, res) {
  const followUpId = parsePositiveInteger(req.params.followUpId);
  const { status, progressNote } = req.body;
  if (!followUpId) return res.status(400).json({ message: "Follow-up ID must be a positive integer" });
  try {
    const followUp = await updateFollowUpInDatabase({ followUpId, actorId: req.auth.user.id, status, progressNote });
    return res.status(200).json({ message: "Follow-up updated", followUp });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function performFeedbackRequestAction(req, res) {
  const requestId = parsePositiveInteger(req.params.id);
  const { action, acknowledgementComment, declineReason, alternateGiverId: submittedAlternateGiverId } = req.body;
  const alternateGiverId = submittedAlternateGiverId === undefined || submittedAlternateGiverId === null || submittedAlternateGiverId === ""
    ? null
    : parsePositiveInteger(submittedAlternateGiverId);

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID must be a positive integer",
    });
  }

  if (!allowedActions.includes(action)) {
    return res.status(400).json({
      message: "action must be start, decline, cancel, acknowledge, or close",
    });
  }

  if (submittedAlternateGiverId !== undefined && submittedAlternateGiverId !== null && submittedAlternateGiverId !== "" && !alternateGiverId) {
    return res.status(400).json({ message: "alternateGiverId must be a positive integer" });
  }

  if (acknowledgementComment !== undefined && typeof acknowledgementComment !== "string") {
    return res.status(400).json({ message: "acknowledgementComment must be text" });
  }

  if (acknowledgementComment && acknowledgementComment.trim().length > 500) {
    return res.status(400).json({ message: "Acknowledgement comment must be 500 characters or less" });
  }

  if (declineReason !== undefined && typeof declineReason !== "string") {
    return res.status(400).json({ message: "Decline reason must be text" });
  }

  if (action === "decline" && declineReason?.trim().length < 3) {
    return res.status(400).json({ message: "Please provide a decline reason of at least 3 characters" });
  }

  if (declineReason && declineReason.trim().length > 500) {
    return res.status(400).json({ message: "Decline reason must be 500 characters or less" });
  }

  try {
    const feedbackRequest = await performFeedbackRequestActionInDatabase(
      requestId,
      req.auth.user.id,
      action,
      acknowledgementComment?.trim() || null,
      declineReason?.trim() || null,
      alternateGiverId,
    );

    return res.status(200).json({
      message: `Feedback request ${action}d`,
      feedbackRequest,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}
