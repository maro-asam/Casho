import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { storePageMetadata } from "@/lib/seo/page-meta";
import { prisma } from "@/lib/prisma";
import {
  POLICY_LABELS,
  isPolicyType,
  parsePolicy,
  policyPath,
  resolvePolicy,
  visiblePolicyTypes,
} from "@/lib/store-policies";
import { loadStorePolicies } from "@/lib/store-policies/server";
import { getStorefrontTheme } from "../../_themes";
import { getStoreThemeId, getStorefrontClosure } from "../../_lib/storefront";
import { st, storeLocale } from "@/lib/i18n/storefront";
import { loadStoreLocale } from "@/lib/i18n/storefront/server";

type PolicyRouteProps = {
  params: Promise<{ slug: string; type: string }>;
};

export async function generateMetadata({ params }: PolicyRouteProps): Promise<Metadata> {
  const { slug, type } = await params;
  await loadStoreLocale(slug);
  if (!isPolicyType(type)) return {};
  const store = await prisma.store.findUnique({ where: { slug }, select: { name: true } });
  const title = st(POLICY_LABELS[type].title);
  return storePageMetadata({
    title,
    description: store ? st("{0} في {1}.", title, store.name) : undefined,
    path: policyPath(type),
    storeName: store?.name,
  });
}

/** A store's legal page: the merchant's text, or the ready-made template (lib/store-policies). */
export default async function PolicyRoute({ params }: PolicyRouteProps) {
  const { slug, type } = await params;
  await loadStoreLocale(slug);
  if (!slug || !isPolicyType(type)) return notFound();

  const store = await prisma.store.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
  if (!store) return notFound();

  const theme = getStorefrontTheme(await getStoreThemeId(slug));
  const closure = await getStorefrontClosure(store.id);
  if (closure) return <theme.StoreClosed storeSlug={store.slug} pause={closure.pause} />;

  const data = await loadStorePolicies(store.id);
  const visible = data ? visiblePolicyTypes(data.stored) : [];
  if (!data || !visible.includes(type)) return notFound();

  // The page's language (the Studio draft's while the owner previews) picks the template.
  const policy = resolvePolicy(data.stored, type, { ...data.context, language: storeLocale() });

  return (
    <theme.Policy
      store={{ name: store.name, slug: store.slug }}
      policy={{ type, title: st(policy.title), blocks: parsePolicy(policy.body), updatedAt: policy.updatedAt }}
      policies={visible.map((t) => ({ type: t, title: st(POLICY_LABELS[t].title), short: st(POLICY_LABELS[t].short) }))}
    />
  );
}
