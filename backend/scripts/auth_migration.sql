USE feedback_process;

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
