import { Router } from "express";
import { requireAuth } from "../controllers/authController.js";
import { listNotifications, readAllNotifications, readNotification } from "../controllers/notificationController.js";

const router = Router();
router.use(requireAuth);
router.get("/", listNotifications);
router.patch("/read-all", readAllNotifications);
router.patch("/:id/read", readNotification);

export default router;
