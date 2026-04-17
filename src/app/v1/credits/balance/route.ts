import { authenticateSiteRequest } from "@/lib/auth";
import { refreshCredits } from "@/lib/site-service";
import { jsonError, jsonSuccess } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const site = await authenticateSiteRequest();
    const credits = await refreshCredits(site);

    return jsonSuccess("Credit balance retrieved.", {
      credits,
    });
  } catch (error) {
    return jsonError(error);
  }
}
