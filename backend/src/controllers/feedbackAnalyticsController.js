import { getFeedbackAnalytics as getFeedbackAnalyticsFromDatabase } from "../services/feedbackAnalyticsService.js";
import { respondWithError } from "./respondWithError.js";

export async function getFeedbackAnalytics(req, res) {
  try {
    return res.status(200).json({ analytics: await getFeedbackAnalyticsFromDatabase(req.auth.user.id) });
  } catch (error) {
    return respondWithError(res, error);
  }
}
