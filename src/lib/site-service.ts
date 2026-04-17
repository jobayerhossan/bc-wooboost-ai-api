import { withTransaction } from "@/lib/db";
import { env } from "@/lib/env";
import {
  findSiteByUrl,
  insertAiRequestLog,
  upsertSite,
  updateSiteCredits,
  type SiteRecord,
} from "@/lib/repositories";
import {
  generateRequestId,
  generateRawToken,
  generateSiteId,
  hashToken,
} from "@/lib/security";
import {
  assertCreditsAvailable,
  currentMonthlyCycle,
  deductCreditAfterSuccess,
  getCreditSnapshot,
  syncCreditCycle,
} from "@/lib/credits";
import { generateOptimizedDescription } from "@/lib/openai";
import { ApiError } from "@/lib/http";

export async function connectSite(input: {
  site_name: string;
  site_url: string;
  admin_email: string;
  plugin_version: string;
  mode: "credits" | "own_api_key";
}) {
  const existing = await findSiteByUrl(input.site_url);
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const siteId = existing?.site_id ?? generateSiteId();

  await withTransaction(async (client) => {
    await upsertSite(
      {
        siteId,
        siteName: input.site_name,
        siteUrl: input.site_url,
        adminEmail: input.admin_email,
        mode: input.mode,
        pluginVersion: input.plugin_version,
        tokenHash,
        monthlyCycle: existing?.monthly_cycle ?? currentMonthlyCycle(),
        monthlyFreeTotal:
          existing?.monthly_free_total ?? env.credits.monthlyFreeTotal,
        monthlyFreeUsed: existing?.monthly_free_used ?? 0,
        paidCredits: existing?.paid_credits ?? 0,
      },
      client,
    );
  });

  const connectedSite = await findSiteByUrl(input.site_url);

  if (!connectedSite) {
    throw new ApiError(500, "The site could not be loaded after connection.");
  }

  return {
    site_id: siteId,
    site_token: rawToken,
    credits: getCreditSnapshot(syncCreditCycle(connectedSite)),
  };
}

export async function refreshCredits(site: SiteRecord) {
  const synced = syncCreditCycle(site);

  if (synced.monthly_cycle !== site.monthly_cycle) {
    await updateSiteCredits({
      siteRef: synced.id,
      monthlyCycle: synced.monthly_cycle,
      monthlyFreeTotal: synced.monthly_free_total,
      monthlyFreeUsed: synced.monthly_free_used,
      paidCredits: synced.paid_credits,
    });
  }

  return getCreditSnapshot(synced);
}

export async function optimizeDescription(input: {
  site: SiteRecord;
  mode: "credits" | "own_api_key";
  feature: "optimize_description";
  provider_api_key?: string;
  product: {
    id: number;
    title?: string;
    description?: string;
    categories: string[];
    tags: string[];
    permalink?: string;
  };
}) {
  if (!input.product.title?.trim() && !input.product.description?.trim()) {
    throw new ApiError(422, "A product title or description is required.");
  }

  if (input.mode === "own_api_key" && !input.provider_api_key?.trim()) {
    throw new ApiError(
      422,
      "Own API key mode currently requires provider_api_key.",
    );
  }

  const requestId = generateRequestId();
  const syncedSite = syncCreditCycle(input.site);

  await updateSiteCredits({
    siteRef: syncedSite.id,
    monthlyCycle: syncedSite.monthly_cycle,
    monthlyFreeTotal: syncedSite.monthly_free_total,
    monthlyFreeUsed: syncedSite.monthly_free_used,
    paidCredits: syncedSite.paid_credits,
  });

  try {
    assertCreditsAvailable(syncedSite, input.mode);
  } catch (error) {
    throw new ApiError(
      402,
      error instanceof Error ? error.message : "No credits are available.",
    );
  }

  const requestPayload = {
    feature: input.feature,
    mode: input.mode,
    product: input.product,
  };

  await insertAiRequestLog({
    requestId,
    siteId: syncedSite.site_id,
    feature: input.feature,
    mode: input.mode,
    status: "started",
    creditSpent: false,
    requestPayload,
  });

  try {
    const aiResult = await generateOptimizedDescription(
      { product: input.product },
      input.provider_api_key,
    );

    const chargedSite = deductCreditAfterSuccess(syncedSite, input.mode);

    await updateSiteCredits({
      siteRef: chargedSite.id,
      monthlyCycle: chargedSite.monthly_cycle,
      monthlyFreeTotal: chargedSite.monthly_free_total,
      monthlyFreeUsed: chargedSite.monthly_free_used,
      paidCredits: chargedSite.paid_credits,
    });

    const credits = getCreditSnapshot(chargedSite);

    await insertAiRequestLog({
      requestId,
      siteId: chargedSite.site_id,
      feature: input.feature,
      mode: input.mode,
      status: "succeeded",
      creditSpent: input.mode === "credits",
      providerResponseId: aiResult.providerResponseId,
      requestPayload,
      responsePayload: {
        generated_description: aiResult.generatedDescription,
        credits,
      },
    });

    return {
      request_id: requestId,
      generated_description: aiResult.generatedDescription,
      summary: "A new WooCommerce-ready product description preview is ready.",
      credits,
    };
  } catch (error) {
    await insertAiRequestLog({
      requestId,
      siteId: syncedSite.site_id,
      feature: input.feature,
      mode: input.mode,
      status: "failed",
      creditSpent: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      requestPayload,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      502,
      error instanceof Error ? error.message : "Description generation failed.",
    );
  }
}
