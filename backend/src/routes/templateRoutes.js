import { createTemplate, getTemplateQuestions, getTemplates, getTemplatesForManagement, setTemplateActive, updateTemplate } from "../controllers/templateController.js";
import { Router } from "express";
import { requireAuth } from "../controllers/authController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getTemplates);
router.post("/", createTemplate);
router.get("/manage", getTemplatesForManagement);
router.patch("/:id", updateTemplate);
router.patch("/:id/status", setTemplateActive);
router.get("/:id/questions", getTemplateQuestions);

export default router;
