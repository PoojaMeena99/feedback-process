# Feedback Process Database

This document explains the MySQL data setup for the feedback-process MVP.

## Database

The app uses one database:

```sql
feedback_process
```

## Tables

### users

Stores people who can request or give feedback.

Columns:

- `id`: unique user id
- `name`: display name
- `email`: unique email
- `password_hash`: bcrypt password hash, never a plain-text password
- `is_active`: whether the user can log in
- `role`: default role, currently `member`
- `created_at`: timestamp when the user was created
- `updated_at`: timestamp updated automatically when the user row changes

Seed demo passwords:

- Rani Singh: `Rani@123`
- Shanti Singh: `Shanti@123`
- Pooja: `Pooja@123`
- Swari: `Swari@123`

Only bcrypt hashes are stored in MySQL. These plain-text demo passwords are only for local testing.

### auth_sessions

Stores active login sessions created by the authentication API.

Important columns:

- `id`: session id, stored as a UUID string
- `user_id`: connects the session to `users.id`
- `expires_at`: when the session should stop working
- `revoked_at`: set when logout revokes the session
- `created_at`: timestamp when the session was created

### password_reset_tokens

Stores password reset tokens created by the authentication API.

Important columns:

- `id`: reset token id, stored as a UUID string
- `user_id`: connects the reset token to `users.id`
- `token_hash`: hashed reset token, never the plain reset token
- `expires_at`: when the reset token should stop working
- `used_at`: set when the token has already been used
- `created_at`: timestamp when the token was created

### feedback_templates

Stores feedback form types.

MVP templates:

- Learning Feedback
- Project Completion Feedback

### template_questions

Stores fixed questions for each feedback template.

Important columns:

- `template_id`: connects the question to `feedback_templates.id`
- `question_text`: question shown in the form
- `question_order`: display order

### feedback_requests

Stores a request from one user to another.

Important columns:

- `requester_id`: user who asks for feedback
- `giver_id`: user who gives feedback
- `template_id`: selected feedback type
- `message`: optional request message
- `due_date`: optional deadline date for the feedback giver
- `status`: `requested`, `submitted`, `acknowledged`, `closed`, `declined`, or `cancelled`

### feedback_answers

Stores submitted answers for a request.

Important columns:

- `request_id`: connects answer to `feedback_requests.id`
- `question_id`: connects answer to `template_questions.id`
- `answer`: submitted answer text

## View

### feedback_request_details

This view shows feedback requests with readable names instead of only IDs.

Use it while testing:

```sql
SELECT id, requester_name, giver_name, feedback_type, message, due_date, status
FROM feedback_request_details
ORDER BY id DESC;
```

## Relationships

```text
users.id -> feedback_requests.requester_id
users.id -> feedback_requests.giver_id
users.id -> auth_sessions.user_id
users.id -> password_reset_tokens.user_id

feedback_templates.id -> template_questions.template_id
feedback_templates.id -> feedback_requests.template_id

feedback_requests.id -> feedback_answers.request_id
template_questions.id -> feedback_answers.question_id
```

## Setup Commands

From the repo root:

```bash
sudo mysql < backend/scripts/schema.sql
sudo mysql < backend/scripts/seed.sql
```

For an existing database, you can run the auth migration without deleting feedback data:

```bash
sudo mysql < backend/scripts/auth_migration.sql
sudo mysql < backend/scripts/seed.sql
```

For a database that was created before the due-date feature, run once:

```bash
sudo mysql < backend/scripts/add-due-date.sql
```

Create the local app user once:

```sql
CREATE USER IF NOT EXISTS 'feedback_user'@'localhost' IDENTIFIED BY 'feedback123';
GRANT ALL PRIVILEGES ON feedback_process.* TO 'feedback_user'@'localhost';
FLUSH PRIVILEGES;
```

## Useful Queries

Select the database:

```sql
USE feedback_process;
```

Show tables:

```sql
SHOW TABLES;
```

Show users:

```sql
SELECT id, name, email, is_active FROM users;
```

Check authentication columns:

```sql
DESC users;
DESC auth_sessions;
DESC password_reset_tokens;
```

Check that seed users have bcrypt hashes:

```sql
SELECT id, name, email, LEFT(password_hash, 7) AS hash_prefix
FROM users
ORDER BY id;
```

Show template questions:

```sql
SELECT template_id, question_order, question_text
FROM template_questions
ORDER BY template_id, question_order;
```

Show readable requests:

```sql
SELECT id, requester_name, giver_name, feedback_type, message, due_date, status
FROM feedback_request_details
ORDER BY id DESC;
```

Reset request test data only:

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE feedback_answers;
TRUNCATE TABLE feedback_requests;
SET FOREIGN_KEY_CHECKS = 1;
```

## Seed Data

`seed.sql` adds only starting reference data:

- users
- users' bcrypt password hashes
- feedback templates
- template questions

It does not add feedback requests or answers. Those should be created through the API or UI while testing.
