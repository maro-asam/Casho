import { withApiAuth } from "@/lib/api/middleware";
import { ok, err } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { ShippingService } from "@/lib/shipping/shipping-service";
import type { ApiContext } from "@/lib/api/types";

async function getShipment(req: Request, ctx: ApiContext, params: { id: string }) {
  const url = new URL(req.url);
  const live = url.searchParams.get("live") === "true";

  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, storeId: ctx.store.id },
  });

  if (!shipment) return err("Shipment not found", 404);

  if (live && shipment.trackingNumber) {
    try {
      const tracking = await ShippingService.trackShipment(shipment.id);
      return ok({ shipment, tracking });
    } catch (e) {
      // Return DB state if live tracking fails
      return ok({ shipment, tracking: null, trackingError: (e as Error).message });
    }
  }

  return ok(shipment);
}

export const GET = withApiAuth(
  (req, ctx, params: { id: string }) => getShipment(req, ctx, params),
  { scope: "shipments:read" },
);
