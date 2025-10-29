import { describe, expect, test } from "@jest/globals";

import {
  calculateQuote,
  calculateCostMethodQuote,
  calculateFactors,
  calculateBaseBid,
  QuoteFormValues,
} from "@/lib/quoteMath";

const scenarioA: QuoteFormValues = {
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

const scenarioB: QuoteFormValues = {
  prospectName: "NYC Properties Inc",
  propertyAddress: "456 Broadway, New York, NY 10001",
  zipCode: "10001",
  taxYear: 2025,
  taxDeadline: "March",
  purchasePrice: 5_000_000,
  hasCapitalImprovements: true,
  capitalImprovementsAmount: 250_000,
  landValuePercent: 18,
  is1031Exchange: false,
  accumulated1031Depreciation: 0,
  sqftBuilding: 25_000,
  acresLand: 2,
  propertyType: "Office",
  numberOfFloors: 5,
  multipleProperties: 1,
  needRush: "no_rush",
  yearBuilt: 2015,
  priceOverride: false,
  overrideAmount: undefined,
};

describe("quoteMath calculateQuote", () => {
  test("matches specification scenario A", () => {
    const results = calculateQuote(scenarioA);

    expect(results.baseCostSegBid).toBeCloseTo(3058.2, 2);
    expect(results.natLogQuote).toBeCloseTo(3042.87, 2);
    expect(results.multiplePropertiesQuote).toBeCloseTo(3058.2, 2);
    expect(results.costMethodQuote).toBeCloseTo(3364.02, 2);
    expect(results.finalBid).toBeCloseTo(3364.02, 2);
    expect(results.fiftyFiftyPlanTotal).toBeCloseTo(3058.2, 2);
    expect(results.fiftyFiftyInstallment).toBeCloseTo(1529.1, 2);
    expect(results.monthlyTotal).toBeCloseTo(4036.82, 2);
    expect(results.monthlyInstallment).toBeCloseTo(336.4, 2);
    expect(results.bonusDepreciation).toBeCloseTo(569423, 2);
  });

  test("matches specification scenario B", () => {
    const results = calculateQuote(scenarioB);

    expect(results.baseCostSegBid).toBeCloseTo(19364.25, 2);
    expect(results.natLogQuote).toBeCloseTo(19364.25, 2);
    expect(results.multiplePropertiesQuote).toBeCloseTo(19364.25, 2);
    expect(results.costMethodQuote).toBeCloseTo(21300.68, 2);
    expect(results.finalBid).toBeCloseTo(21300.68, 2);
    expect(results.fiftyFiftyPlanTotal).toBeCloseTo(19364.25, 2);
    expect(results.fiftyFiftyInstallment).toBeCloseTo(9682.13, 2);
    expect(results.monthlyTotal).toBeCloseTo(25560.82, 2);
    expect(results.monthlyInstallment).toBeCloseTo(2130.07, 2);
    expect(results.bonusDepreciation).toBeCloseTo(1_079_298.5, 2);
  });

  test("cost method floor applies", () => {
    const factors = calculateFactors(scenarioA);
    const baseBid = calculateBaseBid(scenarioA, factors);
    const costMethod = calculateCostMethodQuote(baseBid);
    expect(costMethod).toBeGreaterThanOrEqual(3300);
  });
});
