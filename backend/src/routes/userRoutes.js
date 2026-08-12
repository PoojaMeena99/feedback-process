import { Router } from "express";

import { getUsers } from "../controllers/userController.js";
import { requireAuth } from "../controllers/authController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getUsers);

export default router;
