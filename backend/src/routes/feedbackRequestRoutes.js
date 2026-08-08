import { Router } from "express";

import {
  createFeedbackRequest,
  getFeedbackRequestById,
  getRequestsForGiver,
  getRequestsForRequester,
  performFeedbackRequestAction,
  submitFeedbackAnswers,
} from "../controllers/feedbackRequestController.js";

const router = Router();

router.post("/", createFeedbackRequest);
router.get("/giver/:userId", getRequestsForGiver);
router.get("/requester/:userId", getRequestsForRequester);
router.get("/:id", getFeedbackRequestById);
router.post("/:id/answers", submitFeedbackAnswers);
router.post("/:id/actions", performFeedbackRequestAction);

export default router;
