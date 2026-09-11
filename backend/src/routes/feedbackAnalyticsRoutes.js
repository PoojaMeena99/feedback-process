import { Router } from "express";
import { requireAuth } from "../controllers/authController.js";
import { getFeedbackAnalytics } from "../controllers/feedbackAnalyticsController.js";

const router = Router();
router.use(requireAuth);
router.get("/", getFeedbackAnalytics);
export default router;
