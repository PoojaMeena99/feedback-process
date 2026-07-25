const mysql = require("mysql2/promise");

function createDatabasePool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

let pool;

function getDatabasePool() {
  if (!pool) {
    pool = createDatabasePool();
  }

  return pool;
}

module.exports = {
  getDatabasePool,
};

