import { prisma } from "@/lib/prisma";
import { authenticateRequest, requireScope, getIpFromRequest } from "./auth";
import { checkRateLimit, rateLimitHeaders } from "./rate-limit";
import { err } from "./response";
import type { ApiContext } from "./types";

export type RouteHandler<TParams = unknown> = (
  req: Request,
  ctx: ApiContext,
  params: TParams,
) => Promise<Response>;

interface MiddlewareOptions {
  scope?: string;
  rateLimit?: number;
}

/**
 * Wraps a route handler with auth + rate limiting + request logging.
 * Usage:
 *   export const GET = withApiAuth(handler, { scope: "orders:read" });
 */
export function withApiAuth<TParams = unknown>(
  handler: RouteHandler<TParams>,
  options: MiddlewareOptions = {},
) {
  return async function (req: Request, { params }: { params: Promise<TParams> }): Promise<Response> {
    const startTime = Date.now();

    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return err(auth.message, auth.status);
    }

    if (options.scope) {
      const scopeCheck = requireScope(auth.apiKey, options.scope);
      if (!scopeCheck.ok) {
        return err(scopeCheck.message, scopeCheck.status);
      }
    }

    const rl = checkRateLimit(auth.apiKey.id, options.rateLimit);
    const rlHeaders = rateLimitHeaders(rl);

    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Rate limit exceeded", code: "RATE_LIMITED" },
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...rlHeaders } },
      );
    }

    const ctx: ApiContext = {
      apiKey: auth.apiKey,
      store: auth.store,
      ipAddress: getIpFromRequest(req),
      startTime,
    };

    const resolvedParams = await params;

    let response: Response;
    try {
      response = await handler(req, ctx, resolvedParams);
    } catch (error) {
      console.error("[API v1 Error]", error);
      response = err("Internal server error", 500);
    }

    // Add rate limit headers to successful responses
    const mutableHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(rlHeaders)) mutableHeaders.set(k, v);

    // Fire-and-forget request log
    const durationMs = Date.now() - startTime;
    const url = new URL(req.url);
    prisma.apiRequestLog
      .create({
        data: {
          apiKeyId: auth.apiKey.id,
          storeId: auth.apiKey.storeId,
          method: req.method,
          path: url.pathname,
          statusCode: response.status,
          durationMs,
          ipAddress: ctx.ipAddress,
          userAgent: req.headers.get("user-agent"),
        },
      })
      .catch(() => {});

    return new Response(response.body, {
      status: response.status,
      headers: mutableHeaders,
    });
  };
}
