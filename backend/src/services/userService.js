import { getDatabasePool } from "../db/connection.js";

export async function getAllUsers() {
  const pool = getDatabasePool();
  const [users] = await pool.query(
    `SELECT id, name, email, role, created_at AS createdAt
     FROM users
     ORDER BY id`,
  );

  return users;
}

