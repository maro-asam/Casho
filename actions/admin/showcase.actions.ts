"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { storePublicUrl } from "@/helpers/BuildStoreURL";
import { isStorefrontOpen } from "@/lib/subscriptions";
import { fieldErrors, showcaseSiteSchema } from "@/lib/showcase/validation";
import { parseStoreRef } from "@/lib/showcase/store-ref";

// Casho examples on the landing page (/admin/showcase). Every action checks the
// admin, re-validates its input and refreshes the cached landing page.

export type ShowcaseResult = { success: boolean; message: string; fieldErrors?: Record<string, string> };

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "casho.store";
const idSchema = z.string().uuid();

const STORE_SELECT = {
  id: true,
  slug: true,
  name: true,
  customDomain: true,
  customDomainStatus: true,
  subscriptionStatus: true,
} as const;

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/showcase");
}

async function findStore(ref: string) {
  const parsed = parseStoreRef(ref, ROOT_DOMAIN);
  if (!parsed) return null;
  return "slug" in parsed
    ? prisma.store.findUnique({ where: { slug: parsed.slug }, select: STORE_SELECT })
    : prisma.store.findUnique({ where: { customDomain: parsed.domain }, select: STORE_SELECT });
}

export type ShowcaseStoreLookup =
  | { found: true; slug: string; name: string; url: string; open: boolean }
  | { found: false; message: string };

/** Resolves a pasted slug / store link to the store the example will follow. */
export async function lookupShowcaseStoreAction(ref: string): Promise<ShowcaseStoreLookup> {
  await requireAdmin();
  const store = await findStore(String(ref ?? "").slice(0, 300));
  if (!store) return { found: false, message: "مفيش متجر على كاشو بالرابط أو الـ slug ده" };
  return {
    found: true,
    slug: store.slug,
    name: store.name,
    url: storePublicUrl(store),
    open: isStorefrontOpen(store.subscriptionStatus),
  };
}

/** Creates (id = null, added at the end) or updates one example. */
export async function saveShowcaseSiteAction(id: string | null, input: unknown): Promise<ShowcaseResult> {
  await requireAdmin();
  if (id !== null && !idSchema.safeParse(id).success) return { success: false, message: "المثال مش موجود" };

  const parsed = showcaseSiteSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "راجع البيانات", fieldErrors: fieldErrors(parsed.error) };
  const { storeSlug, url, ...rest } = parsed.data;

  let storeId: string | null = null;
  let finalUrl = url ?? "";
  if (storeSlug) {
    const store = await findStore(storeSlug);
    if (!store) return { success: false, message: "راجع البيانات", fieldErrors: { storeSlug: "مفيش متجر على كاشو بالـ slug ده" } };
    storeId = store.id;
    finalUrl = storePublicUrl(store);
  }

  const data = { ...rest, url: finalUrl, storeId };

  if (id === null) {
    const last = await prisma.showcaseSite.aggregate({ _max: { sortOrder: true } });
    await prisma.showcaseSite.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  } else {
    const updated = await prisma.showcaseSite.updateMany({ where: { id }, data });
    if (updated.count === 0) return { success: false, message: "المثال مش موجود" };
  }

  refresh();
  return { success: true, message: id === null ? `اتضاف «${rest.name}»` : `اتحفظ «${rest.name}»` };
}

export async function setShowcasePublishedAction(id: string, published: boolean): Promise<ShowcaseResult> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { success: false, message: "المثال مش موجود" };
  const updated = await prisma.showcaseSite.updateMany({ where: { id }, data: { published: published === true } });
  if (updated.count === 0) return { success: false, message: "المثال مش موجود" };
  refresh();
  return { success: true, message: published ? "ظاهر في الصفحة الرئيسية" : "اتخفى من الصفحة الرئيسية" };
}

/** Moves one example a step up or down; the whole list is renumbered 0…n so gaps and ties never pile up. */
export async function moveShowcaseSiteAction(id: string, direction: "up" | "down"): Promise<ShowcaseResult> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { success: false, message: "المثال مش موجود" };

  const rows = await prisma.showcaseSite.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const from = rows.findIndex((r) => r.id === id);
  if (from === -1) return { success: false, message: "المثال مش موجود" };
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= rows.length) return { success: true, message: "" };

  const ids = rows.map((r) => r.id);
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await prisma.$transaction(ids.map((rowId, index) => prisma.showcaseSite.update({ where: { id: rowId }, data: { sortOrder: index } })));

  refresh();
  return { success: true, message: "" };
}

export async function deleteShowcaseSiteAction(id: string): Promise<ShowcaseResult> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { success: false, message: "المثال مش موجود" };
  const deleted = await prisma.showcaseSite.deleteMany({ where: { id } });
  if (deleted.count === 0) return { success: false, message: "المثال مش موجود" };
  refresh();
  return { success: true, message: "اتمسح المثال" };
}
