import { withApiAuth } from "@/lib/api/middleware";
import { ok, err } from "@/lib/api/response";
import { ShippingService } from "@/lib/shipping/shipping-service";
import type { ApiContext } from "@/lib/api/types";
import { z } from "zod";

const AddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().min(8),
  city: z.string().min(1),
  district: z.string().optional(),
  street: z.string().min(1),
  buildingNumber: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  postalCode: z.string().optional(),
});

const CreateShipmentSchema = z.object({
  provider: z.enum(["bosta", "aramex"]),
  orderId: z.string().uuid().optional(),
  reference: z.string().optional(),
  receiver: AddressSchema,
  sender: AddressSchema.optional(),
  parcel: z.object({
    weightKg: z.number().positive(),
    lengthCm: z.number().positive().optional(),
    widthCm: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
    description: z.string().optional(),
  }),
  codAmountPiasters: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

async function createShipment(req: Request, ctx: ApiContext) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const parsed = CreateShipmentSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Validation error", 422, "VALIDATION_ERROR");
  }

  // Validate orderId belongs to this store if provided
  if (parsed.data.orderId) {
    const { prisma } = await import("@/lib/prisma");
    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, storeId: ctx.store.id },
      select: { id: true },
    });
    if (!order) return err("Order not found", 404);
  }

  try {
    const shipment = await ShippingService.createShipment(
      ctx.store.id,
      parsed.data.provider,
      parsed.data,
    );
    return ok(shipment, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Shipping provider error";
    return err(message, 502, "PROVIDER_ERROR");
  }
}

export const POST = withApiAuth(
  (req, ctx) => createShipment(req, ctx),
  { scope: "shipments:write" },
);
