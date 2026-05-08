"use server";

import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { getMetaRequestContext } from "@/lib/meta-request";


type TrackStoreRegistrationInput = {
  storeId: string;
  storeSlug?: string | null;
  storeName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userName?: string | null;
};

export async function TrackStoreRegistrationAction(
  input: TrackStoreRegistrationInput,
) {
  try {
    if (!input.storeId) {
      return {
        success: false,
        message: "Missing storeId",
      };
    }

    const { ip, userAgent, eventSourceUrl, fbp, fbc } =
      await getMetaRequestContext();

    const customData = {
      store_id: input.storeId,
      store_slug: input.storeSlug || undefined,
      store_name: input.storeName || undefined,
    };

    const userData = {
      email: input.userEmail,
      phone: input.userPhone,
      firstName: input.userName,
    };

    const result = await sendMetaCapiEvent({
      eventName: "CompleteRegistration",
      eventSourceUrl,
      ip,
      userAgent,
      fbp,
      fbc,

      ...userData,

      customData,
    });

    await sendMetaCapiEvent({
      eventName: "Lead",
      eventSourceUrl,
      ip,
      userAgent,
      fbp,
      fbc,

      ...userData,

      customData,
    });

    return {
      success: result.ok,
    };
  } catch (error) {
    console.error("TrackStoreRegistrationAction error:", error);

    return {
      success: false,
      message: "Failed to track registration",
    };
  }
}
