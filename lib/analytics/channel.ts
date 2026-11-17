/**
 * Traffic source classification (GA4-style default channel groups), from the
 * landing URL's UTM tags / click-id markers and the referrer's host. Pure.
 */

export const CHANNELS = [
  "direct",
  "organic_search",
  "paid_search",
  "organic_social",
  "paid_social",
  "email",
  "referral",
  "campaign",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  direct: "مباشر",
  organic_search: "بحث مجاني",
  paid_search: "بحث مدفوع",
  organic_social: "سوشيال مجاني",
  paid_social: "سوشيال مدفوع",
  email: "إيميل",
  referral: "مواقع أخرى (إحالة)",
  campaign: "حملات أخرى",
};

export const CHANNEL_DESCRIPTIONS: Record<Channel, string> = {
  direct: "من غير مصدر معروف: كتب العنوان، bookmark، أو تطبيق مبيبعتش المصدر.",
  organic_search: "جه من Google أو Bing أو أي محرك بحث من غير إعلان.",
  paid_search: "إعلان بحث: utm_medium = cpc/ppc/paid_search من محرك بحث، أو gclid/msclkid.",
  organic_social: "رابط من فيسبوك، إنستجرام، تيك توك، واتساب… من غير إعلان.",
  paid_social: "إعلان سوشيال: utm_medium مدفوع (paid/cpc/cpm/paid_social) من مصدر سوشيال، أو ttclid.",
  email: "utm_medium = email أو newsletter.",
  referral: "رابط من موقع تاني.",
  campaign: "عليه UTM بس مش من الأنواع اللي فوق.",
};

const SEARCH_HOSTS = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|ask|aol|naver|seznam|qwant|brave|startpage|sogou)\./i;
const SEARCH_SOURCES = /^(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|microsoft|search)$/i;

/** Social / messaging hosts → a normalised source name. */
const SOCIAL_HOSTS: [RegExp, string][] = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/i, "facebook"],
  [/(^|\.)(instagram\.com)$/i, "instagram"],
  [/(^|\.)(tiktok\.com)$/i, "tiktok"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/i, "x"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/i, "linkedin"],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, "youtube"],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/i, "pinterest"],
  [/(^|\.)(snapchat\.com)$/i, "snapchat"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/i, "whatsapp"],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/i, "telegram"],
  [/(^|\.)(reddit\.com)$/i, "reddit"],
  [/(^|\.)(threads\.net)$/i, "threads"],
];

/** utm_source aliases Meta and others put in ads ("fb", "ig", "an" = Audience Network). */
const SOURCE_ALIASES: Record<string, string> = {
  fb: "facebook",
  "facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "l.facebook.com": "facebook",
  meta: "facebook",
  ig: "instagram",
  "instagram.com": "instagram",
  an: "meta_audience_network",
  msg: "messenger",
  tt: "tiktok",
  twitter: "x",
  "x.com": "x",
  wa: "whatsapp",
  google_ads: "google",
  adwords: "google",
};

const SOCIAL_SOURCES = /^(facebook|instagram|messenger|meta_audience_network|tiktok|x|linkedin|youtube|pinterest|snapchat|whatsapp|telegram|reddit|threads)$/i;
const PAID_MEDIUM = /^(cpc|ppc|paid|paidsearch|paid_search|paid-search|cpm|cpv|cpa|cpp|display|banner|ads?|paid_social|paidsocial|paid-social|social_paid|sponsored|retargeting|remarketing)$/i;
const SOCIAL_MEDIUM = /^(social|social-network|social-media|sm|social network|social media|organic_social)$/i;
const EMAIL_MEDIUM = /^(email|e-mail|e_mail|newsletter|mail)$/i;

export type ChannelInput = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrerHost?: string | null;
  /** Click-id markers seen on the landing URL (values are never kept). */
  clickIds?: { gclid?: boolean; msclkid?: boolean; fbclid?: boolean; ttclid?: boolean };
  /** Hosts that count as "us" (a referral from them isn't a source). */
  ownHosts?: string[];
};

export function normaliseSource(source: string | null | undefined): string | null {
  const s = source?.trim().toLowerCase();
  if (!s) return null;
  return SOURCE_ALIASES[s] ?? s;
}

/** Social network behind a referrer host, if any. */
export function socialSourceOfHost(host: string): string | null {
  for (const [pattern, name] of SOCIAL_HOSTS) if (pattern.test(host)) return name;
  return null;
}

export function isSearchHost(host: string) {
  return SEARCH_HOSTS.test(`${host}.`) || /(^|\.)google\.[a-z.]+$/i.test(host);
}

/** Exact host match (after dropping "www."). */
export function isOwnHost(host: string | null | undefined, ownHosts: string[] = []) {
  if (!host) return false;
  const h = host.toLowerCase().replace(/^www\./, "");
  return ownHosts.some((own) => h === own.toLowerCase().replace(/^www\./, ""));
}

export function classifyChannel(input: ChannelInput): Channel {
  const source = normaliseSource(input.utmSource);
  const medium = input.utmMedium?.trim().toLowerCase() || "";
  const host = input.referrerHost?.toLowerCase() || "";
  const external = host && !isOwnHost(host, input.ownHosts) ? host : "";
  const clicks = input.clickIds ?? {};

  const socialSource = (source && SOCIAL_SOURCES.test(source)) || (external && socialSourceOfHost(external));
  const searchSource = (source && SEARCH_SOURCES.test(source)) || (external && isSearchHost(external));

  if (EMAIL_MEDIUM.test(medium) || (source && /mail|newsletter/.test(source))) return "email";

  if (PAID_MEDIUM.test(medium)) {
    if (/social/.test(medium) || socialSource) return "paid_social";
    if (searchSource || /search/.test(medium)) return "paid_search";
    return "campaign";
  }
  if (clicks.gclid || clicks.msclkid) return "paid_search";
  if (clicks.ttclid) return "paid_social";

  if (SOCIAL_MEDIUM.test(medium)) return "organic_social";
  if (source || medium || input.utmCampaign) {
    if (socialSource) return "organic_social";
    if (searchSource) return "organic_search";
    return "campaign";
  }

  if (!external) return "direct";
  if (socialSourceOfHost(external)) return "organic_social";
  if (isSearchHost(external)) return "organic_search";
  return "referral";
}

/** "facebook", "google", "instagram"… — the source label reports group by. */
export function sourceLabel(input: { utmSource?: string | null; referrerHost?: string | null; ownHosts?: string[] }): string {
  const utm = normaliseSource(input.utmSource);
  if (utm) return utm;
  const host = input.referrerHost?.toLowerCase();
  if (!host || isOwnHost(host, input.ownHosts)) return "(direct)";
  const social = socialSourceOfHost(host);
  if (social) return social;
  const search = host.match(/(?:^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia)\./i);
  if (search) return search[1].toLowerCase();
  return host.replace(/^www\./, "");
}
