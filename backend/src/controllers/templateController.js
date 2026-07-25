import {
  getAllTemplates,
  getTemplateQuestions as getTemplateQuestionsFromDatabase,
} from "../services/templateService.js";
import { respondWithError } from "./respondWithError.js";

export async function getTemplates(_req, res) {
  try {
    const templates = await getAllTemplates();
    return res.status(200).json({ templates });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getTemplateQuestions(req, res) {
  const templateId = Number(req.params.id);

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return res.status(400).json({
      message: "Template ID must be a positive integer",
    });
  }

  try {
    const template = await getTemplateQuestionsFromDatabase(templateId);
    return res.status(200).json(template);
  } catch (error) {
    return respondWithError(res, error);
  }
}

