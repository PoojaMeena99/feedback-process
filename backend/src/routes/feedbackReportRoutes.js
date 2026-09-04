import { Router } from "express";
import { requireAuth } from "../controllers/authController.js";
import { listFeedbackReports, reviewReport } from "../controllers/feedbackReportController.js";

const router = Router();
router.use(requireAuth);
router.get("/", listFeedbackReports);
router.patch("/:id", reviewReport);

export default router;
