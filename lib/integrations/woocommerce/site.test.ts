import { describe, it, expect, vi } from "vitest";
import {
  assertPublicHost,
  discoverSite,
  isBlockedHostname,
  isPrivateAddress,
  normalizeSiteUrl,
  parseWordPressJson,
  safeFetch,
  SiteError,
  siteKey,
  type LookupFn,
} from "./site";

const publicLookup: LookupFn = async () => [{ address: "93.184.216.34", family: 4 }];

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" }, ...init });
}

const INDEX = { name: "Acme &amp; Co", home: "https://acme.com", url: "https://acme.com", namespaces: ["wp/v2", "wc/v3", "wc/store/v1"] };

/** fetch stub answering by URL. */
function router(routes: Record<string, () => Response>) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    void init;
    const key = String(url);
    const handler = routes[key];
    if (!handler) return new Response("<html>not found</html>", { status: 404 });
    return handler();
  });
}

async function siteError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (err) {
    if (err instanceof SiteError) return err.code;
    throw err;
  }
  throw new Error("expected a SiteError");
}

describe("normalizeSiteUrl", () => {
  it.each([
    ["acme.com", "https://acme.com"],
    ["  https://Acme.com/  ", "https://acme.com"],
    ["http://acme.com", "https://acme.com"],
    ["https://www.acme.com/wp-admin/edit.php?post_type=product", "https://www.acme.com"],
    ["https://acme.com/shop/product/blue-shirt/", "https://acme.com/shop"],
    ["https://acme.com/store/wp-json/wc/v3", "https://acme.com/store"],
    ["acme.com:443", "https://acme.com"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeSiteUrl(input)).toBe(expected);
  });

  it.each(["", "localhost", "http://127.0.0.1", "https://10.0.0.5", "https://[::1]/", "intranet", "printer.local", "https://acme.com:8443", "https://user:pass@acme.com", "ftp://acme.com", "javascript:alert(1)"])(
    "rejects %s",
    (input) => {
      expect(normalizeSiteUrl(input)).toBeNull();
    },
  );

  it("siteKey drops the scheme only", () => {
    expect(siteKey("https://www.acme.com/shop")).toBe("www.acme.com/shop");
  });
});

