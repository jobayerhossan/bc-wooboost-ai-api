import OpenAI from "openai";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";

type OptimizePayload = {
  product: {
    title?: string;
    description?: string;
    categories?: string[];
    tags?: string[];
    permalink?: string;
  };
};

function mockDescription(payload: OptimizePayload) {
  const title = payload.product.title?.trim() || "Product";
  const description =
    payload.product.description?.trim() ||
    "A stronger product description will be generated here.";
  const categories = payload.product.categories?.join(", ") || "None";
  const tags = payload.product.tags?.join(", ") || "None";

  return `<p><strong>${escapeHtml(title)}</strong> now has a polished mock description for development mode.</p><p>${escapeHtml(
    description,
  )}</p><p><em>Categories:</em> ${escapeHtml(
    categories,
  )}. <em>Tags:</em> ${escapeHtml(tags)}.</p>`;
}

export async function generateOptimizedDescription(
  payload: OptimizePayload,
  providerApiKey?: string,
) {
  if (env.openai.mockAi) {
    return {
      generatedDescription: mockDescription(payload),
      providerResponseId: "mock-response",
    };
  }

  const apiKey = providerApiKey?.trim() || env.openai.apiKey;

  if (!apiKey) {
    throw new ApiError(500, "No OpenAI API key is configured on the backend.");
  }

  const client = new OpenAI({ apiKey });
  const product = payload.product;

  const input = [
    `Product title: ${product.title ?? ""}`,
    `Current description: ${product.description ?? ""}`,
    `Categories: ${(product.categories ?? []).join(", ")}`,
    `Tags: ${(product.tags ?? []).join(", ")}`,
    `Permalink: ${product.permalink ?? ""}`,
    "",
    "Rewrite the description so it is clear, persuasive, factual, readable, and directly usable in WooCommerce product content.",
  ].join("\n");

  try {
    const response = await client.responses.create({
      model: env.openai.model,
      instructions:
        "You optimize WooCommerce product descriptions. Return only the rewritten product description as clean HTML with no explanation.",
      input,
      temperature: 0.7,
      max_output_tokens: 700,
    });

    const text = response.output_text?.trim();

    if (!text) {
      throw new ApiError(
        502,
        "The OpenAI response did not contain generated text.",
      );
    }

    return {
      generatedDescription: text,
      providerResponseId: response.id,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error("OpenAI request failed", error);
    throw new ApiError(502, "The OpenAI request failed.");
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
