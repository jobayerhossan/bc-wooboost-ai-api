import { db } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await db.query("select 1");

    return jsonSuccess("Service is healthy.", {
      service: "bc-wooboost-ai-api",
      database: "ok",
      time: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
