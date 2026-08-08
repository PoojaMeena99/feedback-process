CREATE DATABASE IF NOT EXISTS feedback_process;

USE feedback_process;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET @add_password_hash_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email',
    'DO 0'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'password_hash'
);
PREPARE add_password_hash_column_statement FROM @add_password_hash_column;
EXECUTE add_password_hash_column_statement;
DEALLOCATE PREPARE add_password_hash_column_statement;

UPDATE users
SET password_hash = '$2b$10$eHi2aDoc688CFSOfXkmvtuE3hV/1Ll9wHg2eok7mXrz3lhufUcvom'
WHERE password_hash IS NULL OR password_hash = '';

ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) NOT NULL;

SET @add_is_active_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER password_hash',
    'DO 0'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'is_active'
);
PREPARE add_is_active_column_statement FROM @add_is_active_column;
EXECUTE add_is_active_column_statement;
DEALLOCATE PREPARE add_is_active_column_statement;

SET @add_updated_at_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    'DO 0'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'updated_at'
);
PREPARE add_updated_at_column_statement FROM @add_updated_at_column;
EXECUTE add_updated_at_column_statement;
DEALLOCATE PREPARE add_updated_at_column_statement;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS feedback_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS template_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES feedback_templates(id)
);

CREATE TABLE IF NOT EXISTS feedback_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  giver_id INT NOT NULL,
  template_id INT NOT NULL,
  message TEXT,
  due_date DATE NULL,
  status VARCHAR(30) DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (giver_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES feedback_templates(id)
);

SET @add_due_date_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN due_date DATE NULL AFTER message',
    'DO 0'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'due_date'
);
PREPARE add_due_date_column_statement FROM @add_due_date_column;
EXECUTE add_due_date_column_statement;
DEALLOCATE PREPARE add_due_date_column_statement;

CREATE TABLE IF NOT EXISTS feedback_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  question_id INT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES feedback_requests(id),
  FOREIGN KEY (question_id) REFERENCES template_questions(id)
);

CREATE OR REPLACE VIEW feedback_request_details AS
SELECT
  request.id,
  requester.name AS requester_name,
  giver.name AS giver_name,
  template.name AS feedback_type,
  request.message,
  request.due_date,
  request.status,
  request.created_at
FROM feedback_requests AS request
JOIN users AS requester ON requester.id = request.requester_id
JOIN users AS giver ON giver.id = request.giver_id
JOIN feedback_templates AS template ON template.id = request.template_id;
