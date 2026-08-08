USE feedback_process;

-- Adds authentication support to an existing database without removing data.
SET @password_hash_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'password_hash'
);
SET @add_password_hash_sql = IF(
  @password_hash_exists = 0,
  'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email',
  'SELECT 1'
);
PREPARE add_password_hash_statement FROM @add_password_hash_sql;
EXECUTE add_password_hash_statement;
DEALLOCATE PREPARE add_password_hash_statement;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);
