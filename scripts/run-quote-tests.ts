import assert from "node:assert";

import { calculateQuote, QuoteFormValues } from "@/lib/quoteMath";
import { quoteSchema } from "@/lib/quoteSchema";

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

function runValidationChecks() {
  const parsed = quoteSchema.parse(scenarioA);
  assert.equal(parsed.prospectName, "Valued Client");

  assert.throws(
    () => quoteSchema.parse({ ...scenarioA, zipCode: "ABCDE" }),
    /5-digit ZIP code/,
  );

  assert.throws(
    () =>
      quoteSchema.parse({
        ...scenarioA,
        hasCapitalImprovements: true,
        capitalImprovementsAmount: 0,
      }),
    /capital improvements amount/,
  );

  assert.throws(
    () =>
      quoteSchema.parse({
        ...scenarioA,
        priceOverride: true,
      }),
    /override amount/,
  );
}

function runCalculationChecks() {
  const resultA = calculateQuote(scenarioA);
  assert(Math.abs(resultA.baseCostSegBid - 3058.2) < 0.01);
  assert(Math.abs(resultA.finalBid - 3364.02) < 0.01);
  assert(Math.abs(resultA.monthlyInstallment - 336.4) < 0.01);

  const resultB = calculateQuote(scenarioB);
  assert(Math.abs(resultB.baseCostSegBid - 19364.25) < 0.01);
  assert(Math.abs(resultB.finalBid - 21300.68) < 0.01);
  assert(Math.abs(resultB.monthlyInstallment - 2130.07) < 0.01);
}

runValidationChecks();
runCalculationChecks();

console.log("Quote math + validation checks passed");
