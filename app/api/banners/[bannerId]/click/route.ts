import { prisma } from "@/lib/prisma";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Storefront beacon: counts one click on a live banner. Fire-and-forget —
 *  always 204 so a tracking failure never surfaces to the shopper. */
export async function POST(_req: Request, { params }: { params: Promise<{ bannerId: string }> }) {
  const { bannerId } = await params;
  if (UUID.test(bannerId)) {
    try {
      await prisma.banner.updateMany({ where: { id: bannerId, isActive: true }, data: { clicks: { increment: 1 } } });
    } catch (error) {
      console.error("banner click:", error);
    }
  }
  return new Response(null, { status: 204 });
}
