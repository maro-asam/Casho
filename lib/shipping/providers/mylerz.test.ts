import { afterEach, describe, expect, it, vi } from "vitest";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import { MylerzProvider, mylerzCityCode, mylerzStatus } from "./mylerz";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const ZONES = {
  IsErrorState: false,
  Value: [
    { Code: "CA", EnName: "Cairo", ArName: "القاهرة", Zones: [{ Code: "AS", EnName: "Ain Shams", ArName: "عين شمس" }, { Code: "El-M", EnName: "El Marg", ArName: "المرج" }] },
    { Code: "SUEZ", EnName: "Suez", ArName: "السويس", Zones: [{ Code: "SUEZ", EnName: "Suez", ArName: "السويس" }] },
  ],
};

/** Routes the provider's calls: token, zones, warehouses, addorders. */
function mylerzApi(overrides: Partial<Record<string, () => Response>> = {}) {
  return vi.fn(async (url: string) => {
    const path = new URL(url).pathname;
    if (overrides[path]) return overrides[path]!();
    if (path === "/token") return json({ access_token: "tok" });
    if (path === "/api/packages/GetCityZoneList") return json(ZONES);
    if (path === "/api/orders/GetWarehouses") return json({ IsErrorState: false, Value: [{ Name: "Main" }] });
    if (path === "/api/orders/addorders") return json({ IsErrorState: false, Value: { Packages: [{ BarCode: "MYZ123", Reference: "#ABCD1234" }] } });
    return json({ IsErrorState: true, ErrorDescription: `unexpected ${path}` }, 404);
  });
}

const receiver = { firstName: "Casho", lastName: "Store", phone: "01014344053", city: "Suez", street: "شارع الجيش" };

describe("Mylerz helpers", () => {
  it("has a city code for every governorate we offer", () => {
    for (const g of EGYPT_GOVERNORATES) expect(mylerzCityCode(g.nameEn), g.nameEn).toBeTruthy();
  });

  it("maps status words", () => {
    expect(mylerzStatus("Delivered")).toBe("DELIVERED");
    expect(mylerzStatus("Out For Delivery")).toBe("OUT_FOR_DELIVERY");
    expect(mylerzStatus("Returned to shipper")).toBe("RETURNED");
    expect(mylerzStatus("Cancelled")).toBe("CANCELED");
    expect(mylerzStatus("Picked Up")).toBe("PICKED_UP");
    expect(mylerzStatus("In Hub")).toBe("IN_TRANSIT");
  });
});

describe("MylerzProvider.createShipment", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("logs in, picks the single zone and sends a COD package", async () => {
    const fetchMock = mylerzApi();
    vi.stubGlobal("fetch", fetchMock);

    const result = await new MylerzProvider({ username: "u", password: "p" }).createShipment({
      reference: "ABCD1234",
      receiver,
      parcel: { weightKg: 2, description: "سجل x1" },
      codAmountPiasters: 105000,
    });

    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const add = calls.find(([u]) => u.endsWith("/api/orders/addorders"))!;
    expect((add[1].headers as Record<string, string>).Authorization).toBe("bearer tok");
    const [pkg] = JSON.parse(add[1].body as string);
    expect(pkg).toMatchObject({
      WarehouseName: "Main",
      Neighborhood: "SUEZ",
      Payment_Type: "COD",
      COD_Value: 1050,
      Mobile_No: "01014344053",
      Reference: "#ABCD1234",
      Country: "Egypt",
      Pieces: [{ PieceNo: 1, Weight: 2 }],
    });
    expect(result.trackingNumber).toBe("MYZ123");
  });

  it("needs a zone where the governorate has several", async () => {
    vi.stubGlobal("fetch", mylerzApi());
    await expect(
      new MylerzProvider({ username: "u", password: "p" }).createShipment({ receiver: { ...receiver, city: "Cairo" }, parcel: { weightKg: 1 } }),
    ).rejects.toThrow("اختار المنطقة");
  });

  it("uses the zone the merchant picked and the configured warehouse", async () => {
    const fetchMock = mylerzApi();
    vi.stubGlobal("fetch", fetchMock);
    await new MylerzProvider({ username: "u", password: "p", warehouse: "Nasr City" }).createShipment({
      receiver: { ...receiver, city: "Cairo", zone: "AS" },
      parcel: { weightKg: 1 },
    });
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls.some(([u]) => u.endsWith("/GetWarehouses"))).toBe(false);
    const [pkg] = JSON.parse(calls.find(([u]) => u.endsWith("/addorders"))![1].body as string);
    expect(pkg).toMatchObject({ Neighborhood: "AS", WarehouseName: "Nasr City", Payment_Type: "PP", COD_Value: 0 });
  });

  it("explains wrong credentials in Arabic", async () => {
    vi.stubGlobal("fetch", mylerzApi({ "/token": () => json({ error: "invalid_grant", error_description: "The user name or password is incorrect." }, 400) }));
    await expect(new MylerzProvider({ username: "u", password: "bad" }).createShipment({ receiver, parcel: { weightKg: 1 } })).rejects.toThrow("غلط");
  });

  it("reports Mylerz's own error text", async () => {
    vi.stubGlobal("fetch", mylerzApi({ "/api/orders/addorders": () => json({ IsErrorState: true, ErrorDescription: "Invalid Neighborhood" }) }));
    await expect(new MylerzProvider({ username: "u", password: "p" }).createShipment({ receiver, parcel: { weightKg: 1 } })).rejects.toThrow("Invalid Neighborhood");
  });
});
