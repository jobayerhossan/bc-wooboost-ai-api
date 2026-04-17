import { NextRequest } from "next/server";
import { connectSiteSchema, validateInput } from "@/lib/validation";
import { connectSite } from "@/lib/site-service";
import {
  getClientIp,
  jsonError,
  jsonSuccess,
  parseJson,
} from "@/lib/http";
import { assertRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`connect:${getClientIp(request)}`);

    const payload = validateInput(
      connectSiteSchema,
      await parseJson(request),
    );

    const result = await connectSite(payload);

    return jsonSuccess("Site connected successfully.", result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
