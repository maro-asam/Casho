"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    /** Set once Casho's own pixel is initialized on this page (Casho hosts only). */
    __cashoMetaPixel?: boolean;
  }
}

/** A conversion the server already sent through CAPI; the browser repeats it with the same id so Meta dedupes. */
export type MetaBrowserEvent = { name: string; eventId: string; data?: Record<string, unknown> };

/**
 * Casho's own Meta pixel (platform marketing: landing, signup, dashboard).
 *
 * - Runs only on Casho's hosts (root, www, app, localhost), never on a
 *   storefront: there the merchant's pixel lives (StorePixels), and a second
 *   `fbq('init')` would copy every shopper event into Casho's pixel.
 * - `autoConfig` is off: Meta's automatic events treat every submit button as
 *   a "SubscribedButtonClick", so each "التالي" in the signup steps showed up
 *   as a subscription. Casho sends its conversions explicitly instead.
 */
export function MetaPixel({ rootDomain }: { rootDomain: string }) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  if (!pixelId || !/^\d{5,20}$/.test(pixelId)) return null;

  const root = JSON.stringify(rootDomain.toLowerCase());
  const id = JSON.stringify(pixelId);

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          (function () {
            // Not inside iframes (Studio preview, heatmap viewer): those aren't real visits.
            if (window.self !== window.top) return;
            var root = ${root};
            var host = location.hostname.toLowerCase();
            var cashoHost = host === root || host === "www." + root || host === "app." + root ||
              host === "localhost" || host === "app.localhost" || host === "127.0.0.1";
            if (!cashoHost || /^\\/store(\\/|$)/.test(location.pathname)) return;

            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('set', 'autoConfig', false, ${id});
            fbq('init', ${id});
            fbq('track', 'PageView');
            window.__cashoMetaPixel = true;
          })();
        `}
      </Script>
      <MetaPixelPageViews />
    </>
  );
}

/** The base code counts the first page; count each client-side navigation after it. */
function MetaPixelPageViews() {
  const pathname = usePathname();
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    if (firstPath.current === pathname) return;
    firstPath.current = pathname;
    trackMetaPixelEvent("PageView");
  }, [pathname]);

  return null;
}

export function trackMetaPixelEvent(
  eventName: string,
  data?: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === "undefined") return;
  if (!window.__cashoMetaPixel || !window.fbq) return;

  try {
    if (eventId) window.fbq("track", eventName, data || {}, { eventID: eventId });
    else window.fbq("track", eventName, data || {});
  } catch {
    // a broken pixel must never break the page
  }
}

/** Fires server-sent conversions (signup) in the browser too, with the same event ids. */
export function trackMetaBrowserEvents(events?: MetaBrowserEvent[]) {
  for (const event of events ?? []) trackMetaPixelEvent(event.name, event.data, event.eventId);
}
