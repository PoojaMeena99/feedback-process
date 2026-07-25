const feedbackRequests = [];

const allowedStatuses = ["requested", "submitted", "closed"];

export function createFeedbackRequest(req, res) {
  const { requesterId, giverId, templateId, message, dueDate } = req.body;

  if (!requesterId || !giverId || !templateId) {
    return res.status(400).json({
      message: "requesterId, giverId, and templateId are required",
    });
  }

  if (requesterId === giverId) {
    return res.status(400).json({
      message: "You cannot request feedback from yourself",
    });
  }

  const newRequest = {
    id: feedbackRequests.length + 1,
    requesterId,
    giverId,
    templateId,
    message: message || "",
    dueDate: dueDate || null,
    status: "requested",
    answers: [],
  };

  feedbackRequests.push(newRequest);

  return res.status(201).json({
    message: "Feedback request created",
    feedbackRequest: newRequest,
  });
}

export function getRequestsForGiver(req, res) {
  const giverId = Number(req.params.userId);
  const requests = feedbackRequests.filter((request) => request.giverId === giverId);

  return res.status(200).json({ feedbackRequests: requests });
}

export function getRequestsForRequester(req, res) {
  const requesterId = Number(req.params.userId);
  const requests = feedbackRequests.filter((request) => request.requesterId === requesterId);

  return res.status(200).json({ feedbackRequests: requests });
}

export function getFeedbackRequestById(req, res) {
  const requestId = Number(req.params.id);
  const feedbackRequest = feedbackRequests.find((request) => request.id === requestId);

  if (!feedbackRequest) {
    return res.status(404).json({ message: "Feedback request not found" });
  }

  return res.status(200).json({ feedbackRequest });
}

export function submitFeedbackAnswers(req, res) {
  const requestId = Number(req.params.id);
  const { giverId, answers } = req.body;
  const feedbackRequest = feedbackRequests.find((request) => request.id === requestId);

  if (!feedbackRequest) {
    return res.status(404).json({ message: "Feedback request not found" });
  }

  if (Number(giverId) !== feedbackRequest.giverId) {
    return res.status(403).json({ message: "Only the selected feedback giver can submit answers" });
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: "answers must be a non-empty array" });
  }

  feedbackRequest.answers = answers;
  feedbackRequest.status = "submitted";

  return res.status(200).json({
    message: "Feedback submitted",
    feedbackRequest,
  });
}

export function updateFeedbackRequestStatus(req, res) {
  const requestId = Number(req.params.id);
  const { status } = req.body;
  const feedbackRequest = feedbackRequests.find((request) => request.id === requestId);

  if (!feedbackRequest) {
    return res.status(404).json({ message: "Feedback request not found" });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "status must be requested, submitted, or closed",
    });
  }

  feedbackRequest.status = status;

  return res.status(200).json({
    message: "Feedback request status updated",
    feedbackRequest,
  });
}
