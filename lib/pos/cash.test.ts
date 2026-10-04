import { describe, it, expect } from "vitest";
import { cashKeptFromSale, expectedDrawerCash } from "./cash";

describe("drawer cash", () => {
  it("counts cash sales only", () => {
    expect(cashKeptFromSale({ total: 5000, paymentMethod: "cash", splitPayments: [] })).toBe(5000);
    expect(cashKeptFromSale({ total: 5000, paymentMethod: "card", splitPayments: [] })).toBe(0);
  });

  it("keeps the cash part of a split payment, excluding change given back", () => {
    // 100 EGP bill: 40 by card, customer hands 100 in cash → 60 stays in the drawer.
    const sale = {
      total: 10000,
      paymentMethod: "card",
      splitPayments: [
        { paymentMethod: "card", amount: 4000 },
        { paymentMethod: "cash", amount: 10000 },
      ],
    };
    expect(cashKeptFromSale(sale)).toBe(6000);
  });

  it("split payment without cash adds nothing", () => {
    const sale = {
      total: 10000,
      paymentMethod: "card",
      splitPayments: [
        { paymentMethod: "card", amount: 4000 },
        { paymentMethod: "instapay", amount: 6000 },
      ],
    };
    expect(cashKeptFromSale(sale)).toBe(0);
  });

  it("expected = float + cash sales + cash in/out − cash refunds", () => {
    expect(
      expectedDrawerCash({
        openingBalance: 20000,
        orders: [
          { total: 5000, paymentMethod: "cash", splitPayments: [] },
          { total: 7000, paymentMethod: "card", splitPayments: [] },
        ],
        cashMovements: 1000 - 3000,
        cashRefunds: 1500,
      }),
    ).toBe(20000 + 5000 - 2000 - 1500);
  });
});
