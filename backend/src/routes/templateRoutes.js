import { Router } from "express";

import { getTemplateQuestions, getTemplates } from "../controllers/templateController.js";
import { requireAuth } from "../controllers/authController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getTemplates);
router.get("/:id/questions", getTemplateQuestions);

export default router;
