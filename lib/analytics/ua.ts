/**
 * Minimal user-agent reading for aggregate reports: browser family, OS family
 * and device category. Only these three labels are stored — never the raw
 * user agent — and nothing here tries to tell one device from another.
 */

export type UaInfo = { browser: string; os: string; device: "desktop" | "tablet" | "mobile" };

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp|telegrambot|discordbot|embedly|bingpreview|vercel-screenshot|google-inspectiontool|chrome-lighthouse|python-requests|curl\/|wget|axios|node-fetch|go-http-client|phantomjs|puppeteer|playwright|selenium/i;

export function isBotUserAgent(ua: string | null | undefined) {
  if (!ua) return true;
  return BOT.test(ua);
}

function browserOf(ua: string): string {
  // In-app browsers first: they embed the platform browser's token too.
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "Facebook App";
  if (/Instagram/i.test(ua)) return "Instagram App";
  if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) return "TikTok App";
  if (/Snapchat/i.test(ua)) return "Snapchat App";
  if (/\bLine\//i.test(ua)) return "Line App";
  if (/Edg(e|A|iOS)?\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser\//.test(ua)) return "Samsung Internet";
  if (/YaBrowser\//.test(ua)) return "Yandex";
  if (/UCBrowser\//.test(ua)) return "UC Browser";
  if (/Firefox\/|FxiOS\//.test(ua)) return "Firefox";
  if (/CriOS\//.test(ua)) return "Chrome";
  if (/Chrome\/|Chromium\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "Safari";
  if (/AppleWebKit/.test(ua) && /Mobile\//.test(ua)) return "Safari"; // iOS web views
  return "Other";
}

function osOf(ua: string): string {
  if (/Windows NT/.test(ua)) return "Windows";
  if (/iPhone|iPod/.test(ua)) return "iOS";
  if (/iPad/.test(ua)) return "iPadOS";
  if (/Android/.test(ua)) return "Android";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

/**
 * `touchPoints` (navigator.maxTouchPoints) tells an iPad in desktop mode —
 * which sends a Mac user agent — from a real Mac.
 */
export function parseUserAgent(ua: string, touchPoints = 0): UaInfo {
  const browser = browserOf(ua);
  let os = osOf(ua);
  let device: UaInfo["device"] = "desktop";

  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = "tablet";
  else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|Opera Mini/i.test(ua)) device = "mobile";

  if (os === "macOS" && touchPoints > 1) {
    os = "iPadOS";
    device = "tablet";
  }
  return { browser, os, device };
}
