import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * Entry point of the Studio canvas: turns on Next draft mode for the store
 * owner, then sends the iframe to the requested store page. Draft mode only
 * changes what the owner sees (see lib/studio/storefront-draft.ts).
 */
export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const store = await prisma.store.findFirst({ where: { userId: session.userId }, select: { slug: true } });
  if (!store) return new Response("Store not found", { status: 404 });

  // Store-relative path only: no protocol-relative or backslash tricks.
  const raw = new URL(request.url).searchParams.get("path") ?? "/";
  const path = raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/";

  (await draftMode()).enable();
  redirect(`/store/${store.slug}${path === "/" ? "" : path}`);
}
