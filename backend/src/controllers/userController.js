import { getAllUsers, setUserActive, setUserRole } from "../services/userService.js";
import { respondWithError } from "./respondWithError.js";

export async function getUsers(req, res) {
  try {
    if (req.auth.user.role === "external") return res.status(200).json({ users: [req.auth.user] });
    const users = await getAllUsers();
    return res.status(200).json({ users });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function updateUserStatus(req, res) {
  const userId = Number(req.params.id);
  const { isActive } = req.body;
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: "User ID must be valid" });
  if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive must be true or false" });
  try {
    const user = await setUserActive({ userId, actorId: req.auth.user.id, isActive });
    return res.status(200).json({
      message: isActive ? "Account reactivated" : `Account deactivated. ${user.affectedRequestCount} open request(s) were updated.`,
      user,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function updateUserRole(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: "User ID must be valid" });
  try {
    const user = await setUserRole({ userId, actorId: req.auth.user.id, role: req.body.role });
    return res.status(200).json({ message: "User role updated", user });
  } catch (error) {
    return respondWithError(res, error);
  }
}
