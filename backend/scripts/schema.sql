CREATE DATABASE IF NOT EXISTS feedback_process;

USE feedback_process;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  status VARCHAR(30) DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (giver_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES feedback_templates(id)
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
