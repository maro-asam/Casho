import { afterEach, describe, expect, it, vi } from "vitest";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import { BostaProvider, bostaCityCode, bostaErrorMessage } from "./bosta";

describe("bostaCityCode", () => {
  it("maps every governorate we offer at checkout", () => {
    for (const g of EGYPT_GOVERNORATES) expect(bostaCityCode(g.nameEn), g.nameEn).toMatch(/^EG-\d{2}$/);
  });

  it("matches Bosta's codes and passes codes through", () => {
    expect(bostaCityCode("Suez")).toBe("EG-12");
    expect(bostaCityCode(" cairo ")).toBe("EG-01");
    expect(bostaCityCode("Giza")).toBe("EG-25");
    expect(bostaCityCode("eg-05")).toBe("EG-05");
    expect(bostaCityCode("Atlantis")).toBeNull();
  });
});

describe("BostaProvider.createShipment", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the customer's address as dropOffAddress with a city code", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ _id: "d1", trackingNumber: "123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await new BostaProvider({ apiKey: "k", pickupCity: "القاهرة" }).createShipment({
      orderId: "o1",
      reference: "ABCD1234",
      receiver: { firstName: "Casho", lastName: "Store", phone: "01014344053", city: "Suez", street: "شارع الجيش" },
      parcel: { weightKg: 1, description: "سجل تجاري x1" },
      codAmountPiasters: 105000,
    });

    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.dropOffAddress).toEqual({ city: "EG-12", firstLine: "شارع الجيش" });
    expect(body.receiver).toEqual({ firstName: "Casho", lastName: "Store", phone: "01014344053" });
    expect(body.cod).toBe(1050);
    expect(body.businessReference).toBe("ABCD1234");
    expect(result.trackingNumber).toBe("123");
  });

  it("refuses a governorate Bosta doesn't know before calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      new BostaProvider({ apiKey: "k" }).createShipment({
        orderId: "o1",
        receiver: { firstName: "A", phone: "010", city: "Atlantis", street: "x" },
        parcel: { weightKg: 1 },
      }),
    ).rejects.toThrow("Atlantis");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("bostaErrorMessage", () => {
  it("explains account problems in Arabic", () => {
    expect(bostaErrorMessage(400, "Active bundle subscription required to create orders")).toContain("باقة مفعّلة");
    expect(bostaErrorMessage(401, "")).toContain("مفتاح الـ API");
    expect(bostaErrorMessage(502, "")).toContain("جرّب تاني");
  });

  it("keeps Bosta's text for anything it doesn't recognise", () => {
    expect(bostaErrorMessage(400, "dropOffAddress.firstLine is required")).toBe("Bosta API error 400: dropOffAddress.firstLine is required");
  });

  it("survives a non-JSON error page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>Bad Gateway</html>", { status: 502 })));
    await expect(new BostaProvider({ apiKey: "k" }).trackShipment("1")).rejects.toThrow("بوسطة فيها مشكلة");
    vi.unstubAllGlobals();
  });
});
