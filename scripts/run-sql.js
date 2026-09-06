// One-off helper to apply SQL files against the Supabase Postgres instance.
// Usage: node run-sql.js <path-to-sql-file>
// Reads connection details from env vars (set them in the shell, never commit them):
//   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node run-sql.js <path-to-sql-file>");
    process.exit(1);
  }
  const sql = fs.readFileSync(path.resolve(file), "utf8");

  const client = new Client({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE ?? "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied ${file} successfully.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
