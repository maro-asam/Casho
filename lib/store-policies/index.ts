// Storefront legal pages: return & exchange, shipping, privacy, terms.
//
// Stored per store in `StoreSettings.policies` (JSON). A policy with no body
// shows the ready-made template (./templates), filled with the store's own
// details, so every store has its pages from day one; the merchant edits or
// hides each one from /dashboard/policies. Pure — no DB, safe on the client.

import { z } from "zod";

import { buildPolicyTemplate, type PolicyTemplateContext } from "./templates";

export const POLICY_TYPES = ["returns", "shipping", "privacy", "terms"] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export function isPolicyType(value: unknown): value is PolicyType {
  return typeof value === "string" && (POLICY_TYPES as readonly string[]).includes(value);
}

/** Storefront copy: page titles and the shorter labels used in footers and menus. */
export const POLICY_LABELS: Record<PolicyType, { title: string; short: string }> = {
  returns: { title: "سياسة الاسترجاع والاستبدال", short: "سياسة الاسترجاع" },
  shipping: { title: "سياسة الشحن والتوصيل", short: "سياسة الشحن" },
  privacy: { title: "سياسة الخصوصية", short: "سياسة الخصوصية" },
  terms: { title: "الشروط والأحكام", short: "الشروط والأحكام" },
};

/** Longest body a merchant can save (roughly 15 printed pages). */
export const POLICY_MAX_LENGTH = 20_000;

/** Storefront path of a policy page (relative to the store root). */
export const policyPath = (type: PolicyType) => `/policies/${type}`;

// ─── Stored shape ────────────────────────────────────────────────────────────

const entrySchema = z.object({
  body: z.string().max(POLICY_MAX_LENGTH).nullish(),
  hidden: z.boolean().optional(),
  updatedAt: z.string().optional(),
});
export type StoredPolicy = z.infer<typeof entrySchema>;
export type StoredPolicies = Partial<Record<PolicyType, StoredPolicy>>;

/** Reads `StoreSettings.policies`, dropping anything malformed instead of throwing. */
export function readStoredPolicies(raw: unknown): StoredPolicies {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: StoredPolicies = {};
  for (const type of POLICY_TYPES) {
    const parsed = entrySchema.safeParse((raw as Record<string, unknown>)[type]);
    if (parsed.success) out[type] = parsed.data;
  }
  return out;
}

/** The merchant's own text, or null when the template is in use. */
export function customBody(entry: StoredPolicy | undefined): string | null {
  const body = entry?.body?.trim();
  return body ? body : null;
}

/** Policies the storefront shows, in display order. */
export function visiblePolicyTypes(stored: StoredPolicies): PolicyType[] {
  return POLICY_TYPES.filter((type) => !stored[type]?.hidden);
}

export type ResolvedPolicy = {
  type: PolicyType;
  title: string;
  /** The text shown: the merchant's own, or the filled-in template. */
  body: string;
  isTemplate: boolean;
  hidden: boolean;
  /** When the merchant last saved their own text (ISO); null for the template. */
  updatedAt: string | null;
};

export function resolvePolicy(stored: StoredPolicies, type: PolicyType, ctx: PolicyTemplateContext): ResolvedPolicy {
  const entry = stored[type];
  const own = customBody(entry);
  return {
    type,
    title: POLICY_LABELS[type].title,
    body: own ?? buildPolicyTemplate(type, ctx),
    isTemplate: own === null,
    hidden: !!entry?.hidden,
    updatedAt: own ? (entry?.updatedAt ?? null) : null,
  };
}

/**
 * Terms consent at checkout only makes sense when there's something to agree
 * to: the terms page, the return policy page, or both.
 */
export function consentPolicyTypes(stored: StoredPolicies): PolicyType[] {
  return visiblePolicyTypes(stored).filter((type) => type === "terms" || type === "returns");
}

// ─── Body format ─────────────────────────────────────────────────────────────
//
// Plain text, so merchants can write it in a textarea without learning markup:
//   # a line starting with "#" is a section heading
//   - lines starting with "-", "•" or "*" are bullet points
//   anything else is a paragraph; a blank line starts a new one.

export type PolicyBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

const HEADING = /^#+\s*/;
const BULLET = /^[-•*–]\s+/;

export function parsePolicy(body: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
    if (list.length) blocks.push({ kind: "list", items: list });
    paragraph = [];
    list = [];
  };

  for (const raw of body.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (HEADING.test(line)) {
      flush();
      const text = line.replace(HEADING, "").trim();
      if (text) blocks.push({ kind: "heading", text });
    } else if (BULLET.test(line)) {
      if (paragraph.length) flush();
      list.push(line.replace(BULLET, "").trim());
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

export type { PolicyTemplateContext } from "./templates";
export { buildPolicyTemplate } from "./templates";
