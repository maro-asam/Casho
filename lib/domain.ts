export function getSubdomain(host: string | null) {
  if (!host) return null;

  const hostname = host.split(":")[0].toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "casho.store" ||
    hostname === "www.casho.store"
  ) {
    return null;
  }

  if (hostname.endsWith(".localhost")) {
    return hostname.split(".")[0];
  }

  if (hostname.endsWith(".casho.store")) {
    const parts = hostname.split(".");
    return parts[0] || null;
  }

  return null;
}
