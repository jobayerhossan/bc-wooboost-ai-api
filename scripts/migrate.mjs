import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

loadDotEnv();

const required = [
  "BC_WOOBOOST_DB_HOST",
  "BC_WOOBOOST_DB_PORT",
  "BC_WOOBOOST_DB_NAME",
  "BC_WOOBOOST_DB_USER",
  "BC_WOOBOOST_DB_PASSWORD",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const schemaPath = path.join(process.cwd(), "database", "schema.sql");
const schema = await fsp.readFile(schemaPath, "utf8");
const { Client } = pg;

const client = new Client({
  host: process.env.BC_WOOBOOST_DB_HOST,
  port: Number(process.env.BC_WOOBOOST_DB_PORT),
  database: process.env.BC_WOOBOOST_DB_NAME,
  user: process.env.BC_WOOBOOST_DB_USER,
  password: process.env.BC_WOOBOOST_DB_PASSWORD,
  ssl:
    process.env.BC_WOOBOOST_DB_SSL === "0"
      ? false
      : { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query(schema);
  console.log("BC WooBoost AI API migration completed.");
} finally {
  await client.end();
}

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");

  try {
    const contents = fs.readFileSync(envPath, "utf8");
    const lines = contents.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const separator = trimmed.indexOf("=");
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();

      if (!key || process.env[key] !== undefined) {
        continue;
      }

      value = value.replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  } catch {
    // No local .env file is fine.
  }
}
