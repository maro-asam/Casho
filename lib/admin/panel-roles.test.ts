import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAnalyticsFilter, withoutStorefronts } from "@/lib/analytics/filters";
import { MEDIA_BUYER_HOME, canOpenAdminPanel, isAdminRole, mediaBuyerMayOpen } from "./panel-roles";

describe("who opens the admin panel", () => {
  it("admins get everything, media buyers the shell, nobody else", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("SUPER_ADMIN")).toBe(true);
    expect(isAdminRole("MEDIA_BUYER")).toBe(false);
    expect(canOpenAdminPanel("MEDIA_BUYER")).toBe(true);
    expect(canOpenAdminPanel("USER")).toBe(false);
    expect(canOpenAdminPanel("SALES")).toBe(false);
  });

  it("a media buyer stays inside the Analytics Center, minus stores and settings", () => {
    expect(mediaBuyerMayOpen(MEDIA_BUYER_HOME)).toBe(true);
    expect(mediaBuyerMayOpen("/admin/analytics/campaigns")).toBe(true);
    expect(mediaBuyerMayOpen("/admin/analytics/journeys/abc")).toBe(true);
    expect(mediaBuyerMayOpen("/admin/analytics/stores")).toBe(false);
    expect(mediaBuyerMayOpen("/admin/analytics/settings")).toBe(false);
    expect(mediaBuyerMayOpen("/admin")).toBe(false);
    expect(mediaBuyerMayOpen("/admin/stores")).toBe(false);
    expect(mediaBuyerMayOpen("/admin/analyticsx")).toBe(false);
  });
});

describe("a media buyer's filters never reach a storefront", () => {
  const STORE = "0b4c9c3e-6a7d-4c8e-9f12-3456789abcde";
  const pin = (params: Record<string, string | undefined>) => withoutStorefronts(parseAnalyticsFilter(params));

  it("keeps Casho's own scopes", () => {
    expect(pin({}).scope).toBe("marketing");
    expect(pin({ scope: "app" }).scope).toBe("app");
  });

  it("drops storefronts, one store and 'all' back to the Casho site", () => {
    for (const params of [{ scope: "storefront" }, { scope: "all" }, { store: STORE }, { scope: "app", store: STORE }]) {
      const f = pin(params);
      expect(f.scope).toBe("marketing");
      expect(f.storeId).toBeNull();
    }
  });

  it("keeps the rest of the view (range, device)", () => {
    const f = pin({ range: "7d", device: "mobile", store: STORE });
    expect(f.preset).toBe("7d");
    expect(f.device).toBe("mobile");
  });
});

/**
 * Layouts don't re-render on client navigation, so the admin layout can't keep a
 * media buyer out of the rest of the panel: every page has to check for itself.
 */
describe("every admin page guards itself", () => {
  const ROOT = path.resolve(import.meta.dirname, "../../app/admin");
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? files(full) : [full];
    });
  const pages = files(ROOT).filter((f) => /\/(page|layout)\.tsx$/.test(f) && f !== path.join(ROOT, "layout.tsx"));
  const rel = (f: string) => path.relative(ROOT, f);
  const isClient = (src: string) => /^\s*["']use client["']/.test(src);

  it("outside the Analytics Center: requireAdminPage()", () => {
    expect(pages.length).toBeGreaterThan(40); // the scan found the panel
    const missing = pages
      .filter((f) => !rel(f).startsWith("analytics/"))
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        return !isClient(src) && !src.includes("requireAdminPage()");
      })
      .map(rel);
    expect(missing).toEqual([]);
  });

  it("inside it: filters only through the viewer (a media buyer is pinned to Casho's traffic)", () => {
    const unpinned = pages
      .filter((f) => rel(f).startsWith("analytics/"))
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        return src.includes("parseAnalyticsFilter(") && !src.includes("requireStorefrontViewer()");
      })
      .map(rel);
    expect(unpinned).toEqual([]);
  });
});
