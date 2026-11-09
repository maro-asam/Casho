import { prisma } from "@/lib/prisma";
import { isValidPixelId } from "@/lib/pixels/shared";
import { readStoredPolicies, type PolicyTemplateContext, type StoredPolicies } from "./index";

export type StorePolicySettings = {
  stored: StoredPolicies;
  requireTermsAtCheckout: boolean;
};

export type StorePolicyData = StorePolicySettings & {
  /** Fills the ready-made templates. */
  context: PolicyTemplateContext;
};

/** The merchant's policy settings alone — enough for links and the checkout consent. */
export async function loadPolicySettings(storeId: string): Promise<StorePolicySettings> {
  const settings = await prisma.storeSettings.findUnique({
    where: { storeId },
    select: { policies: true, requireTermsAtCheckout: true },
  });
  return {
    stored: readStoredPolicies(settings?.policies),
    requireTermsAtCheckout: settings?.requireTermsAtCheckout ?? false,
  };
}

/** Everything needed to show (or edit) one store's policies, templates included. */
export async function loadStorePolicies(storeId: string): Promise<StorePolicyData | null> {
  const [store, digital] = await Promise.all([
    prisma.store.findUnique({
      where: { id: storeId },
      select: {
        name: true,
        settings: { select: { policies: true, requireTermsAtCheckout: true, email: true, whatsappNumber: true } },
        pixelSettings: { select: { metaPixelId: true, tiktokPixelId: true, snapPixelId: true } },
      },
    }),
    prisma.product.findFirst({ where: { storeId, isDigital: true, isActive: true }, select: { id: true } }),
  ]);
  if (!store) return null;

  const px = store.pixelSettings;
  const adPlatforms = [
    isValidPixelId("meta", px?.metaPixelId) && "Meta",
    isValidPixelId("tiktok", px?.tiktokPixelId) && "TikTok",
    isValidPixelId("snap", px?.snapPixelId) && "Snapchat",
  ].filter((name): name is string => !!name);

  return {
    stored: readStoredPolicies(store.settings?.policies),
    requireTermsAtCheckout: store.settings?.requireTermsAtCheckout ?? false,
    context: {
      storeName: store.name,
      email: store.settings?.email ?? null,
      whatsapp: store.settings?.whatsappNumber ?? null,
      hasDigital: !!digital,
      adPlatforms,
    },
  };
}
