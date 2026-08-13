import { Router } from "express";

import {
  createFeedbackRequest,
  createFollowUp,
  getFeedbackRequestById,
  getRequestsForGiver,
  getRequestsForRequester,
  performFeedbackRequestAction,
  submitFeedbackAnswers,
  updateFeedbackRequestDueDate,
  updateFollowUp,
} from "../controllers/feedbackRequestController.js";
import { requireAuth } from "../controllers/authController.js";

const router = Router();

// Feedback data is private, so every request needs a valid login session.
router.use(requireAuth);

router.post("/", createFeedbackRequest);
router.get("/giver/:userId", getRequestsForGiver);
router.get("/requester/:userId", getRequestsForRequester);
router.get("/:id", getFeedbackRequestById);
router.patch("/:id/due-date", updateFeedbackRequestDueDate);
router.post("/:id/follow-ups", createFollowUp);
router.patch("/:id/follow-ups/:followUpId", updateFollowUp);
router.post("/:id/answers", submitFeedbackAnswers);
router.post("/:id/actions", performFeedbackRequestAction);

export default router;
