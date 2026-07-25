// Temporary data: the integration owner will replace this with MySQL queries.
const templates = [
  {
    id: 1,
    name: "Learning Feedback",
    questions: [
      "What did this person learn well?",
      "Where can they improve?",
      "Share one specific example.",
      "What should be their next learning step?",
    ],
  },
  {
    id: 2,
    name: "Project Completion Feedback",
    questions: [
      "What went well in the project?",
      "What could be improved next time?",
      "How was this person's ownership or contribution?",
      "What is one suggested action for the next project?",
    ],
  },
];

export function getTemplates(_req, res) {
  const templateList = templates.map(({ questions, ...template }) => template);
  res.status(200).json({ templates: templateList });
}

export function getTemplateQuestions(req, res) {
  const templateId = Number(req.params.id);
  const template = templates.find((item) => item.id === templateId);

  if (!template) {
    return res.status(404).json({ message: "Feedback template not found" });
  }

  return res.status(200).json({
    templateId: template.id,
    templateName: template.name,
    questions: template.questions,
  });
}
