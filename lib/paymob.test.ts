import crypto from "crypto";
import { describe, expect, it, vi } from "vitest";

import {
  createPaymobCheckout,
  paymobCallbackBaseUrl,
  paymobKeyMode,
  transactionFromRedirect,
  transactionFromWebhook,
  verifyPaymobHmac,
} from "./paymob";

// Paymob's documented sample transaction (HMAC docs, "Transaction Processed Callback").
const SAMPLE_CONCAT =
  "1000002024-06-13T11:33:44.592345EGPfalsefalse1920364654097558truefalsefalsefalsetruefalse" +
  "217503754302852false2346MasterCardcardtrue";

const webhookBody = {
  type: "TRANSACTION",
  obj: {
    id: 192036465,
    pending: false,
    amount_cents: 100000,
    success: true,
    is_auth: false,
    is_capture: false,
    is_standalone_payment: true,
    is_voided: false,
    is_refunded: false,
    is_3d_secure: true,
    integration_id: 4097558,
    has_parent_transaction: false,
    order: { id: 217503754, merchant_order_id: "topup-123" },
    created_at: "2024-06-13T11:33:44.592345",
    currency: "EGP",
    source_data: { pan: "2346", type: "card", sub_type: "MasterCard" },
    error_occured: false,
    owner: 302852,
  },
};

const redirectQuery = new URLSearchParams({
  id: "192036465",
  pending: "false",
  amount_cents: "100000",
  success: "true",
  is_auth: "false",
  is_capture: "false",
  is_standalone_payment: "true",
  is_voided: "false",
  is_refunded: "false",
  is_3d_secure: "true",
  integration_id: "4097558",
  has_parent_transaction: "false",
  order: "217503754",
  created_at: "2024-06-13T11:33:44.592345",
  currency: "EGP",
  "source_data.pan": "2346",
  "source_data.type": "card",
  "source_data.sub_type": "MasterCard",
  error_occured: "false",
  owner: "302852",
  merchant_order_id: "topup-123",
});

const sign = (secret: string) => crypto.createHmac("sha512", secret).update(SAMPLE_CONCAT).digest("hex");

describe("Paymob callbacks", () => {
  it("reads the processed webhook in Paymob's HMAC order", () => {
    const tx = transactionFromWebhook(webhookBody)!;
    expect(tx.hmacFields.join("")).toBe(SAMPLE_CONCAT);
    expect(tx).toMatchObject({ merchantOrderId: "topup-123", amountCents: 100000, currency: "EGP", success: true, pending: false });
  });

  it("reads the browser redirect into the same string", () => {
    const tx = transactionFromRedirect(redirectQuery)!;
    expect(tx.hmacFields.join("")).toBe(SAMPLE_CONCAT);
    expect(tx.merchantOrderId).toBe("topup-123");
  });

  it("accepts underscore spellings of the nested redirect keys", () => {
    const q = new URLSearchParams(redirectQuery);
    for (const key of ["source_data.pan", "source_data.type", "source_data.sub_type"]) {
      q.set(key.replace(".", "_"), q.get(key)!);
      q.delete(key);
    }
    expect(transactionFromRedirect(q)!.hmacFields.join("")).toBe(SAMPLE_CONCAT);
  });

  it("verifies the HMAC and rejects tampering", () => {
    const tx = transactionFromWebhook(webhookBody)!;
    expect(verifyPaymobHmac(tx, sign("secret"), "secret")).toBe(true);
    expect(verifyPaymobHmac(tx, sign("secret").toUpperCase(), "secret")).toBe(true);
    expect(verifyPaymobHmac(tx, sign("other"), "secret")).toBe(false);
    expect(verifyPaymobHmac(tx, null, "secret")).toBe(false);

    const forged = transactionFromWebhook({ ...webhookBody, obj: { ...webhookBody.obj, amount_cents: 1 } })!;
    expect(verifyPaymobHmac(forged, sign("secret"), "secret")).toBe(false);
  });

  it("ignores non-transaction webhooks", () => {
    expect(transactionFromWebhook({ type: "TOKEN", obj: {} })).toBeNull();
    expect(transactionFromWebhook(null)).toBeNull();
    expect(transactionFromRedirect(new URLSearchParams())).toBeNull();
  });
});

