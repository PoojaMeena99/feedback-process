import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import healthRouter from "./routes/healthRoutes.js";
import authRouter from "./routes/authRoutes.js";
import feedbackRequestRouter from "./routes/feedbackRequestRoutes.js";
import templateRouter from "./routes/templateRoutes.js";
import userRouter from "./routes/userRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import feedbackReportRouter from "./routes/feedbackReportRoutes.js";
import { startFeedbackReminderJob } from "./jobs/feedbackReminderJob.js";
import { getDatabasePool } from "./db/connection.js";

const app = express();
const port = process.env.PORT || 5000;
// Allow the local Next.js dev server even if it automatically uses 3001/3002
// because another development server is already running. Production should set
// FRONTEND_ORIGIN to its exact deployed URL.
const localDevelopmentOrigins = Array.from(
  { length: 11 },
  (_, index) => `http://localhost:${3000 + index}`,
);
const configuredOrigins = [
  ...localDevelopmentOrigins,
  ...(process.env.FRONTEND_ORIGIN || "").split(","),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("This frontend origin is not allowed by CORS."));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/notifications", notificationRouter);
app.use("/feedback-reports", feedbackReportRouter);
app.use("/templates", templateRouter);
app.use("/feedback-requests", feedbackRequestRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function startServer() {
  // Keep the password-reuse safeguard available for both new and existing databases.
  await getDatabasePool().execute(
    `CREATE TABLE IF NOT EXISTS password_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_history_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
  );

  app.listen(port, () => {
    console.log(`Feedback Process API running at http://localhost:${port}`);
    startFeedbackReminderJob();
  });
}

startServer().catch((error) => {
  console.error("Feedback Process API could not start:", error);
  process.exitCode = 1;
});
