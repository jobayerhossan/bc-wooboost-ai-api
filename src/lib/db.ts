import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __bcWooBoostPgPool__: Pool | undefined;
}

export const db =
  global.__bcWooBoostPgPool__ ??
  new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__bcWooBoostPgPool__ = db;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function oneOrNull<T extends QueryResultRow>(
  queryText: string,
  values: unknown[] = [],
  client?: PoolClient,
): Promise<T | null> {
  const executor = client ?? db;
  const result = await executor.query<T>(queryText, values);
  return result.rows[0] ?? null;
}
