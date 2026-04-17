import crypto from "node:crypto";

export function generateSiteId() {
  return `site_${crypto.randomBytes(8).toString("hex")}`;
}

export function generateRequestId() {
  return `req_${crypto.randomBytes(8).toString("hex")}`;
}

export function generateRawToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
