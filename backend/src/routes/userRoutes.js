import { Router } from "express";

import { getUsers, updateUserRole, updateUserStatus } from "../controllers/userController.js";
import { requireAuth } from "../controllers/authController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getUsers);
router.patch("/:id/status", updateUserStatus);
router.patch("/:id/role", updateUserRole);

export default router;