describe("address safety", () => {
  it.each(["localhost", "127.0.0.1", "foo", "db.internal", "nas.lan", "[::1]", "x.localhost"])("blocks hostname %s", (host) => {
    expect(isBlockedHostname(host)).toBe(true);
  });

  it.each([
    "10.1.2.3",
    "127.0.0.1",
    "169.254.169.254",
    "172.20.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "::",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "64:ff9b::a9fe:a9fe",
  ])("%s is private", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(["93.184.216.34", "8.8.8.8", "2606:4700::6810:84e5", "::ffff:8.8.8.8"])("%s is public", (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });

  it("refuses a public name that resolves to a private address", async () => {
    const lookup: LookupFn = async () => [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.7", family: 4 }];
    expect(await siteError(assertPublicHost("evil.example.com", lookup))).toBe("invalid_site");
  });

  it("DNS failure is 'unreachable'", async () => {
    const lookup: LookupFn = async () => {
      throw new Error("ENOTFOUND");
    };
    expect(await siteError(assertPublicHost("nope.acme.com", lookup))).toBe("unreachable");
  });
});

describe("safeFetch", () => {
  it("re-checks every redirect hop", async () => {
    const lookup: LookupFn = vi.fn(async (host: string) => [{ address: host === "acme.com" ? "93.184.216.34" : "10.0.0.1", family: 4 }]);
    const fetchImpl = router({
      "https://acme.com/wp-json/": () => new Response(null, { status: 301, headers: { location: "https://internal.acme-cdn.com/" } }),
    });
    expect(await siteError(safeFetch("https://acme.com/wp-json/", {}, { fetchImpl, lookup }))).toBe("invalid_site");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("refuses a redirect to plain http", async () => {
    const fetchImpl = router({
      "https://acme.com/a": () => new Response(null, { status: 302, headers: { location: "http://acme.com/b" } }),
    });
    expect(await siteError(safeFetch("https://acme.com/a", {}, { fetchImpl, lookup: publicLookup }))).toBe("invalid_site");
  });

  it("keeps credentialed requests on the same origin", async () => {
    const fetchImpl = router({
      "https://acme.com/a": () => new Response(null, { status: 302, headers: { location: "https://other.com/a" } }),
    });
    await expect(safeFetch("https://acme.com/a", {}, { fetchImpl, lookup: publicLookup, sameOriginOnly: true })).rejects.toThrow(/another origin/);
  });

  it("always sends a User-Agent and never follows redirects automatically", async () => {
    const fetchImpl = router({ "https://acme.com/a": () => json({}) });
    await safeFetch("https://acme.com/a", {}, { fetchImpl, lookup: publicLookup });
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    expect(init.redirect).toBe("manual");
    expect((init.headers as Record<string, string>)["User-Agent"]).toMatch(/Casho/);
  });
});

describe("parseWordPressJson", () => {
  it("reads JSON behind a BOM or PHP notices", () => {
    expect(parseWordPressJson('﻿{"a":1}')).toEqual({ a: 1 });
    expect(parseWordPressJson('<br /><b>Notice</b>: Undefined index in x.php<br />\n[{"id":1}]')).toEqual([{ id: 1 }]);
    expect(() => parseWordPressJson("<html>Maintenance</html>")).toThrow();
  });
});

describe("discoverSite", () => {
  it("finds WordPress + WooCommerce and returns the canonical home", async () => {
    const fetchImpl = router({
      "https://acme.com/wp-json/": () => json({ ...INDEX, home: "https://www.acme.com" }),
      "https://www.acme.com/wp-json/": () => json({ ...INDEX, home: "https://www.acme.com" }),
    });
    expect(await discoverSite("acme.com", { fetchImpl, lookup: publicLookup })).toEqual({ home: "https://www.acme.com", name: "Acme & Co" });
  });

  it("falls back to the site root when the pasted path isn't the install", async () => {
    const fetchImpl = router({ "https://acme.com/wp-json/": () => json(INDEX) });
    expect((await discoverSite("https://acme.com/shop/", { fetchImpl, lookup: publicLookup })).home).toBe("https://acme.com");
  });

  it("keeps the probed URL when the declared home doesn't answer", async () => {
    const fetchImpl = router({ "https://acme.com/wp-json/": () => json({ ...INDEX, home: "https://old.acme.com" }) });
    expect((await discoverSite("acme.com", { fetchImpl, lookup: publicLookup })).home).toBe("https://acme.com");
  });

  it("WordPress without WooCommerce", async () => {
    const fetchImpl = router({ "https://acme.com/wp-json/": () => json({ ...INDEX, namespaces: ["wp/v2"] }) });
    expect(await siteError(discoverSite("acme.com", { fetchImpl, lookup: publicLookup }))).toBe("no_woocommerce");
  });

  it("plain permalinks (REST only on ?rest_route=)", async () => {
    const fetchImpl = router({ "https://acme.com/?rest_route=/": () => json(INDEX) });
    expect(await siteError(discoverSite("acme.com", { fetchImpl, lookup: publicLookup }))).toBe("plain_permalinks");
  });

  it("a firewall answering instead of WordPress", async () => {
    const fetchImpl = router({
      "https://acme.com/wp-json/": () => new Response("<html>Access denied</html>", { status: 403 }),
      "https://acme.com/?rest_route=/": () => new Response("<html>Access denied</html>", { status: 403 }),
    });
    expect(await siteError(discoverSite("acme.com", { fetchImpl, lookup: publicLookup }))).toBe("rest_blocked");
  });

  it("not a WordPress site", async () => {
    const fetchImpl = router({});
    expect(await siteError(discoverSite("acme.com", { fetchImpl, lookup: publicLookup }))).toBe("not_wordpress");
  });

  it("unreachable site", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await siteError(discoverSite("acme.com", { fetchImpl, lookup: publicLookup }))).toBe("unreachable");
  });

  it("never requests an internal address", async () => {
    const fetchImpl = vi.fn();
    const lookup: LookupFn = async () => [{ address: "169.254.169.254", family: 4 }];
    expect(await siteError(discoverSite("metadata.acme.com", { fetchImpl, lookup }))).toBe("invalid_site");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
