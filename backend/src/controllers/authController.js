import {
  authenticateToken,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService.js";
import { respondWithError } from "./respondWithError.js";

export async function register(req, res) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json({
      message: "Account created",
      ...result,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json({ message: "Login successful", ...result });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function requireAuth(req, res, next) {
  try {
    req.auth = await authenticateToken(req.headers.authorization);
    return next();
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getCurrentUser(req, res) {
  return res.status(200).json({ user: req.auth.user });
}

export async function logout(req, res) {
  try {
    await logoutUser(req.auth.sessionId);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return respondWithError(res, error);
  }
}
