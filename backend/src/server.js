import "dotenv/config";
import cors from "cors";
import express from "express";

import healthRouter from "./routes/healthRoutes.js";
import feedbackRequestRouter from "./routes/feedbackRequestRoutes.js";
import templateRouter from "./routes/templateRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/users", userRouter);
app.use("/templates", templateRouter);
app.use("/feedback-requests", feedbackRequestRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(port, () => {
  console.log(`Feedback Process API running at http://localhost:${port}`);
});
