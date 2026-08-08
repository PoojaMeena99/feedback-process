import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { getDatabasePool } from "../db/connection.js";
import { ServiceError } from "./serviceError.js";

const tokenLifetime = "7d";
const tokenLifetimeMilliseconds = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ServiceError(500, "JWT_SECRET is not configured on the server");
  }

  return process.env.JWT_SECRET;
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function validateRegistration({ name, email, password }) {
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new ServiceError(400, "name must contain at least 2 characters");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ServiceError(400, "email must be valid");
  }

  if (typeof password !== "string" || password.length < 8) {
    throw new ServiceError(400, "password must contain at least 8 characters");
  }
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function createSession(connection, user) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + tokenLifetimeMilliseconds);

  await connection.execute(
    `INSERT INTO auth_sessions (id, user_id, expires_at)
     VALUES (?, ?, ?)`,
    [sessionId, user.id, expiresAt],
  );

  const token = jwt.sign(
    { sub: String(user.id), jti: sessionId },
    getJwtSecret(),
    { expiresIn: tokenLifetime },
  );

  return { token, expiresAt };
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  validateRegistration({ name, email: normalizedEmail, password });

  const passwordHash = await bcrypt.hash(password, 12);
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[existingUser]] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail],
    );

    if (existingUser) {
      throw new ServiceError(409, "An account with this email already exists");
    }

    const [result] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'member')`,
      [name.trim(), normalizedEmail, passwordHash],
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: "member",
    };
    await connection.commit();

    return user;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || typeof password !== "string") {
    throw new ServiceError(400, "email and password are required");
  }
  getJwtSecret();

  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    const [[user]] = await connection.execute(
      `SELECT id, name, email, role, password_hash AS passwordHash
       FROM users
       WHERE email = ?`,
      [normalizedEmail],
    );

    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ServiceError(401, "Email or password is incorrect");
    }

    await connection.beginTransaction();
    const session = await createSession(connection, user);
    await connection.commit();

    return { user: publicUser(user), ...session };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function authenticateToken(token) {
  if (!token) {
    throw new ServiceError(401, "You must be logged in");
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    throw new ServiceError(401, "Token is invalid or expired");
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || !payload.jti) {
    throw new ServiceError(401, "Token is invalid");
  }

  const pool = getDatabasePool();
  const [[session]] = await pool.execute(
    `SELECT user.id, user.name, user.email, user.role, session.id AS sessionId
     FROM auth_sessions AS session
     JOIN users AS user ON user.id = session.user_id
     WHERE session.id = ?
       AND session.user_id = ?
       AND session.revoked_at IS NULL
       AND session.expires_at > NOW()`,
    [payload.jti, userId],
  );

  if (!session) {
    throw new ServiceError(401, "Your session is no longer active");
  }

  return { user: publicUser(session), sessionId: session.sessionId };
}

export async function logoutUser(sessionId) {
  const pool = getDatabasePool();
  await pool.execute(
    "UPDATE auth_sessions SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL",
    [sessionId],
  );
}
