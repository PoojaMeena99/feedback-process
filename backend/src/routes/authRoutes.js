import { Router } from "express";

import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  register,
  requireAuth,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, getCurrentUser);
router.post("/logout", requireAuth, logout);

export default router;
