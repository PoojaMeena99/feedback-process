USE feedback_process;

INSERT INTO users (name, email) VALUES
('Rani Singh', 'ranisingh21@navgurukul.org'),
('Shanti Singh', 'shantisingh22@navgurukul.org'),
('Pooja', 'pooja@example.com');

INSERT INTO feedback_templates (name, description) VALUES
('Learning Feedback', 'Feedback about learning progress, understanding, and improvement areas'),
('Project Completion Feedback', 'Feedback after completing a project or task');

INSERT INTO feedback_requests
(requester_id, giver_id, template_id, message, status)
VALUES
(1, 2, 1, 'Please share learning feedback for me.', 'submitted');

INSERT INTO feedback_answers
(request_id, question, answer)
VALUES
(1, 'What did Rani learn well?', 'Rani understood React basics well.');
