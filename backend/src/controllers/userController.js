import { getAllUsers } from "../services/userService.js";
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
