import { NextRequest, NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function jsonSuccess(
  message: string,
  data: Record<string, unknown> = {},
  status = 200,
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    {
      status,
      headers: commonHeaders(),
    },
  );
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        data: error.details ?? {},
      },
      {
        status: error.status,
        headers: commonHeaders(),
      },
    );
  }

  console.error("Unhandled API error", error);

  return NextResponse.json(
    {
      success: false,
      message: "An unexpected server error occurred.",
      data: {},
    },
    {
      status: 500,
      headers: commonHeaders(),
    },
  );
}

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function commonHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}

export async function parseJson<T>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "The request body must be valid JSON.");
  }
}
