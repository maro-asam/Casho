"use client";

// Loads the merchant's own ad pixels on the storefront and reports page views
// on client-side navigation plus add-to-cart (from the shared cart event).

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { isValidPixelId, type StorePixelConfig } from "@/lib/pixels/shared";
import { CART_UPDATED_EVENT, type CartAddedDetail } from "../../_themes/shared/cart-events";
import { markPixelsInstalled, trackPixelEvent } from "./pixel-events";

// Official base codes. Each one only defines a queueing stub and appends the
// vendor script, so it is safe to run synchronously. Ids are re-validated and
// JSON-encoded before they are printed into code.
const META_BASE = (id: string) => `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init',${JSON.stringify(id)});fbq('track','PageView');`;

const TIKTOK_BASE = (id: string) => `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=d.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load(${JSON.stringify(id)});ttq.page();}(window,document,'ttq');`;

const SNAP_BASE = (id: string) => `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
snaptr('init',${JSON.stringify(id)},{});snaptr('track','PAGE_VIEW');`;

function runInline(code: string) {
  const script = document.createElement("script");
  script.text = code;
  document.head.appendChild(script);
}

export function StorePixels({ config }: { config: StorePixelConfig }) {
  const pathname = usePathname();
  const firstPath = useRef<string | null>(null);

  // Install once per page load (the store layout persists across navigation).
  useEffect(() => {
    // The dashboard builder previews the store in an iframe — never count those visits.
    if (window.self !== window.top) return;
    const w = window as Window & { __cashoPixelsInstalled?: boolean };
    if (!w.__cashoPixelsInstalled) {
      w.__cashoPixelsInstalled = true;
      if (isValidPixelId("meta", config.meta)) runInline(META_BASE(config.meta));
      if (isValidPixelId("tiktok", config.tiktok)) runInline(TIKTOK_BASE(config.tiktok));
      if (isValidPixelId("snap", config.snap)) runInline(SNAP_BASE(config.snap));
    }
    markPixelsInstalled();
  }, [config.meta, config.tiktok, config.snap]);

  // The base codes count the landing page; count each client-side navigation after it.
  useEffect(() => {
    if (window.self !== window.top) return;
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    trackPixelEvent("PageView");
  }, [pathname]);

  useEffect(() => {
    function onCartUpdated(event: Event) {
      const added = (event as CustomEvent<CartAddedDetail | undefined>).detail;
      if (!added) return; // quantity changes / removals aren't add-to-cart
      trackPixelEvent("AddToCart", {
        eventId: added.eventId,
        value: added.price * added.quantity,
        currency: "EGP",
        contents: [{ id: added.productId, quantity: added.quantity, price: added.price, name: added.name }],
      });
    }
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, []);

  return null;
}
