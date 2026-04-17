import { headers } from "next/headers";
import { ApiError } from "@/lib/http";
import { constantTimeEquals, hashToken } from "@/lib/security";
import { findSiteBySiteId } from "@/lib/repositories";

export async function authenticateSiteRequest() {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");
  const siteId = headerStore.get("x-bc-site-id");

  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError(401, "A valid Bearer site token is required.");
  }

  if (!siteId) {
    throw new ApiError(401, "The X-BC-Site-ID header is required.");
  }

  const rawToken = authorization.replace(/^Bearer\s+/i, "").trim();
  const site = await findSiteBySiteId(siteId);

  if (!site) {
    throw new ApiError(401, "Site authentication failed.");
  }

  const incomingHash = hashToken(rawToken);

  if (!constantTimeEquals(incomingHash, site.token_hash)) {
    throw new ApiError(401, "Site authentication failed.");
  }

  return site;
}
