import { z } from "zod";
import { ApiError } from "@/lib/http";

export const connectSiteSchema = z.object({
  site_name: z.string().trim().min(1).max(160),
  site_url: z.string().trim().url().max(255),
  admin_email: z.string().trim().email().max(191),
  plugin_version: z.string().trim().min(1).max(32),
  mode: z.enum(["credits", "own_api_key"]).default("credits"),
});

export const optimizeDescriptionSchema = z.object({
  feature: z.literal("optimize_description"),
  mode: z.enum(["credits", "own_api_key"]).default("credits"),
  provider_api_key: z.string().trim().optional(),
  product: z.object({
    id: z.number().int().positive(),
    title: z.string().trim().max(255).optional().default(""),
    description: z.string().trim().max(50000).optional().default(""),
    categories: z.array(z.string().trim().min(1).max(100)).default([]),
    tags: z.array(z.string().trim().min(1).max(100)).default([]),
    permalink: z.string().trim().url().max(2048).optional(),
  }),
});

export function validateInput<T>(
  schema: z.ZodType<T>,
  payload: unknown,
): T {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError(422, "Request validation failed.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
}
