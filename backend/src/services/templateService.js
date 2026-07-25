import { getDatabasePool } from "../db/connection.js";
import { ServiceError } from "./serviceError.js";

export async function getAllTemplates() {
  const pool = getDatabasePool();
  const [templates] = await pool.query(
    `SELECT id, name, description, created_at AS createdAt
     FROM feedback_templates
     ORDER BY id`,
  );

  return templates;
}

export async function getTemplateQuestions(templateId) {
  const pool = getDatabasePool();
  const [[template]] = await pool.execute(
    `SELECT id, name
     FROM feedback_templates
     WHERE id = ?`,
    [templateId],
  );

  if (!template) {
    throw new ServiceError(404, "Feedback template not found");
  }

  const [questions] = await pool.execute(
    `SELECT id, question_text AS questionText, question_order AS questionOrder
     FROM template_questions
     WHERE template_id = ?
     ORDER BY question_order, id`,
    [templateId],
  );

  return {
    templateId: template.id,
    templateName: template.name,
    questions,
  };
}

