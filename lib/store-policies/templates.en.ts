// Ready-made English policy texts for stores whose language is English —
// the same commitments as the Arabic templates (./templates), clause for
// clause: Egypt's Consumer Protection Law (181/2018) and Personal Data
// Protection Law (151/2020). Keep both files in step when a clause changes.
//
// Format: see parsePolicy in ./index.ts ("#" headings, "-" bullets).

import type { PolicyType } from "./index";
import type { PolicyTemplateContext } from "./templates";

const join = (lines: (string | false | null | undefined)[]) =>
  lines.filter((line): line is string => typeof line === "string").join("\n");

function contactSection(ctx: PolicyTemplateContext) {
  const email = ctx.email?.trim();
  const whatsapp = ctx.whatsapp?.trim();
  const line =
    whatsapp && email
      ? `For any question, contact us on WhatsApp at ${whatsapp} or by email at ${email}.`
      : whatsapp
        ? `For any question, contact us on WhatsApp at ${whatsapp}.`
        : email
          ? `For any question, contact us by email at ${email}.`
          : `For any question, contact us from the store's "Contact us" page.`;
  return join(["", "# Contact us", line]);
}

function contactShort(ctx: PolicyTemplateContext) {
  if (ctx.whatsapp?.trim() && ctx.email?.trim()) return "on WhatsApp or by email";
  if (ctx.whatsapp?.trim()) return "on WhatsApp";
  if (ctx.email?.trim()) return "by email";
  return `from the "Contact us" page`;
}