describe("paymobCallbackBaseUrl", () => {
  const withEnv = (env: Record<string, string>, fn: () => void) => {
    const saved = { APP_URL: process.env.APP_URL, ROOT_DOMAIN: process.env.ROOT_DOMAIN };
    Object.assign(process.env, env);
    try {
      fn();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  };

  it("sends production payers to the dashboard host", () => {
    withEnv({ APP_URL: "https://casho.store", ROOT_DOMAIN: "casho.store" }, () =>
      expect(paymobCallbackBaseUrl()).toBe("https://app.casho.store"),
    );
    withEnv({ APP_URL: "https://app.casho.store/", ROOT_DOMAIN: "casho.store" }, () =>
      expect(paymobCallbackBaseUrl()).toBe("https://app.casho.store"),
    );
  });

  it("keeps the port in dev (app.localhost:3000)", () => {
    withEnv({ APP_URL: "http://localhost:3000", ROOT_DOMAIN: "localhost" }, () =>
      expect(paymobCallbackBaseUrl()).toBe("http://app.localhost:3000"),
    );
  });
});

describe("paymobKeyMode", () => {
  it("reads test/live from the key prefix", () => {
    expect(paymobKeyMode("egy_sk_test_abc", "secret")).toBe("test");
    expect(paymobKeyMode("egy_pk_live_abc", "public")).toBe("live");
    expect(paymobKeyMode("egy_pk_live_abc", "secret")).toBeNull();
    expect(paymobKeyMode("sk_live_abc", "secret")).toBeNull();
  });
});

describe("createPaymobCheckout", () => {
  const creds = { secretKey: "egy_sk_test_x", publicKey: "egy_pk_test_y", integrationIds: [111, 222] };

  it("creates an intention and returns the unified checkout URL", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "pi_1", client_secret: "egy_csk_test_z" }), { status: 201 }));
    const { url } = await createPaymobCheckout(
      creds,
      {
        amountCents: 15000,
        items: [{ name: "Shirt", amountCents: 10000, quantity: 1 }],
        billing: { firstName: "Ahmed Mohamed Ali", phone: "01012345678" },
        specialReference: "order-1",
      },
      fetchImpl as unknown as typeof fetch,
    );

    expect(url).toBe("https://accept.paymob.com/unifiedcheckout/?publicKey=egy_pk_test_y&clientSecret=egy_csk_test_z");
    const [endpoint, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(endpoint).toBe("https://accept.paymob.com/v1/intention/");
    expect((init.headers as Record<string, string>).Authorization).toBe("Token egy_sk_test_x");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ amount: 15000, currency: "EGP", payment_methods: [111, 222], special_reference: "order-1" });
    // Lines that don't add up (shipping) collapse into one line carrying the total.
    expect(body.items).toEqual([{ name: "Shirt", amount: 15000, quantity: 1 }]);
    expect(body.billing_data).toMatchObject({ first_name: "Ahmed", last_name: "Mohamed Ali", phone_number: "01012345678", country: "EG" });
  });

  it("throws on a rejected intention and on bad amounts", async () => {
    const rejected = vi.fn(async () => new Response("{}", { status: 401 }));
    await expect(
      createPaymobCheckout(creds, { amountCents: 100, items: [], billing: { firstName: "A", phone: "1" } }, rejected as unknown as typeof fetch),
    ).rejects.toMatchObject({ status: 401 });
    await expect(createPaymobCheckout(creds, { amountCents: 0, items: [], billing: { firstName: "A", phone: "1" } })).rejects.toThrow();
  });
});
