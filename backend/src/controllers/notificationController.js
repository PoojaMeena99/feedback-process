import { respondWithError } from "./respondWithError.js";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService.js";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listNotifications(req, res) {
  try {
    const notifications = await getNotifications(req.auth.user.id);
    return res.status(200).json({ notifications });
  } catch (error) { return respondWithError(res, error); }
}

export async function readNotification(req, res) {
  const notificationId = parseId(req.params.id);
  if (!notificationId) return res.status(400).json({ message: "Notification ID must be a positive integer" });
  try {
    await markNotificationRead(notificationId, req.auth.user.id);
    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) { return respondWithError(res, error); }
}

export async function readAllNotifications(req, res) {
  try {
    await markAllNotificationsRead(req.auth.user.id);
    return res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) { return respondWithError(res, error); }
}
