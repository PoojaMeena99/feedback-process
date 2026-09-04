import {
  authenticateToken,
  createPasswordResetRequest,
  loginUser,
  logoutUser,
  registerUser,
  resetUserPassword,
  verifyEmail,
} from "../services/authService.js";
import { respondWithError } from "./respondWithError.js";

const accessTokenCookieName = "feedback_access_token";
const tokenLifetimeMilliseconds = 7 * 24 * 60 * 60 * 1000;

function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tokenLifetimeMilliseconds,
    path: "/",
  };
}

function clearAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json({
      message: "Account created",
      user,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    res.cookie(
      accessTokenCookieName,
      result.token,
      accessTokenCookieOptions(),
    );
    return res.status(200).json({
      message: "Login successful",
      user: result.user,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function forgotPassword(req, res) {
  try {
    await createPasswordResetRequest(req.body);
    return res.status(200).json({
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function resetPassword(req, res) {
  try {
    await resetUserPassword(req.body);
    return res.status(200).json({
      message: "Password reset successful. Please log in with your new password.",
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function verifyEmailAddress(req, res) {
  try {
    await verifyEmail(req.body);
    return res.status(200).json({ message: "Email verified. You can now log in." });
  } catch (error) { return respondWithError(res, error); }
}

export async function requireAuth(req, res, next) {
  try {
    req.auth = await authenticateToken(req.cookies[accessTokenCookieName]);
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
    res.clearCookie(accessTokenCookieName, clearAccessTokenCookieOptions());
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return respondWithError(res, error);
  }
}
