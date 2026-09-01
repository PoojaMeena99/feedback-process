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
  receiver_id INT NOT NULL,
  template_id INT NOT NULL,
  message TEXT,
  due_date DATE NULL,
  purpose VARCHAR(40) NULL,
  visibility VARCHAR(30) NOT NULL DEFAULT 'private',
  alternate_giver_id INT NULL,
  status VARCHAR(30) DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (giver_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (alternate_giver_id) REFERENCES users(id),
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

SET @add_purpose_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN purpose VARCHAR(40) NULL AFTER due_date',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'purpose'
);
PREPARE add_purpose_column_statement FROM @add_purpose_column;
EXECUTE add_purpose_column_statement;
DEALLOCATE PREPARE add_purpose_column_statement;

SET @add_receiver_id_column = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN receiver_id INT NULL AFTER giver_id',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'feedback_requests' AND column_name = 'receiver_id'
);
PREPARE add_receiver_id_column_statement FROM @add_receiver_id_column;
EXECUTE add_receiver_id_column_statement;
DEALLOCATE PREPARE add_receiver_id_column_statement;
UPDATE feedback_requests SET receiver_id = requester_id WHERE receiver_id IS NULL;

SET @add_visibility_column = (
  SELECT IF(
    COUNT(*) = 0,
    "ALTER TABLE feedback_requests ADD COLUMN visibility VARCHAR(30) NOT NULL DEFAULT 'private' AFTER purpose",
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'visibility'
);
PREPARE add_visibility_column_statement FROM @add_visibility_column;
EXECUTE add_visibility_column_statement;
DEALLOCATE PREPARE add_visibility_column_statement;

SET @add_request_updated_at_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'updated_at'
);
PREPARE add_request_updated_at_column_statement FROM @add_request_updated_at_column;
EXECUTE add_request_updated_at_column_statement;
DEALLOCATE PREPARE add_request_updated_at_column_statement;

SET @add_acknowledgement_comment_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN acknowledgement_comment TEXT NULL AFTER status',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'acknowledgement_comment'
);
PREPARE add_acknowledgement_comment_column_statement FROM @add_acknowledgement_comment_column;
EXECUTE add_acknowledgement_comment_column_statement;
DEALLOCATE PREPARE add_acknowledgement_comment_column_statement;

SET @add_decline_reason_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN decline_reason TEXT NULL AFTER status',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'decline_reason'
);
PREPARE add_decline_reason_column_statement FROM @add_decline_reason_column;
EXECUTE add_decline_reason_column_statement;
DEALLOCATE PREPARE add_decline_reason_column_statement;

SET @add_alternate_giver_id_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN alternate_giver_id INT NULL AFTER decline_reason',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'alternate_giver_id'
);
PREPARE add_alternate_giver_id_column_statement FROM @add_alternate_giver_id_column;
EXECUTE add_alternate_giver_id_column_statement;
DEALLOCATE PREPARE add_alternate_giver_id_column_statement;

SET @add_acknowledged_at_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE feedback_requests ADD COLUMN acknowledged_at TIMESTAMP NULL AFTER acknowledgement_comment',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'feedback_requests'
    AND column_name = 'acknowledged_at'
);
PREPARE add_acknowledged_at_column_statement FROM @add_acknowledged_at_column;
EXECUTE add_acknowledged_at_column_statement;
DEALLOCATE PREPARE add_acknowledged_at_column_statement;

CREATE TABLE IF NOT EXISTS feedback_discussions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  parent_id INT NULL,
  author_id INT NOT NULL,
  type VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES feedback_requests(id),
  FOREIGN KEY (parent_id) REFERENCES feedback_discussions(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS feedback_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  question_id INT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES feedback_requests(id),
  FOREIGN KEY (question_id) REFERENCES template_questions(id)
);

CREATE TABLE IF NOT EXISTS feedback_follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  details TEXT NOT NULL,
  owner_id INT NOT NULL,
  due_date DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  progress_note TEXT NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES feedback_requests(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS feedback_request_viewers (
  request_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id, user_id),
  FOREIGN KEY (request_id) REFERENCES feedback_requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE OR REPLACE VIEW feedback_request_details AS
SELECT
  request.id,
  requester.name AS requester_name,
  giver.name AS giver_name,
  template.name AS feedback_type,
  request.message,
  request.due_date,
  request.purpose,
  request.visibility,
  request.status,
  request.created_at
FROM feedback_requests AS request
JOIN users AS requester ON requester.id = request.requester_id
JOIN users AS giver ON giver.id = request.giver_id
JOIN feedback_templates AS template ON template.id = request.template_id;
