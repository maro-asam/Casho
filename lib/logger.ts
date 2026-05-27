/**
 * Structured JSON logger for server-side code.
 * Outputs JSON lines — compatible with Vercel, Datadog, and most log aggregators.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("[Webhook] Received event", { messageId, storeId });
 *   logger.error("[JobRunner] OpenAI timeout", { jobId, attempt, err: err.message });
 */

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, ctx?: LogContext) {
  // Skip debug logs in production unless LOG_DEBUG=true
  if (level === "debug" && process.env.NODE_ENV !== "development" && process.env.LOG_DEBUG !== "true") {
    return;
  }

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...ctx,
  };

  const line = JSON.stringify(entry);

  switch (level) {
    case "debug": console.debug(line); break;
    case "info":  console.info(line);  break;
    case "warn":  console.warn(line);  break;
    case "error": console.error(line); break;
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info:  (msg: string, ctx?: LogContext) => emit("info",  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => emit("warn",  msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
};
