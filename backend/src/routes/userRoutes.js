import { Router } from "express";

import { getUsers, updateUserStatus } from "../controllers/userController.js";
import { requireAuth } from "../controllers/authController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getUsers);
router.patch("/:id/status", updateUserStatus);

export default router;
