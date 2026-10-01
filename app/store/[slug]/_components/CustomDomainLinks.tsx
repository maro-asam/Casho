"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

/**
 * Store links are built as absolute `https://<slug>.<root>/…` URLs. When the
 * store is opened on its custom domain, keep visitors there: rewrite those
 * hrefs to the current origin and navigate client-side.
 */
export function CustomDomainLinks({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();

  useEffect(() => {
    let storeOrigin: string;
    try {
      storeOrigin = new URL(buildStoreUrl(storeSlug)).origin;
    } catch {
      return;
    }
    const here = window.location.origin;
    // On the platform subdomain, or rendered under /store/<slug> (builder preview): nothing to do.
    if (here === storeOrigin || window.location.pathname.startsWith("/store/")) return;

    const fixHrefs = () => {
      document.querySelectorAll<HTMLAnchorElement>(`a[href^="${storeOrigin}"]`).forEach((a) => {
        a.setAttribute("href", here + a.getAttribute("href")!.slice(storeOrigin.length));
      });
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href);
      if (url.origin !== storeOrigin && url.origin !== here) return;
      if (url.origin === here && !a.dataset.cashoRewritten) return; // ordinary same-origin link: let Next handle it
      e.preventDefault();
      e.stopImmediatePropagation();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    };

    // Mark rewritten anchors so the click handler can take over their navigation.
    const mark = () => {
      document.querySelectorAll<HTMLAnchorElement>(`a[href^="${storeOrigin}"]`).forEach((a) => (a.dataset.cashoRewritten = "1"));
      fixHrefs();
    };

    mark();
    const observer = new MutationObserver(mark);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });
    document.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, [storeSlug, router]);

  return null;
}
