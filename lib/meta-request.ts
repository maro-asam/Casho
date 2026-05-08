import { cookies, headers } from "next/headers";

export async function getMetaRequestContext() {
  const headersList = await headers();
  const cookiesList = await cookies();

  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || null;
  const userAgent = headersList.get("user-agent") || null;

  const referer = headersList.get("referer");
  const origin = headersList.get("origin");
  const host = headersList.get("host");

  const protocol =
    headersList.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  const fallbackUrl = host ? `${protocol}://${host}` : "https://casho.store";

  const eventSourceUrl = referer || origin || fallbackUrl;

  const fbp = cookiesList.get("_fbp")?.value || null;
  const fbc = cookiesList.get("_fbc")?.value || null;

  return {
    ip,
    userAgent,
    eventSourceUrl,
    fbp,
    fbc,
  };
}
