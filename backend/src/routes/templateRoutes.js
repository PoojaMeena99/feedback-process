import { Router } from "express";

import { getTemplateQuestions, getTemplates } from "../controllers/templateController.js";

const router = Router();

router.get("/", getTemplates);
router.get("/:id/questions", getTemplateQuestions);

export default router;
