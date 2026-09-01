import { sendScheduledFeedbackReminders } from "../services/feedbackRequestService.js";

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

async function runReminderCheck() {
  try {
    const result = await sendScheduledFeedbackReminders();
    if (result.dueSoon || result.overdue) {
      console.log(`Feedback reminders sent — due soon: ${result.dueSoon}, overdue: ${result.overdue}`);
    }
  } catch (error) {
    console.error("Feedback reminder check failed:", error.message);
  }
}

// The database log prevents duplicate alerts, so checking on API start and
// every hour is safe in development and in a long-running production server.
export function startFeedbackReminderJob() {
  void runReminderCheck();
  return setInterval(() => void runReminderCheck(), HOUR_IN_MILLISECONDS);
}
