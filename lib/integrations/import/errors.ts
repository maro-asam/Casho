import { Prisma } from "@prisma/client";
import { ImportItemFailure } from "./types";

/**
 * Error raised by a provider client. `kind` drives the engine's reaction:
 * unauthorized → pause + ask to reconnect, everything else → retry with backoff.
 * Messages never contain tokens or record payloads.
 */
export class SourceApiError extends Error {
  constructor(
    readonly kind: "unauthorized" | "throttled" | "network" | "server" | "graphql" | "client",
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SourceApiError";
  }
}

const REDACTIONS: [RegExp, string][] = [
  // Shopify access / refresh / secret tokens
  [/shp(?:at|ua|ca|pa|ss|rt)_[A-Za-z0-9]+/g, "[REDACTED]"],
  [/\b(access_token|refresh_token|client_secret|code)=[^&\s"]+/gi, "$1=[REDACTED]"],
  [/("(?:access_token|refresh_token|accessToken|refreshToken|client_secret)"\s*:\s*")[^"]*/g, "$1[REDACTED]"],
  [/(X-Shopify-Access-Token:?\s*)\S+/gi, "$1[REDACTED]"],
];

/** Strips anything token-shaped from a string before it is logged or stored. */
export function redactSecrets(text: string): string {
  return REDACTIONS.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), text);
}

/** Log context for an error: name/code/kind only — never the full message of DB errors (they can echo values). */
export function errorLogContext(err: unknown): Record<string, unknown> {
  if (err instanceof SourceApiError) return { errName: err.name, kind: err.kind, status: err.status, err: redactSecrets(err.message) };
  if (err instanceof Prisma.PrismaClientKnownRequestError) return { errName: err.name, code: err.code };
  if (err instanceof Error) return { errName: err.name, err: redactSecrets(err.message).slice(0, 300) };
  return { err: "unknown" };
}

/** Unique-constraint violation (Prisma P2002; some driver adapters surface Postgres' 23505). */
export function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2002" || err.code === "23505");
}

/** Merchant-facing reason for a failed item (Arabic, no internals). */
export function itemFailureMessage(err: unknown): string {
  if (err instanceof ImportItemFailure) return err.message;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (isUniqueViolation(err)) return "تعارض مع سجل موجود بنفس البيانات";
    if (err.code === "P2003") return "مرتبط بسجل غير موجود";
    if (err.code === "P2000") return "قيمة أطول من المسموح";
  }
  if (err instanceof Prisma.PrismaClientValidationError) return "بيانات غير صالحة";
  return "خطأ غير متوقع أثناء الحفظ";
}

/** Merchant-facing reason for a paused job. */
export function jobFailureMessage(err: unknown): string {
  if (err instanceof SourceApiError) {
    switch (err.kind) {
      case "unauthorized":
        return "انتهت صلاحية الربط مع Shopify — أعد ربط المتجر ثم استكمل الاستيراد";
      case "throttled":
        return "Shopify طلب إبطاء الطلبات — هنكمل تلقائياً";
      case "network":
        return "تعذّر الوصول إلى Shopify — مشكلة في الشبكة";
      case "server":
        return "Shopify غير متاح مؤقتاً";
      default:
        return "Shopify رفض الطلب";
    }
  }
  return "حدث خطأ غير متوقع أثناء الاستيراد";
}
