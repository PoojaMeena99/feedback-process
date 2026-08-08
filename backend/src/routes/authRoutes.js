import { Router } from "express";

import {
  getCurrentUser,
  login,
  logout,
  register,
  requireAuth,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);
router.post("/logout", requireAuth, logout);

export default router;
