import { env } from "@/lib/env";
import type { SiteRecord } from "@/lib/repositories";

export function currentMonthlyCycle() {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function syncCreditCycle(site: SiteRecord) {
  const cycle = currentMonthlyCycle();

  if (site.monthly_cycle === cycle) {
    return site;
  }

  return {
    ...site,
    monthly_cycle: cycle,
    monthly_free_total: env.credits.monthlyFreeTotal,
    monthly_free_used: 0,
  };
}

export function getCreditSnapshot(site: SiteRecord) {
  const freeRemaining = Math.max(
    0,
    site.monthly_free_total - site.monthly_free_used,
  );
  const paidRemaining = Math.max(0, site.paid_credits);

  return {
    balance: freeRemaining + paidRemaining,
    free_credits: freeRemaining,
    paid_credits: paidRemaining,
  };
}

export function assertCreditsAvailable(
  site: SiteRecord,
  mode: "credits" | "own_api_key",
) {
  if (mode === "own_api_key") {
    return;
  }

  const snapshot = getCreditSnapshot(site);

  if (snapshot.balance <= 0) {
    throw new Error("No credits are available for this site.");
  }
}

export function deductCreditAfterSuccess(
  site: SiteRecord,
  mode: "credits" | "own_api_key",
) {
  if (mode === "own_api_key") {
    return site;
  }

  const freeRemaining = site.monthly_free_total - site.monthly_free_used;

  if (freeRemaining > 0) {
    return {
      ...site,
      monthly_free_used: site.monthly_free_used + 1,
    };
  }

  if (site.paid_credits <= 0) {
    throw new Error("No credits remain to deduct.");
  }

  return {
    ...site,
    paid_credits: site.paid_credits - 1,
  };
}