function listAnd(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function returnsTemplate(ctx: PolicyTemplateContext) {
  return join([
    `At ${ctx.storeName}, we want every order to arrive exactly as you expect. If you need to return or exchange a product, this policy explains your rights and the steps to take, in line with Egyptian Consumer Protection Law No. 181 of 2018.`,
    "",
    "# Return and exchange period",
    "- You may return or exchange a product within 14 days of receiving it, without giving a reason.",
    "- If the product arrives damaged or defective, or differs from its description or from what you ordered, you may return or exchange it within 30 days of receiving it.",
    "",
    "# Conditions for a return",
    "- The product must be in the condition you received it in, unused, with its accessories and original packaging.",
    "- You need your order number or invoice.",
    "",
    "# Products that can't be returned",
    "Unless they are defective or differ from their description, the following can't be returned:",
    "- Perishable products, such as food and flowers.",
    "- Personal care products and underwear once their packaging is opened, for hygiene reasons.",
    "- Products made or altered especially for your order.",
    ctx.hasDigital && "- Digital products once the download link has been sent.",
    "",
    "# How to return or exchange",
    `- Contact us ${contactShort(ctx)} with your order number and the reason for the return. If the product is defective, a photo helps.`,
    "- We confirm your request and agree with you on how and when the product is collected.",
    "- Once we receive and inspect the product, we send you the replacement or refund your money.",
    "",
    "# Shipping costs",
    "- If the product is defective, differs from its description, or isn't what you ordered, we cover the full shipping cost.",
    "- Otherwise, the customer covers the cost of shipping the returned product.",
    "",
    "# Refunds",
    "- We refund you using the payment method you used. For cash-on-delivery orders, we agree with you on how to refund you (bank transfer or mobile wallet).",
    "- Refunds are made within 7 business days of receiving and inspecting the returned product. The amount may take longer to appear in your account, depending on your bank or wallet.",
    contactSection(ctx),
  ]);
}

function shippingTemplate(ctx: PolicyTemplateContext) {
  return join([
    `This policy explains how ${ctx.storeName} delivers your orders, and how long and how much delivery is expected to take.`,
    "",
    "# Delivery areas",
    "We deliver within Egypt, to the governorates available on the checkout page.",
    "",
    "# Shipping cost",
    "The shipping cost depends on your governorate. It appears on the checkout page as part of the total before you confirm your order, with no hidden fees.",
    "",
    "# Delivery time",
    "- We usually prepare your order and hand it to the shipping company within 1 to 3 business days of confirming it.",
    "- Orders usually arrive within 2 to 7 business days, depending on the governorate.",
    "- Delivery may take longer during sales and holidays or for reasons beyond our control. We'll let you know if that happens.",
    "",
    "# Order confirmation and tracking",
    "- We may call you or message you on WhatsApp to confirm your order and address before shipping.",
    `- You can follow your order at any time from the store's "Track your order" page, with your order number and the mobile number you ordered with.`,
    "",
    "# Receiving your order",
    "- Please make sure your address and mobile number are correct — the courier contacts you before delivering.",
    "- If delivery fails because of incorrect details, no answer, or refusal without a reason, we may ask you to pay the shipping cost before sending the order again.",
    "- If the parcel arrives damaged on the outside, please take a photo and tell us right away.",
    ...(ctx.hasDigital
      ? ["", "# Digital products", "Digital products aren't shipped; the download link appears on the order page as soon as payment is confirmed."]
      : []),
    contactSection(ctx),
  ]);
}

function privacyTemplate(ctx: PolicyTemplateContext) {
  const ads = ctx.adPlatforms.length
    ? ` We also use measurement and advertising tools from ${listAnd(ctx.adPlatforms)} to measure how our ads perform and to show you ads that suit you.`
    : "";
  return join([
    `Your privacy matters to us. This policy explains what data ${ctx.storeName} collects when you use the store, and how we use and protect it, in line with Egyptian Personal Data Protection Law No. 151 of 2020.`,
    "",
    "# Data we collect",
    "- What you enter when you order: your name, mobile number, address and governorate, and your email if you add it.",
    "- Your order details: products, prices, payment method and order status.",
    "- Basic technical data, such as your device and browser type and the contents of your cart, so the store works properly.",
    "",
    "# How we use your data",
    "- To fulfil and deliver your order and contact you about it.",
    "- To send your order confirmation and status updates.",
    "- To answer your questions and your return and exchange requests.",
    "- To protect the store from fake orders and fraud.",
    "- To improve the store and your shopping experience.",
    "",
    "# Sharing your data",
    "We never sell your data. We only share what's needed to fulfil your order with:",
    "- Shipping companies: your name, address and mobile number, to deliver your order.",
    "- Online payment gateways, when you pay online.",
    "- Casho, the platform the store runs on, to host and operate it.",
    "- Official authorities, where the law requires it.",
    "",
    "# Online payments",
    "When you pay by card or mobile wallet, you enter your details directly on the payment gateway's page. Your card details never reach us and we don't store them.",
    "",
    "# Cookies",
    `We use cookies to keep your cart and run the store.${ads} You can control or delete cookies from your browser settings.`,
    "",
    "# Protecting and keeping your data",
    "We keep your data on secure servers, and only the people who need it to fulfil your order can see it. We keep order data for as long as needed to fulfil orders and meet our legal and accounting obligations.",
    "",
    "# Your rights",
    "You may ask to see, correct or delete your data, and stop our marketing messages at any time, by contacting us.",
    "",
    "# Changes to this policy",
    "We may update this policy from time to time. Changes apply from the date they're published on this page.",
    contactSection(ctx),
  ]);
}

function termsTemplate(ctx: PolicyTemplateContext) {
  return join([
    `Welcome to ${ctx.storeName}. By using the store and placing an order, you agree to the following terms, so please read them carefully.`,
    "",
    "# Orders",
    "- An order is confirmed once it's completed on the checkout page. We may contact you to confirm your details before shipping.",
    "- We may cancel an order if the product runs out, if there's an obvious error in the price or details, or if we can't reach you to confirm it. If that happens, we'll let you know and refund anything you paid in full.",
    "- You can cancel your order before it ships by contacting us.",
    "",
    "# Prices and payment",
    "- All prices are in Egyptian pounds (EGP).",
    "- Shipping costs and any discounts appear on the checkout page before you confirm.",
    "- The available payment methods appear on the checkout page. With cash on delivery, you pay the courier when you receive your order.",
    "- Prices and offers may change at any time; this doesn't affect confirmed orders.",
    "",
    "# Products",
    "We take care that product photos and descriptions are accurate, but colors may differ slightly depending on the lighting and your screen.",
    "",
    "# Shipping and returns",
    `- Delivery is covered by the "Shipping & Delivery Policy".`,
    `- Returns, exchanges and refunds are covered by the "Return & Exchange Policy", without prejudice to your rights under the Consumer Protection Law.`,
    "",
    "# Acceptable use",
    "The store may not be used for any unlawful purpose, or to place fake orders or give false details. We may refuse orders that break these terms.",
    "",
    "# Intellectual property",
    `All store content — images, text and logos — belongs to ${ctx.storeName} or is used with its owners' permission, and may not be copied or used without written permission.`,
    "",
    "# Force majeure",
    "We aren't responsible for delays or failures caused by circumstances beyond our control.",
    "",
    "# Governing law",
    "These terms are governed by the laws of the Arab Republic of Egypt.",
    "",
    "# Changes",
    "We may change these terms from time to time. Changes apply to orders placed after they're published.",
    contactSection(ctx),
  ]);
}

export const ENGLISH_TEMPLATES: Record<PolicyType, (ctx: PolicyTemplateContext) => string> = {
  returns: returnsTemplate,
  shipping: shippingTemplate,
  privacy: privacyTemplate,
  terms: termsTemplate,
};
