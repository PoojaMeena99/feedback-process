import { getAllUsers } from "../services/userService.js";
import { respondWithError } from "./respondWithError.js";

export async function getUsers(_req, res) {
  try {
    const users = await getAllUsers();
    return res.status(200).json({ users });
  } catch (error) {
    return respondWithError(res, error);
  }
}

