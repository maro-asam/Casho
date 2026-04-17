export function buildStoreUrl(slug: string, path = "") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://casho.store";

  try {
    const url = new URL(appUrl);
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${url.protocol}//${slug}.${url.host}${path === "" ? "" : cleanPath}`;
  } catch {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `https://${slug}.casho.store${path === "" ? "" : cleanPath}`;
  }
}
