import { Router } from "express";

import { createTemplate, getTemplateQuestions, getTemplates } from "../controllers/templateController.js";

const router = Router();

router.get("/", getTemplates);
router.post("/", createTemplate);
router.get("/:id/questions", getTemplateQuestions);

export default router;
