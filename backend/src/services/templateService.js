import { getDatabasePool } from "../db/connection.js";
import { ServiceError } from "./serviceError.js";

export async function getAllTemplates() {
  const pool = getDatabasePool();
  const [templates] = await pool.query(
    `SELECT id, name, description, created_at AS createdAt
     FROM feedback_templates
     WHERE is_active = TRUE
     ORDER BY id`,
  );

  return templates;
}

function normalizeTemplateQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new ServiceError(400, "questions must be an array");
  }

  const normalizedQuestions = questions
    .map((question) => String(question || "").trim())
    .filter(Boolean);

  if (normalizedQuestions.length < 1) {
    throw new ServiceError(400, "At least one template question is required");
  }

  if (normalizedQuestions.length > 10) {
    throw new ServiceError(400, "A template can have maximum 10 questions");
  }

  return normalizedQuestions;
}

export async function createTemplate({ name, description, questions }) {
  const templateName = String(name || "").trim();
  const templateDescription = String(description || "").trim() || null;
  const normalizedQuestions = normalizeTemplateQuestions(questions);

  if (templateName.length < 3) {
    throw new ServiceError(400, "Template name must contain at least 3 characters");
  }

  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingTemplate]] = await connection.execute(
      "SELECT id FROM feedback_templates WHERE name = ?",
      [templateName],
    );

    if (existingTemplate) {
      throw new ServiceError(409, "A feedback template with this name already exists");
    }

    const [templateResult] = await connection.execute(
      `INSERT INTO feedback_templates (name, description)
       VALUES (?, ?)`,
      [templateName, templateDescription],
    );

    const templateId = templateResult.insertId;

    for (const [index, questionText] of normalizedQuestions.entries()) {
      await connection.execute(
        `INSERT INTO template_questions (template_id, question_text, question_order)
         VALUES (?, ?, ?)`,
        [templateId, questionText, index + 1],
      );
    }

    await connection.commit();

    return {
      id: templateId,
      name: templateName,
      description: templateDescription,
      questions: normalizedQuestions.map((questionText, index) => ({
        questionText,
        questionOrder: index + 1,
      })),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
