import { getDatabasePool } from "../db/connection.js";
import { ServiceError } from "./serviceError.js";

export async function createInAppNotification({ userId, requestId = null, type, title, message }) {
  const pool = getDatabasePool();
  await pool.execute(
    `INSERT INTO user_notifications (user_id, request_id, type, title, message)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, requestId, type, title, message],
  );
}

export async function getNotifications(userId) {
  const pool = getDatabasePool();
  const [notifications] = await pool.execute(
    `SELECT id, request_id AS requestId, type, title, message,
       is_read AS isRead, created_at AS createdAt
     FROM user_notifications
     WHERE user_id = ?
     ORDER BY is_read ASC, created_at DESC, id DESC
     LIMIT 30`,
    [userId],
  );
  return notifications;
}

export async function markNotificationRead(notificationId, userId) {
  const pool = getDatabasePool();
  const [result] = await pool.execute(
    "UPDATE user_notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
    [notificationId, userId],
  );
  if (!result.affectedRows) throw new ServiceError(404, "Notification not found");
}

export async function markAllNotificationsRead(userId) {
  const pool = getDatabasePool();
  await pool.execute("UPDATE user_notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE", [userId]);
}
