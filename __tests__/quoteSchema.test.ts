import { describe, expect, test } from "@jest/globals";

import { quoteSchema } from "@/lib/quoteSchema";

const validPayload = {
  prospectName: "Valued Client",
  propertyAddress: "123 Main St, Yourtown, US 85260",
  zipCode: "85260",
  taxYear: 2025,
  taxDeadline: "October",
  purchasePrice: 2_550_000,
  hasCapitalImprovements: false,
  capitalImprovementsAmount: 0,
  landValuePercent: 10,
  is1031Exchange: false,
  accumulated1031Depreciation: 0,
  sqftBuilding: 1_500,
  acresLand: 0.78,
  propertyType: "Multi-Family",
  numberOfFloors: 1,
  multipleProperties: 1,
  needRush: "no_rush",
  yearBuilt: 2024,
  priceOverride: false,
  overrideAmount: undefined,
};

describe("quoteSchema", () => {
  test("parses a valid payload", () => {
    const parsed = quoteSchema.parse(validPayload);
    expect(parsed.prospectName).toBe("Valued Client");
    expect(parsed.landValuePercent).toBe(10);
    expect(parsed.capitalImprovementsAmount).toBe(0);
  });

  test("rejects invalid zip code", () => {
    expect(() =>
      quoteSchema.parse({
        ...validPayload,
        zipCode: "ABCDE",
      }),
    ).toThrow("Enter a valid 5-digit ZIP code");
  });

  test("requires amount when capital improvements flagged", () => {
    expect(() =>
      quoteSchema.parse({
        ...validPayload,
        hasCapitalImprovements: true,
        capitalImprovementsAmount: 0,
      }),
    ).toThrow("Enter the completed capital improvements amount");
  });

  test("requires override amount when override enabled", () => {
    expect(() =>
      quoteSchema.parse({
        ...validPayload,
        priceOverride: true,
      }),
    ).toThrow("Enter the override amount");
  });
});
