import { afterEach, describe, expect, it, vi } from "vitest";
import { AramexProvider, aramexStatus, parseAramexDate, serializeAramexBody } from "./aramex";

const config = {
  userName: "u",
  password: "p",
  accountNumber: "20016",
  accountPin: "331421",
  accountEntity: "CAI",
  accountCountryCode: "EG",
  version: "v1.0",
};

const sender = { firstName: "Maro", company: "Casho Store", phone: "01000000000", email: "m@x.com", city: "Cairo", street: "12 Tahrir St", countryCode: "EG" };
const receiver = { firstName: "Casho", lastName: "Store", phone: "01014344053", city: "Suez", street: "شارع الجيش", countryCode: "EG" };

describe("Aramex helpers", () => {
  it("writes WCF dates as \\/Date(ms)\\/", () => {
    expect(serializeAramexBody({ d: "/Date(1700000000000)/" })).toBe('{"d":"\\/Date(1700000000000)\\/"}');
  });

  it("reads WCF dates with or without an offset", () => {
    expect(parseAramexDate("/Date(1700000000000+0200)/")?.getTime()).toBe(1700000000000);
    expect(parseAramexDate("/Date(1700000000000)/")?.getTime()).toBe(1700000000000);
    expect(parseAramexDate("yesterday")).toBeNull();
  });

  it("maps tracking updates by description", () => {
    expect(aramexStatus("SH005", "Delivered")).toBe("DELIVERED");
    expect(aramexStatus("SH003", "Out for Delivery")).toBe("OUT_FOR_DELIVERY");
    expect(aramexStatus("SH047", "Returned to Shipper")).toBe("RETURNED");
    expect(aramexStatus("SH033", "Delivery Attempted - Consignee not available")).toBe("FAILED_DELIVERY");
    expect(aramexStatus("SH014", "Record created.")).toBe("CREATED");
    expect(aramexStatus("SH077", "Departed Facility in Cairo")).toBe("IN_TRANSIT");
  });
});

describe("AramexProvider.createShipment", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("books a domestic prepaid shipment with the COD service and WCF dates", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ HasErrors: false, Shipments: [{ ID: "44412345678", HasErrors: false, ShipmentLabel: { LabelURL: "https://label" } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new AramexProvider(config).createShipment({
      reference: "ABCD1234",
      sender,
      receiver,
      parcel: { weightKg: 1, description: "x" },
      codAmountPiasters: 105000,
    });

    const raw = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string;
    expect(raw).toMatch(/"ShippingDateTime":"\\\/Date\(\d+\)\\\/"/);
    const shipment = JSON.parse(raw).Shipments[0];
    expect(shipment.Details).toMatchObject({
      ProductGroup: "DOM",
      ProductType: "ONP",
      PaymentType: "P",
      Services: "CODS",
      CashOnDeliveryAmount: { CurrencyCode: "EGP", Value: 1050 },
    });
    expect(shipment.Shipper.PartyAddress.Line1).toBe("12 Tahrir St");
    expect(shipment.Shipper.Contact).toMatchObject({ CompanyName: "Casho Store", CellPhone: "01000000000" });
    expect(shipment.Consignee.PartyAddress.City).toBe("Suez");
    expect(result).toMatchObject({ trackingNumber: "44412345678", labelUrl: "https://label" });
  });

  it("surfaces per-shipment errors that come back with HTTP 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ HasErrors: true, Shipments: [{ HasErrors: true, Notifications: [{ Code: "ERR03", Message: "Consignee City is invalid" }] }] }), { status: 200 }),
      ),
    );
    await expect(new AramexProvider(config).createShipment({ sender, receiver, parcel: { weightKg: 1 } })).rejects.toThrow("Consignee City is invalid");
  });

  it("asks for the pickup address before calling Aramex", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(new AramexProvider(config).createShipment({ sender: { ...sender, street: "" }, receiver, parcel: { weightKg: 1 } })).rejects.toThrow("عنوان الاستلام");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
