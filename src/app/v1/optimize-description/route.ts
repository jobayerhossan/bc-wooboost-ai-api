import { NextRequest } from "next/server";
import { authenticateSiteRequest } from "@/lib/auth";
import { optimizeDescriptionSchema, validateInput } from "@/lib/validation";
import {
  getClientIp,
  jsonError,
  jsonSuccess,
  parseJson,
} from "@/lib/http";
import { assertRateLimit } from "@/lib/rate-limit";
import { optimizeDescription } from "@/lib/site-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const site = await authenticateSiteRequest();
    assertRateLimit(`optimize:${site.site_id}:${getClientIp(request)}`);

    const payload = validateInput(
      optimizeDescriptionSchema,
      await parseJson(request),
    );

    const result = await optimizeDescription({
      site,
      ...payload,
    });

    return jsonSuccess("Description generated successfully.", result);
  } catch (error) {
    return jsonError(error);
  }
}
