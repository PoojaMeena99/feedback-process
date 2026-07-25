import { ServiceError } from "../services/serviceError.js";

export function respondWithError(res, error) {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}
