USE feedback_process;

INSERT INTO users (name, email) VALUES
('Rani Singh', 'ranisingh21@navgurukul.org'),
('Shanti Singh', 'shantisingh22@navgurukul.org'),
('Pooja', 'pooja@example.com');

INSERT INTO feedback_templates (name, description) VALUES
('Learning Feedback', 'Feedback about learning progress, understanding, and improvement areas'),
('Project Completion Feedback', 'Feedback after completing a project or task');

INSERT INTO template_questions (template_id, question_text, question_order) VALUES
(1, 'What did the person learn well?', 1),
(1, 'Where can the person improve?', 2),
(1, 'What should the person practice next?', 3),
(2, 'What went well in the project?', 1),
(2, 'What challenges came during the project?', 2),
(2, 'What can be improved in the next project?', 3);

INSERT INTO feedback_requests
(requester_id, giver_id, template_id, message, status)
VALUES
(1, 2, 1, 'Please share learning feedback for me.', 'submitted');

INSERT INTO feedback_answers
(request_id, question_id, answer)
VALUES
(1, 1, 'Rani understood React basics well.');
