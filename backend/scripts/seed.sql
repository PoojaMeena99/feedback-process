USE feedback_process;

INSERT INTO users (name, email, password_hash, is_active) VALUES
('Rani Singh', 'ranisingh21@navgurukul.org', '$2b$10$eHi2aDoc688CFSOfXkmvtuE3hV/1Ll9wHg2eok7mXrz3lhufUcvom', TRUE),
('Shanti Singh', 'shantisingh22@navgurukul.org', '$2b$10$/2EkKZbNJ30rd3KwxrJwKeluXonTWEUQEnZkTdpr/V6aJm.ptz5GS', TRUE),
('Pooja', 'pooja@example.com', '$2b$10$5nEJ.9vLizlPYMrKEtPG7uYRG7coPMw6wEzst0r4xNM3htuBGLl6y', TRUE),
('Swari', 'rajitha@justuju', '$2b$10$kd6cwDHvdN/LnPzBarJ0d..S5h5w51DY3JcKVZyX7z5MdRT6CIl66', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  is_active = VALUES(is_active);

INSERT IGNORE INTO feedback_templates (name, description) VALUES
('Learning Feedback', 'Feedback about learning progress, understanding, and improvement areas'),
('Project Completion Feedback', 'Feedback after completing a project or task'),
('Written Feedback', 'Structured written feedback about work, behaviour, and next steps'),
('Peer Feedback', 'Feedback from a colleague about collaboration and contribution'),
('Growth Feedback', 'Feedback about professional growth, strengths, and development'),
('One-on-One Feedback', 'Feedback to support a focused one-on-one conversation'),
('Group Feedback', 'Feedback about team or group collaboration and outcomes');

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

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What work or behaviour would you like to recognise?', 1
FROM feedback_templates AS template
WHERE template.name = 'Written Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 1
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What could be improved?', 2
FROM feedback_templates AS template
WHERE template.name = 'Written Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 2
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What is one practical next step?', 3
FROM feedback_templates AS template
WHERE template.name = 'Written Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 3
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'How did the person collaborate with others?', 1
FROM feedback_templates AS template
WHERE template.name = 'Peer Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 1
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What strengths did you observe?', 2
FROM feedback_templates AS template
WHERE template.name = 'Peer Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 2
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What would improve working together next time?', 3
FROM feedback_templates AS template
WHERE template.name = 'Peer Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 3
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What progress or growth have you observed?', 1
FROM feedback_templates AS template
WHERE template.name = 'Growth Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 1
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'Which skill or area should the person focus on next?', 2
FROM feedback_templates AS template
WHERE template.name = 'Growth Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 2
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What support would help their growth?', 3
FROM feedback_templates AS template
WHERE template.name = 'Growth Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 3
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What would you like to discuss?', 1
FROM feedback_templates AS template
WHERE template.name = 'One-on-One Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 1
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What is going well?', 2
FROM feedback_templates AS template
WHERE template.name = 'One-on-One Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 2
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What support or next step would help?', 3
FROM feedback_templates AS template
WHERE template.name = 'One-on-One Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 3
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What did the group do well?', 1
FROM feedback_templates AS template
WHERE template.name = 'Group Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 1
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What challenge should the group address?', 2
FROM feedback_templates AS template
WHERE template.name = 'Group Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 2
  );

INSERT INTO template_questions (template_id, question_text, question_order)
SELECT template.id, 'What action should the group take next?', 3
FROM feedback_templates AS template
WHERE template.name = 'Group Feedback'
  AND NOT EXISTS (
    SELECT 1 FROM template_questions
    WHERE template_id = template.id AND question_order = 3
  );
