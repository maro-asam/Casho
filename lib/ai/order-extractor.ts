/**
 * OpenAI-powered order extraction from Instagram conversations.
 *
 * Hardening:
 *   - 30-second AbortController timeout per attempt
 *   - Up to 2 retry attempts on timeout or transient errors
 *   - Structured logging throughout
 *   - Never throws — returns a safe emptyResult on all failure paths
 */

import OpenAI from "openai";
import {
  ORDER_EXTRACTION_SYSTEM_PROMPT,
  buildOrderExtractionPrompt,
} from "./prompts";
import { logger } from "@/lib/logger";

// Lazy singleton — avoids initializing on cold import
let _client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const OPENAI_TIMEOUT_MS = 30_000; // 30 seconds per attempt
const MAX_ATTEMPTS = 2;           // 1 initial + 1 retry

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ExtractedProduct = {
  name: string;
  variant: string | null;
  quantity: number;
  unitPrice: number | null; // in EGP (will be converted to piasters by job runner)
};

export type OrderExtractionResult = {
  isOrder: boolean;
  confidence: number;
  customerName: string | null;
  phone: string | null;
  address: string | null;
  products: ExtractedProduct[];
  notes: string | null;
  /** Internal AI reasoning — stored in DB, never exposed to merchants */
  reasoning: string;
};

// ─── Main function ─────────────────────────────────────────────────────────────

export const CONFIDENCE_THRESHOLD = 0.70;

export async function extractOrderFromConversation(
  messages: Array<{
    isFromBusiness: boolean;
    content: string | null;
    sentAt: Date;
  }>,
  conversationId?: string,
): Promise<OrderExtractionResult> {
  const textMessages = messages.filter((m) => m.content?.trim());

  if (textMessages.length === 0) {
    logger.debug("[OrderExtractor] No text messages", { conversationId });
    return emptyResult("No text messages in conversation");
  }

  const userPrompt = buildOrderExtractionPrompt(textMessages);
  const openai = getOpenAI();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
      logger.debug("[OrderExtractor] Calling OpenAI", { conversationId, attempt, messageCount: textMessages.length });

      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o",
          messages: [
            { role: "system", content: ORDER_EXTRACTION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        },
        { signal: controller.signal },
      );

      clearTimeout(timer);

      const raw = response.choices[0]?.message?.content;

      if (!raw) {
        logger.warn("[OrderExtractor] Empty response from OpenAI", { conversationId, attempt });
        return emptyResult("Empty response from OpenAI");
      }

      const result = parseAndValidate(raw);

      logger.info("[OrderExtractor] Extraction complete", {
        conversationId,
        isOrder: result.isOrder,
        confidence: result.confidence,
        productCount: result.products.length,
      });

      return result;
    } catch (err) {
      clearTimeout(timer);

      const isTimeout = err instanceof Error && (
        err.name === "AbortError" ||
        err.message.includes("aborted") ||
        err.message.includes("timeout")
      );
      const isTransient = err instanceof Error && (
        err.message.includes("502") ||
        err.message.includes("503") ||
        err.message.includes("529") // OpenAI overloaded
      );

      if ((isTimeout || isTransient) && attempt < MAX_ATTEMPTS) {
        logger.warn("[OrderExtractor] Transient error — retrying", {
          conversationId,
          attempt,
          reason: isTimeout ? "timeout" : "transient_error",
          err: err instanceof Error ? err.message : String(err),
        });
        continue;
      }

      logger.error("[OrderExtractor] Failed after all attempts", {
        conversationId,
        attempt,
        err: err instanceof Error ? err.message : String(err),
      });

      // Re-throw so the job runner can mark the job as FAILED and retry later
      throw err;
    }
  }

  // Should not reach here, but TypeScript needs it
  return emptyResult("Exhausted all retry attempts");
}

// ─── Parsing ───────────────────────────────────────────────────────────────────

function parseAndValidate(raw: string): OrderExtractionResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.warn("[OrderExtractor] Invalid JSON from OpenAI", { raw: raw.slice(0, 200) });
    return emptyResult("Invalid JSON from OpenAI");
  }

  if (typeof parsed !== "object" || parsed === null) {
    return emptyResult("Non-object response from OpenAI");
  }

  const obj = parsed as Record<string, unknown>;

  const isOrder    = Boolean(obj.isOrder);
  const confidence = clamp(Number(obj.confidence ?? 0), 0, 1);
  const customerName = stringOrNull(obj.customerName);
  const phone        = cleanPhone(stringOrNull(obj.phone));
  const address      = stringOrNull(obj.address);
  const notes        = stringOrNull(obj.notes);
  const reasoning    = typeof obj.reasoning === "string" ? obj.reasoning : "";

  const products: ExtractedProduct[] = Array.isArray(obj.products)
    ? obj.products
        .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
        .map((p) => ({
          name:      typeof p.name === "string" ? p.name : "منتج غير محدد",
          variant:   stringOrNull(p.variant),
          quantity:  Math.max(1, parseInt(String(p.quantity ?? 1), 10) || 1),
          unitPrice: p.unitPrice != null ? Math.round(Number(p.unitPrice)) : null,
        }))
    : [];

  return { isOrder, confidence, customerName, phone, address, products, notes, reasoning };
}

function emptyResult(reason: string): OrderExtractionResult {
  return {
    isOrder: false,
    confidence: 0,
    customerName: null,
    phone: null,
    address: null,
    products: [],
    notes: null,
    reasoning: reason,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function cleanPhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^00/, "+");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, isNaN(value) ? 0 : value));
}
