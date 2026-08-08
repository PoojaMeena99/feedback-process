USE feedback_process;

INSERT IGNORE INTO users (name, email) VALUES
('Rani Singh', 'ranisingh21@navgurukul.org'),
('Shanti Singh', 'shantisingh22@navgurukul.org'),
('Pooja', 'pooja@example.com'),
('Swari', 'rajitha@justuju');

INSERT IGNORE INTO feedback_templates (name, description) VALUES
('Learning Feedback', 'Feedback about learning progress, understanding, and improvement areas'),
('Project Completion Feedback', 'Feedback after completing a project or task');

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What did the person learn well?', 1
FROM feedback_templates AS template
WHERE template.name = 'Learning Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 1
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'Where can the person improve?', 2
FROM feedback_templates AS template
WHERE template.name = 'Learning Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 2
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What should the person practice next?', 3
FROM feedback_templates AS template
WHERE template.name = 'Learning Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 3
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What went well in the project?', 1
FROM feedback_templates AS template
WHERE template.name = 'Project Completion Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 1
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What challenges came during the project?', 2
FROM feedback_templates AS template
WHERE template.name = 'Project Completion Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 2
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What can be improved in the next project?', 3
FROM feedback_templates AS template
WHERE template.name = 'Project Completion Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 3
  );
