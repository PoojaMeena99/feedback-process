import { Router } from "express";

import {
  createFeedbackRequest,
  getFeedbackRequestById,
  getRequestsForGiver,
  getRequestsForRequester,
  runFeedbackRequestAction,
  submitFeedbackAnswers,
  updateFeedbackRequestStatus,
} from "../controllers/feedbackRequestController.js";

const router = Router();

router.post("/", createFeedbackRequest);
router.get("/giver/:userId", getRequestsForGiver);
router.get("/requester/:userId", getRequestsForRequester);
router.get("/:id", getFeedbackRequestById);
router.post("/:id/answers", submitFeedbackAnswers);
router.patch("/:id/:action(cancel|decline|acknowledge|close)", runFeedbackRequestAction);
router.patch("/:id/status", updateFeedbackRequestStatus);

export default router;
