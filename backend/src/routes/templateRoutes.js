import { createTemplate, getTemplateQuestions, getTemplates } from "../controllers/templateController.js";
import { Router } from "express";
import { requireAuth } from "../controllers/authController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getTemplates);
router.post("/", createTemplate);
router.get("/:id/questions", getTemplateQuestions);

export default router;
