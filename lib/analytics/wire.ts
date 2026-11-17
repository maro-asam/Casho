/**
 * The collector's wire format (what the browser SDK sends) and its strict
 * validation. Everything is bounded: unknown keys are dropped, strings are
 * capped, numbers are clamped by the normaliser.
 */
import { z } from "zod";
import { EVENT_NAME_PATTERN, ID_PATTERN, LIMITS, PAYLOAD_VERSION, PROP_KEY_PATTERN } from "./constants";

const id = z.string().regex(ID_PATTERN);
const ms = z.number().finite();
const px = z.number().finite().min(0).max(1_000_000);
const shortText = (max: number) => z.string().max(max * 4); // capped again after cleaning

const propValue = z.union([z.string().max(LIMITS.maxPropString * 2), z.number().finite(), z.boolean(), z.null()]);

export const propsSchema = z
  .record(z.string().regex(PROP_KEY_PATTERN), propValue)
  .refine((obj) => Object.keys(obj).length <= LIMITS.maxProps, "too many props");

/** A page view starts. */
const pageviewItem = z.object({
  k: z.literal("pv"),
  id,
  t: ms,
  /** location.pathname + location.search */
  p: z.string().min(1).max(2000),
  ti: shortText(LIMITS.maxTitle).optional(),
  /** Previous path in the session (already normalised by the browser, re-normalised here). */
  pp: z.string().max(2000).optional(),
  q: z.number().int().min(1).max(10_000),
  vw: px,
  vh: px.optional(),
  dh: px.optional(),
});

/** A page view's running totals (sent on hide, route change and every minute of activity). */
const pageUpdateItem = z.object({
  k: z.literal("pu"),
  id,
  em: z.number().int().min(0).max(24 * 60 * 60 * 1000),
  sp: z.number().int().min(0).max(100),
  dh: px.optional(),
});

/** Anything else: clicks (with heatmap geometry), forms, errors, vitals, custom events. */
const eventItem = z.object({
  k: z.literal("ev"),
  id,
  t: ms,
  n: z.string().regex(EVENT_NAME_PATTERN),
  p: z.string().max(2000).optional(),
  x: z.number().finite().min(0).max(1).optional(),
  y: px.optional(),
  vw: px.optional(),
  dh: px.optional(),
  sel: z.string().max(LIMITS.maxSelector).optional(),
  ex: z.number().finite().min(0).max(1).optional(),
  ey: z.number().finite().min(0).max(1).optional(),
  v: z.number().finite().optional(),
  pr: propsSchema.optional(),
});

export const batchItemSchema = z.discriminatedUnion("k", [pageviewItem, pageUpdateItem, eventItem]);
export type BatchItem = z.infer<typeof batchItemSchema>;
export type PageviewItem = z.infer<typeof pageviewItem>;
export type PageUpdateItem = z.infer<typeof pageUpdateItem>;
export type EventItem = z.infer<typeof eventItem>;

/** Facts about the session, repeated in every batch so a lost first batch loses nothing. */
const sessionInfo = z.object({
  /** Session start, client clock. */
  ts: ms,
  /** The visitor had been here before this session. */
  ret: z.boolean(),
  /** document.referrer of the landing page. */
  ref: z.string().max(2000).optional(),
  /** Landing page pathname + search (UTM tags are read from it). */
  lp: z.string().min(1).max(2000),
  vw: px,
  vh: px,
  sw: px.optional(),
  sh: px.optional(),
  lang: z.string().max(35).optional(),
  /** navigator.maxTouchPoints — tells an iPad in desktop mode from a Mac. */
  tch: z.number().int().min(0).max(20).optional(),
});

export const batchSchema = z.object({
  v: z.literal(PAYLOAD_VERSION),
  /** Client clock when sent — used to correct event times for clock skew. */
  now: ms,
  sc: z.enum(["m", "a", "s"]),
  st: z.string().max(64).optional(),
  vid: id,
  sid: id,
  /** The merchant's visit counter was already bumped for this tab (count-only ping before consent). */
  nv: z.boolean().optional(),
  ss: sessionInfo,
  e: z.array(batchItemSchema).max(LIMITS.maxEventsPerBatch),
});
export type Batch = z.infer<typeof batchSchema>;

/** Storefront visit counter only — sent when full analytics can't run (no consent, Do Not Track, disabled). */
export const visitPingSchema = z.object({
  v: z.literal(PAYLOAD_VERSION),
  k: z.literal("visit"),
  st: z.string().max(64),
});
export type VisitPing = z.infer<typeof visitPingSchema>;
