import type { PoolClient } from "pg";
import { db, oneOrNull } from "@/lib/db";

export type SiteRecord = {
  id: string;
  site_id: string;
  site_name: string;
  site_url: string;
  admin_email: string;
  mode: "credits" | "own_api_key";
  plugin_version: string;
  token_hash: string;
  monthly_cycle: string;
  monthly_free_total: number;
  monthly_free_used: number;
  paid_credits: number;
  created_at: Date;
  updated_at: Date;
};

function mapSite(row: Record<string, unknown>): SiteRecord {
  return {
    id: String(row.id),
    site_id: String(row.site_id),
    site_name: String(row.site_name),
    site_url: String(row.site_url),
    admin_email: String(row.admin_email),
    mode: String(row.mode) as SiteRecord["mode"],
    plugin_version: String(row.plugin_version),
    token_hash: String(row.token_hash),
    monthly_cycle: String(row.monthly_cycle),
    monthly_free_total: Number(row.monthly_free_total),
    monthly_free_used: Number(row.monthly_free_used),
    paid_credits: Number(row.paid_credits),
    created_at: new Date(String(row.created_at)),
    updated_at: new Date(String(row.updated_at)),
  };
}

export async function findSiteBySiteId(
  siteId: string,
  client?: PoolClient,
) {
  const row = await oneOrNull<Record<string, unknown>>(
    `select
      s.id,
      s.site_id,
      s.site_name,
      s.site_url,
      s.admin_email,
      s.mode,
      s.plugin_version,
      s.token_hash,
      c.monthly_cycle,
      c.monthly_free_total,
      c.monthly_free_used,
      c.paid_credits,
      s.created_at,
      s.updated_at
    from bc_wooboost_sites s
    join bc_wooboost_site_credits c on c.site_ref = s.id
    where s.site_id = $1
    limit 1`,
    [siteId],
    client,
  );

  return row ? mapSite(row) : null;
}

export async function findSiteByUrl(siteUrl: string, client?: PoolClient) {
  const row = await oneOrNull<Record<string, unknown>>(
    `select
      s.id,
      s.site_id,
      s.site_name,
      s.site_url,
      s.admin_email,
      s.mode,
      s.plugin_version,
      s.token_hash,
      c.monthly_cycle,
      c.monthly_free_total,
      c.monthly_free_used,
      c.paid_credits,
      s.created_at,
      s.updated_at
    from bc_wooboost_sites s
    join bc_wooboost_site_credits c on c.site_ref = s.id
    where s.site_url = $1
    limit 1`,
    [siteUrl],
    client,
  );

  return row ? mapSite(row) : null;
}

export async function upsertSite(
  input: {
    siteId: string;
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    mode: "credits" | "own_api_key";
    pluginVersion: string;
    tokenHash: string;
    monthlyCycle: string;
    monthlyFreeTotal: number;
    monthlyFreeUsed: number;
    paidCredits: number;
  },
  client: PoolClient,
) {
  const result = await client.query<{ id: string }>(
    `insert into bc_wooboost_sites
      (site_id, site_name, site_url, admin_email, mode, plugin_version, token_hash)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (site_url)
     do update set
      site_id = excluded.site_id,
      site_name = excluded.site_name,
      admin_email = excluded.admin_email,
      mode = excluded.mode,
      plugin_version = excluded.plugin_version,
      token_hash = excluded.token_hash,
      updated_at = now()
     returning id`,
    [
      input.siteId,
      input.siteName,
      input.siteUrl,
      input.adminEmail,
      input.mode,
      input.pluginVersion,
      input.tokenHash,
    ],
  );

  const siteRef = result.rows[0]?.id;

  await client.query(
    `insert into bc_wooboost_site_credits
      (site_ref, monthly_cycle, monthly_free_total, monthly_free_used, paid_credits)
     values ($1, $2, $3, $4, $5)
     on conflict (site_ref)
     do update set
      monthly_cycle = excluded.monthly_cycle,
      monthly_free_total = excluded.monthly_free_total,
      monthly_free_used = excluded.monthly_free_used,
      paid_credits = excluded.paid_credits,
      updated_at = now()`,
    [
      siteRef,
      input.monthlyCycle,
      input.monthlyFreeTotal,
      input.monthlyFreeUsed,
      input.paidCredits,
    ],
  );
}

export async function updateSiteCredits(
  input: {
    siteRef: string;
    monthlyCycle: string;
    monthlyFreeTotal: number;
    monthlyFreeUsed: number;
    paidCredits: number;
  },
  client?: PoolClient,
) {
  const executor = client ?? db;

  await executor.query(
    `update bc_wooboost_site_credits
     set
      monthly_cycle = $2,
      monthly_free_total = $3,
      monthly_free_used = $4,
      paid_credits = $5,
      updated_at = now()
     where site_ref = $1`,
    [
      input.siteRef,
      input.monthlyCycle,
      input.monthlyFreeTotal,
      input.monthlyFreeUsed,
      input.paidCredits,
    ],
  );
}

export async function insertAiRequestLog(
  input: {
    requestId: string;
    siteId: string;
    feature: string;
    mode: "credits" | "own_api_key";
    status: "started" | "succeeded" | "failed";
    creditSpent: boolean;
    providerResponseId?: string | null;
    errorMessage?: string | null;
    requestPayload: Record<string, unknown>;
    responsePayload?: Record<string, unknown> | null;
  },
  client?: PoolClient,
) {
  const executor = client ?? db;

  await executor.query(
    `insert into bc_wooboost_ai_request_logs
      (
        request_id,
        site_id,
        feature,
        mode,
        status,
        credit_spent,
        provider_response_id,
        error_message,
        request_payload,
        response_payload
      )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb)`,
    [
      input.requestId,
      input.siteId,
      input.feature,
      input.mode,
      input.status,
      input.creditSpent,
      input.providerResponseId ?? null,
      input.errorMessage ?? null,
      JSON.stringify(input.requestPayload),
      JSON.stringify(input.responsePayload ?? null),
    ],
  );
}
