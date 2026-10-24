// Email HTML building blocks: table layout + inline styles (what Gmail and
// Outlook render), RTL, branded with the store's logo and primary color.
// Pure — every value a customer or merchant typed goes through esc().

import { formatPiastersAsEgp } from "@/lib/notifications/in-app";

export type EmailBrand = {
  name: string;
  logo: string | null;
  /** Buttons and the header rule; any non-hex value falls back to near-black. */
  accent: string | null;
  /** Storefront home, for the logo link and the footer. */
  url: string;
};

export type EmailLine = { name: string; detail?: string; quantity: number; total: number };

export type EmailTotals = { subtotal: number; shipping: number; discount: number; total: number };

const FONT = "Tahoma, 'Segoe UI', Arial, sans-serif";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

export function esc(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function accentOf(brand: EmailBrand) {
  return brand.accent && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(brand.accent) ? brand.accent : "#111827";
}

const money = formatPiastersAsEgp;

/** Label/value rows (customer, address, payment…). Empty values are dropped. */
export function infoRows(rows: { label: string; value: string | null | undefined; ltr?: boolean }[]) {
  const shown = rows.filter((r) => r.value && r.value.trim());
  if (shown.length === 0) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">${shown
    .map(
      (r) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:14px;width:34%;vertical-align:top;">${esc(r.label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:14px;white-space:pre-line;"${r.ltr ? ' dir="ltr" align="right"' : ""}>${esc(r.value)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

/** What was ordered, with the bill under it. */
export function itemsTable(lines: EmailLine[], totals: EmailTotals) {
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;">
          ${esc(l.name)} <span style="color:${MUTED};">× ${esc(l.quantity)}</span>
          ${l.detail ? `<div style="color:${MUTED};font-size:12px;margin-top:2px;">${esc(l.detail)}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;text-align:left;white-space:nowrap;">${money(l.total)}</td>
      </tr>`,
    )
    .join("");

  const sum = (label: string, value: string, strong = false) => `<tr>
      <td style="padding:4px 0;font-size:${strong ? 16 : 14}px;${strong ? "font-weight:bold;" : `color:${MUTED};`}">${esc(label)}</td>
      <td style="padding:4px 0;font-size:${strong ? 16 : 14}px;text-align:left;white-space:nowrap;${strong ? "font-weight:bold;" : ""}">${value}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px;">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
      ${sum("المجموع الفرعي", money(totals.subtotal))}
      ${sum("الشحن", totals.shipping === 0 ? "مجاني" : money(totals.shipping))}
      ${totals.discount > 0 ? sum("الخصم", `− ${money(totals.discount)}`) : ""}
      ${sum("الإجمالي", money(totals.total), true)}
    </table>`;
}

/** Highlighted box, e.g. a risk warning or tracking details. */
export function notice(html: string, tone: "info" | "warning" = "info") {
  const [bg, border] = tone === "warning" ? ["#fef3c7", "#f59e0b"] : ["#f3f4f6", BORDER];
  return `<div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:14px 16px;margin:0 0 20px;font-size:14px;line-height:1.8;">${html}</div>`;
}

export function sectionTitle(text: string) {
  return `<h2 style="margin:0 0 8px;font-size:15px;">${esc(text)}</h2>`;
}

export function renderEmail(input: {
  brand: EmailBrand;
  /** Inbox preview line. */
  preheader: string;
  heading: string;
  intro: string;
  /** Trusted HTML from the helpers above. */
  body?: string;
  cta?: { label: string; href: string };
  footer: string;
}) {
  const { brand } = input;
  const accent = accentOf(brand);
  const header = brand.logo
    ? `<img src="${esc(brand.logo)}" alt="${esc(brand.name)}" height="48" style="height:48px;max-width:180px;object-fit:contain;border:0;">`
    : `<span style="font-size:20px;font-weight:bold;color:#111827;">${esc(brand.name)}</span>`;

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(input.heading)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f4;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(input.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="max-width:560px;background:#ffffff;border-radius:16px;border-top:4px solid ${accent};font-family:${FONT};color:#111827;text-align:right;">
      <tr><td style="padding:24px 24px 8px;"><a href="${esc(brand.url)}" style="text-decoration:none;">${header}</a></td></tr>
      <tr><td style="padding:8px 24px 24px;line-height:1.8;">
        <h1 style="margin:0 0 8px;font-size:22px;">${esc(input.heading)}</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#374151;">${esc(input.intro)}</p>
        ${input.body ?? ""}
        ${
          input.cta
            ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:12px;background:${accent};">
                <a href="${esc(input.cta.href)}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">${esc(input.cta.label)}</a>
              </td></tr></table>`
            : ""
        }
      </td></tr>
      <tr><td style="padding:16px 24px 24px;border-top:1px solid ${BORDER};font-size:12px;color:${MUTED};line-height:1.7;">${esc(input.footer)}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
