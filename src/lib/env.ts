import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

let loaded = false;

function loadDotEnv() {
  if (loaded) {
    return;
  }

  const envPath = path.join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    loaded = true;
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

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

  loaded = true;
}

loadDotEnv();

const envSchema = z.object({
  BC_WOOBOOST_APP_ENV: z.string().default("development"),
  BC_WOOBOOST_APP_DEBUG: z
    .enum(["0", "1"])
    .optional()
    .transform((value) => value === "1"),
  BC_WOOBOOST_DB_HOST: z.string().min(1, "BC_WOOBOOST_DB_HOST is required"),
  BC_WOOBOOST_DB_PORT: z.coerce.number().int().positive().default(5432),
  BC_WOOBOOST_DB_NAME: z.string().min(1, "BC_WOOBOOST_DB_NAME is required"),
  BC_WOOBOOST_DB_USER: z.string().min(1, "BC_WOOBOOST_DB_USER is required"),
  BC_WOOBOOST_DB_PASSWORD: z
    .string()
    .min(1, "BC_WOOBOOST_DB_PASSWORD is required"),
  BC_WOOBOOST_DB_SSL: z
    .enum(["0", "1"])
    .optional()
    .transform((value) => value !== "0"),
  BC_WOOBOOST_OPENAI_API_KEY: z
    .string()
    .optional()
    .transform((value) => value ?? ""),
  BC_WOOBOOST_OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  BC_WOOBOOST_MOCK_AI: z
    .enum(["0", "1"])
    .optional()
    .transform((value) => value === "1"),
  BC_WOOBOOST_FREE_CREDITS: z.coerce.number().int().positive().default(25),
  BC_WOOBOOST_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  BC_WOOBOOST_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid BC WooBoost AI API environment:", parsed.error.flatten().fieldErrors);
  throw new Error("BC WooBoost AI API environment is invalid.");
}

export const env = {
  appEnv: parsed.data.BC_WOOBOOST_APP_ENV,
  appDebug: parsed.data.BC_WOOBOOST_APP_DEBUG ?? false,
  db: {
    host: parsed.data.BC_WOOBOOST_DB_HOST,
    port: parsed.data.BC_WOOBOOST_DB_PORT,
    database: parsed.data.BC_WOOBOOST_DB_NAME,
    user: parsed.data.BC_WOOBOOST_DB_USER,
    password: parsed.data.BC_WOOBOOST_DB_PASSWORD,
    ssl: parsed.data.BC_WOOBOOST_DB_SSL ?? true,
  },
  openai: {
    apiKey: parsed.data.BC_WOOBOOST_OPENAI_API_KEY,
    model: parsed.data.BC_WOOBOOST_OPENAI_MODEL,
    mockAi: parsed.data.BC_WOOBOOST_MOCK_AI ?? false,
  },
  credits: {
    monthlyFreeTotal: parsed.data.BC_WOOBOOST_FREE_CREDITS,
  },
  rateLimit: {
    windowMs: parsed.data.BC_WOOBOOST_RATE_LIMIT_WINDOW_MS,
    max: parsed.data.BC_WOOBOOST_RATE_LIMIT_MAX,
  },
} as const;
