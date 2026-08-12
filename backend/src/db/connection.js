import mysql from "mysql2/promise";

function createDatabasePool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // MySQL DATE has no time or timezone. Keep it as YYYY-MM-DD so a selected
    // calendar date never shifts by one day when it is sent to the browser.
    dateStrings: true,
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

async function testDatabaseConnection() {
  const databasePool = getDatabasePool();
  await databasePool.query("SELECT 1");
}

export {
  getDatabasePool,
  testDatabaseConnection,
};
