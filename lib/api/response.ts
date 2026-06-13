import type { PaginatedResult } from "./types";

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function err(
  message: string,
  status: number,
  code?: string,
): Response {
  return Response.json(
    { success: false, error: { message, code: code ?? httpCodeToSlug(status) } },
    { status },
  );
}

export function paginated<T>(result: PaginatedResult<T>): Response {
  return Response.json({ success: true, ...result });
}

function httpCodeToSlug(status: number): string {
  const map: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
  };
  return map[status] ?? "ERROR";
}
