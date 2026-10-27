// Storefront side of the Studio draft: the owner previewing in the Studio sees
// their unpublished draft; everyone else (and every cached page) sees the live store.

import { cache } from "react";
import { draftMode } from "next/headers";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { overlayAppearance, readStudioDraft, type Appearance } from "./appearance";

/**
 * The draft for this store — only when Next draft mode is on (set by
 * /api/studio/preview after an auth check) *and* the viewer owns the store.
 * Normal visitors never reach the session/DB lookups, so ISR is unaffected.
 */
export const getStudioDraftAppearance = cache(async (storeId: string): Promise<Appearance | null> => {
  try {
    if (!(await draftMode()).isEnabled) return null;
    const session = await getCurrentSession();
    if (!session) return null;
    const row = await prisma.storeSettings.findFirst({
      where: { storeId, store: { userId: session.userId } },
      select: { draftThemeConfig: true },
    });
    return readStudioDraft(row?.draftThemeConfig)?.appearance ?? null;
  } catch {
    // Outside a request (build / static generation) — always the live store.
    return null;
  }
});

/**
 * The owner is previewing in the Studio (same draft-mode + ownership check),
 * so a paused store still renders for them to keep working on it.
 */
export const isStudioPreview = cache(async (storeId: string): Promise<boolean> => {
  try {
    if (!(await draftMode()).isEnabled) return false;
    const session = await getCurrentSession();
    if (!session) return false;
    return (await prisma.store.count({ where: { id: storeId, userId: session.userId } })) > 0;
  } catch {
    return false;
  }
});

/** `settings` with the Studio draft applied, when the viewer is previewing one. */
export async function withStudioDraft<T extends object>(storeId: string, settings: T | null): Promise<T | null> {
  if (!settings) return settings;
  const draft = await getStudioDraftAppearance(storeId);
  return draft ? overlayAppearance(settings, draft) : settings;
}
