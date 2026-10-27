import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/server", () => ({ after: vi.fn() }));

const { buildCustomerConfirmationEmail, buildCustomerStatusEmail, buildMerchantNewOrderEmail, buildPaymentFailedEmail } = await import(
  "./order-emails"
);
type EmailOrder = Parameters<typeof buildCustomerConfirmationEmail>[0];

function makeOrder(overrides: Partial<EmailOrder> = {}): EmailOrder {
  return {
    id: "0f6c5a1e-aaaa-bbbb-cccc-1234567890ab",
    email: "sara@example.com",
    fullName: "سارة <script>alert(1)</script> محمد",
    phone: "01012345678",
    address: "القاهرة - شارع التحرير",
    notes: null,
    paymentMethod: "cash_on_delivery",
    status: "PENDING",
    returnedAt: null,
    riskLevel: null,
    riskSignals: [],
    subtotal: 30000,
    shipping: 5000,
    discount: 0,
    total: 35000,
    trackingNumber: null,
    shippingProvider: null,
    items: [{ quantity: 2, price: 15000, selectedFeatures: { size: "L" }, product: { name: "تيشيرت" } }],
    shipments: [],
    store: {
      name: "متجر نور",
      slug: "noor",
      customDomain: null,
      customDomainStatus: null,
      user: { email: "owner@example.com" },
      settings: { logo: null, primaryColor: "#0f766e", email: "help@noor.com", emailNewOrders: true, emailCustomerOrders: true },
    },
    ...overrides,
  } as EmailOrder;
}

describe("order emails", () => {
  it("escapes what the customer typed", () => {
    const { html } = buildMerchantNewOrderEmail(makeOrder(), "https://casho.store/dashboard/orders/x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("gives the merchant the order number, total and a dashboard link", () => {
    const mail = buildMerchantNewOrderEmail(makeOrder(), "https://casho.store/dashboard/orders/x");
    expect(mail.subject).toContain("#7890AB");
    expect(mail.html).toContain("https://casho.store/dashboard/orders/x");
    expect(mail.html).toContain("المقاس: L");
  });

  it("flags risky numbers in the merchant subject", () => {
    const mail = buildMerchantNewOrderEmail(makeOrder({ riskLevel: "HIGH", riskSignals: ["اتلغى له 3 طلبات"] }), "https://x");
    expect(mail.subject.startsWith("⚠️")).toBe(true);
    expect(mail.html).toContain("اتلغى له 3 طلبات");
  });

  it("tells a transfer customer to finish paying, and a paid one that it's confirmed", () => {
    expect(buildCustomerConfirmationEmail(makeOrder({ paymentMethod: "instapay" })).text).toContain("كمّل تحويل المبلغ");
    expect(buildCustomerConfirmationEmail(makeOrder({ paymentMethod: "paymob", status: "PAID" })).text).toContain("الدفع اتأكد");
  });

  it("adds the tracking number and link to the shipped email", () => {
    const order = makeOrder({
      status: "SHIPPED",
      shipments: [{ trackingNumber: "BOS-123", trackingUrl: "https://bosta.co/track/BOS-123", courierName: "بوسطة" }],
    });
    const mail = buildCustomerStatusEmail(order, "SHIPPED");
    expect(mail?.html).toContain("BOS-123");
    expect(mail?.html).toContain("https://bosta.co/track/BOS-123");
  });

  it("tells the merchant who to call when an online payment fails", () => {
    const mail = buildPaymentFailedEmail(makeOrder({ paymentMethod: "paymob" }), "https://casho.store/dashboard/orders/x");
    expect(mail.text).toContain("01012345678");
    expect(mail.html).toContain("https://casho.store/dashboard/orders/x");
  });

  it("sends nothing for a status the customer isn't told about", () => {
    expect(buildCustomerStatusEmail(makeOrder(), "PENDING")).toBeNull();
  });

  it("falls back to a safe color when the store color isn't a hex", () => {
    const order = makeOrder();
    order.store.settings!.primaryColor = "red;background:url(x)";
    expect(buildCustomerConfirmationEmail(order).html).not.toContain("url(x)");
  });
});
