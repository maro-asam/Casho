// Server-side writes for store appearance. Imported by server actions only.

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  APPEARANCE_SELECT,
  HISTORY_LIMIT,
  appearanceColumns,
  draftJson,
  liveAppearance,
  readStudioDraft,
  sameValue,
  type Appearance,
  type StudioDraft,
} from "./appearance";

/**
 * "live": the change goes straight to the storefront (dashboard shortcuts,
 * onboarding). An open draft gets the same change so publishing it later
 * doesn't undo it.
 * "draft": the Studio — only the owner sees it until they publish.
 */
export type AppearanceTarget = "live" | "draft";

export const isAppearanceTarget = (v: unknown): v is AppearanceTarget => v === "live" || v === "draft";

type Mutation = (current: Appearance) => Appearance;

async function loadState(storeId: string) {
  const [row, store] = await Promise.all([
    prisma.storeSettings.findUnique({
      where: { storeId },
      select: { ...APPEARANCE_SELECT, draftThemeConfig: true },
    }),
    prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } }),
  ]);
  return {
    live: liveAppearance(row),
    draft: readStudioDraft(row?.draftThemeConfig),
    slug: store?.slug ?? null,
  };
}

function revalidateStore(slug: string | null) {
  if (slug) revalidateStorefront(slug);
  revalidatePath("/builder");
}

async function writeDraft(storeId: string, draft: StudioDraft | null) {
  const value = draft ? draftJson(draft) : Prisma.DbNull;
  await prisma.storeSettings.upsert({
    where: { storeId },
    update: { draftThemeConfig: value },
    create: { storeId, draftThemeConfig: value },
  });
}

/** Applies `mutate` to the draft or the live store. Ownership must be checked by the caller. */
export async function mutateAppearance(storeId: string, mutate: Mutation, target: AppearanceTarget = "live") {
  const { live, draft, slug } = await loadState(storeId);

  if (target === "draft") {
    const base = draft?.appearance ?? live;
    const next = mutate(structuredClone(base));
    if (sameValue(next, base)) return;
    await writeDraft(storeId, {
      v: 2,
      appearance: next,
      history: [...(draft?.history ?? []), base].slice(-HISTORY_LIMIT),
      future: [],
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/builder");
    return;
  }

  const next = mutate(structuredClone(live));
  await prisma.storeSettings.upsert({
    where: { storeId },
    update: appearanceColumns(next),
    create: { storeId, ...appearanceColumns(next) },
  });
  if (draft) {
    await writeDraft(storeId, { ...draft, appearance: mutate(structuredClone(draft.appearance)), updatedAt: new Date().toISOString() });
  }
  revalidateStore(slug);
}

/** Copies the draft to the live columns and clears it. Returns false when there was nothing to publish. */
export async function publishDraft(storeId: string) {
  const { draft, slug } = await loadState(storeId);
  if (!draft) return false;
  await prisma.storeSettings.update({
    where: { storeId },
    data: { ...appearanceColumns(draft.appearance), draftThemeConfig: Prisma.DbNull },
  });
  revalidateStore(slug);
  return true;
}

export async function discardDraft(storeId: string) {
  await writeDraft(storeId, null);
  revalidatePath("/builder");
}

/** Moves one step through the draft history. Returns false when there is no step to take. */
export async function stepDraft(storeId: string, direction: "undo" | "redo") {
  const { draft } = await loadState(storeId);
  if (!draft) return false;
  const from = direction === "undo" ? draft.history : draft.future;
  const to = direction === "undo" ? draft.future : draft.history;
  const target = from.at(-1);
  if (!target) return false;

  const moved: StudioDraft = {
    ...draft,
    appearance: target,
    [direction === "undo" ? "history" : "future"]: from.slice(0, -1),
    [direction === "undo" ? "future" : "history"]: [...to, draft.appearance].slice(-HISTORY_LIMIT),
    updatedAt: new Date().toISOString(),
  };
  await writeDraft(storeId, moved);
  revalidatePath("/builder");
  return true;
}

/** The appearance the Studio is editing right now (draft if any, else live). */
export async function workingAppearance(storeId: string) {
  const { live, draft } = await loadState(storeId);
  return { live, draft, working: draft?.appearance ?? live };
}
