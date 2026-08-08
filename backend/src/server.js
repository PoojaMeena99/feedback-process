import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import healthRouter from "./routes/healthRoutes.js";
import authRouter from "./routes/authRoutes.js";
import feedbackRequestRouter from "./routes/feedbackRequestRoutes.js";
import templateRouter from "./routes/templateRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/templates", templateRouter);
app.use("/feedback-requests", feedbackRequestRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(port, () => {
  console.log(`Feedback Process API running at http://localhost:${port}`);
});
