import { prisma } from "@/lib/prisma";
import { readConversionConfig, type RecentPurchase } from "@/lib/conversion/conversion-config";
import { isPopupType, readPopupConfig, type StorefrontPopup } from "@/lib/popups/popup-config";
import { PopupHost } from "./PopupHost";
import { PurchaseToasts } from "./PurchaseToasts";
import { WhatsAppButton } from "./WhatsAppButton";
import { OfferHost } from "../offers/OfferHost";
import { storeHasLiveOffers } from "@/lib/offers/storefront-offers";

type Props = { storeId: string; storeSlug: string };

/** Popups, upsell offers, WhatsApp button and live purchase toasts — everything that floats over the store. */
export async function StoreConversionLayer({ storeId, storeSlug }: Props) {
  // Isolated + guarded: a problem here must never take the storefront down.
  const settings = await (async () =>
    prisma.storeSettings.findUnique({ where: { storeId }, select: { conversionConfig: true, whatsappNumber: true } }))().catch(
    () => null,
  );
  const config = readConversionConfig(settings?.conversionConfig);
  const whatsappNumber = settings?.whatsappNumber;
  const now = new Date();

  const [popupRows, purchases, hasOffers] = await Promise.all([
    (async () =>
      prisma.storePopup.findMany({
        where: {
          storeId,
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          ],
        },
        orderBy: { priority: "desc" },
        take: 10,
        select: { id: true, type: true, priority: true, config: true, endsAt: true },
      }))().catch(() => []),
    config.purchaseToasts.enabled ? recentPurchases(storeId, config.purchaseToasts.lookbackDays) : Promise.resolve([]),
    storeHasLiveOffers(storeId).catch(() => false),
  ]);

  const popups = popupRows.filter((p) => isPopupType(p.type)).map((p) => ({ ...p, config: readPopupConfig(p.config) }));

  const couponCodes = popups.map((p) => p.config.content.couponCode).filter(Boolean);
  const coupons = couponCodes.length
    ? await prisma.coupon.findMany({
        where: { storeId, code: { in: couponCodes } },
        select: { code: true, expiresAt: true, isActive: true },
      }).catch(() => [])
    : [];

  const storefrontPopups: StorefrontPopup[] = popups
    // A discount popup whose coupon was disabled would hand out a dead code — skip it.
    .filter((p) => p.type !== "discount" || coupons.some((c) => c.code === p.config.content.couponCode && c.isActive))
    .map((p) => ({
      id: p.id,
      type: p.type as StorefrontPopup["type"],
      priority: p.priority,
      config: p.config,
      endsAt: p.endsAt?.toISOString() ?? null,
      couponExpiresAt: coupons.find((c) => c.code === p.config.content.couponCode)?.expiresAt?.toISOString() ?? null,
    }));

  const whatsappPhone = config.whatsapp.phone || whatsappNumber || "";
  const showWhatsApp = config.whatsapp.enabled && whatsappPhone.replace(/\D/g, "").length >= 10;
  const showToasts = config.purchaseToasts.enabled && purchases.length > 0;

  return (
    <>
      {/* Always mounted: with no live popups it renders nothing, but the visual builder can still preview one. */}
      <PopupHost storeSlug={storeSlug} popups={storefrontPopups} />
      {hasOffers && <OfferHost storeSlug={storeSlug} />}
      {showWhatsApp && <WhatsAppButton storeSlug={storeSlug} config={config.whatsapp} phone={whatsappPhone} />}
      {showToasts && (
        <PurchaseToasts
          storeSlug={storeSlug}
          config={config.purchaseToasts}
          purchases={purchases}
          stacked={showWhatsApp && config.whatsapp.position === config.purchaseToasts.position}
        />
      )}
    </>
  );
}

/** Real, non-canceled online orders → public-safe snippets (first name only, one product each). */
export async function recentPurchases(storeId: string, lookbackDays: number): Promise<RecentPurchase[]> {
  const since = new Date(Date.now() - lookbackDays * 86400_000);
  const orders = await prisma.order
    .findMany({
      where: { storeId, createdAt: { gte: since }, status: { not: "CANCELED" }, source: "ONLINE" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        fullName: true,
        createdAt: true,
        items: {
          take: 1,
          select: { product: { select: { name: true, slug: true, image: true, isActive: true } } },
        },
      },
    })
    .catch(() => []);

  return orders.flatMap((order) => {
    const product = order.items[0]?.product;
    if (!product || !product.isActive) return [];
    return [
      {
        firstName: order.fullName.trim().split(/\s+/)[0]?.slice(0, 20) || null,
        productName: product.name,
        productImage: product.image || null,
        productSlug: product.slug,
        createdAt: order.createdAt.toISOString(),
      },
    ];
  });
}
