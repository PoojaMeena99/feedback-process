USE feedback_process;

INSERT IGNORE INTO users (name, email) VALUES
('Rani Singh', 'ranisingh21@navgurukul.org'),
('Shanti Singh', 'shantisingh22@navgurukul.org'),
('Pooja', 'pooja@example.com');

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

INSERT INTO feedback_requests
(requester_id, giver_id, template_id, message, status)
SELECT requester.id, giver.id, template.id, 'Please share learning feedback for me.', 'submitted'
FROM users AS requester
JOIN users AS giver ON giver.email = 'shantisingh22@navgurukul.org'
JOIN feedback_templates AS template ON template.name = 'Learning Feedback'
WHERE requester.email = 'ranisingh21@navgurukul.org'
  AND NOT EXISTS (
    SELECT 1
    FROM feedback_requests AS request
    WHERE request.requester_id = requester.id
      AND request.giver_id = giver.id
      AND request.template_id = template.id
      AND request.message = 'Please share learning feedback for me.'
  );

INSERT INTO feedback_answers
(request_id, question_id, answer)
SELECT request.id, question.id, 'Rani understood React basics well.'
FROM feedback_requests AS request
JOIN users AS requester ON requester.id = request.requester_id
JOIN users AS giver ON giver.id = request.giver_id
JOIN feedback_templates AS template ON template.id = request.template_id
JOIN template_questions AS question
  ON question.template_id = template.id AND question.question_order = 1
WHERE requester.email = 'ranisingh21@navgurukul.org'
  AND giver.email = 'shantisingh22@navgurukul.org'
  AND template.name = 'Learning Feedback'
  AND request.message = 'Please share learning feedback for me.'
  AND NOT EXISTS (
    SELECT 1
    FROM feedback_answers AS answer
    WHERE answer.request_id = request.id AND answer.question_id = question.id
  );
