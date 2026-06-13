import { withApiAuth } from "@/lib/api/middleware";
import { ok, err } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { ShippingService } from "@/lib/shipping/shipping-service";
import type { ApiContext } from "@/lib/api/types";

async function cancelShipment(req: Request, ctx: ApiContext, params: { id: string }) {
  const shipment = await prisma.shipment.findFirst({
    where: { id: params.id, storeId: ctx.store.id },
    select: { id: true, status: true },
  });

  if (!shipment) return err("Shipment not found", 404);

  if (shipment.status === "CANCELED") {
    return err("Shipment is already canceled", 409, "ALREADY_CANCELED");
  }

  if (shipment.status === "DELIVERED") {
    return err("Cannot cancel a delivered shipment", 409, "ALREADY_DELIVERED");
  }

  try {
    await ShippingService.cancelShipment(shipment.id);
    return ok({ id: shipment.id, status: "CANCELED" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not cancel shipment";
    return err(message, 502, "PROVIDER_ERROR");
  }
}

export const POST = withApiAuth(
  (req, ctx, params: { id: string }) => cancelShipment(req, ctx, params),
  { scope: "shipments:write" },
);
