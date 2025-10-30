import { calculateFactors, calculateQuote, QuoteFormValues } from "./src/lib/quoteMath";
import { quoteSchema } from "./src/lib/quoteSchema";
import { formatMoney, formatNumber } from "./src/lib/utils";

function divider(title: string) {
  console.log("\n==================================================");
  console.log(title);
  console.log("==================================================\n");
}

function logScenario(name: string, values: QuoteFormValues) {
  divider(name);

  const parsed = quoteSchema.parse(values);
  const factors = calculateFactors(parsed);
  const results = calculateQuote(parsed);

  console.log("Inputs:");
  console.log(`  Prospect: ${parsed.prospectName}`);
  console.log(`  Address: ${parsed.propertyAddress}`);
  console.log(`  ZIP Code: ${parsed.zipCode}`);
  console.log(`  Tax Year: ${parsed.taxYear}`);
  console.log(`  Tax Deadline: ${parsed.taxDeadline}`);
  console.log(`  Purchase Price: ${formatMoney(parsed.purchasePrice)}`);
  console.log(`  Land Value %: ${parsed.landValuePercent.toFixed(2)}%`);
  console.log(`  SqFt Building: ${formatNumber(parsed.sqftBuilding)}`);
  console.log(`  Acres Land: ${parsed.acresLand.toFixed(2)}`);
  console.log(`  Property Type: ${parsed.propertyType}`);
  console.log(`  Floors: ${parsed.numberOfFloors}`);
  console.log(`  Multiple Properties: ${parsed.multipleProperties}`);
  console.log(`  1031 Exchange: ${parsed.is1031Exchange ? "Yes" : "No"}`);
  console.log(`  Capital Improvements: ${parsed.hasCapitalImprovements ? formatMoney(parsed.capitalImprovementsAmount) : "None"}`);
  console.log(`  Rush: ${parsed.needRush === "rush" ? "Rush (+$1,500)" : "No"}`);
  console.log(`  Price Override: ${parsed.priceOverride ? formatMoney(parsed.overrideAmount ?? 0) : "No"}`);

  console.log("\nFactors:");
  console.log(`  Cost Basis: ${factors.costBasisFactor.toFixed(4)}`);
  console.log(`  ZIP: ${factors.zipCodeFactor.toFixed(4)}`);
  console.log(`  SqFt: ${factors.sqftFactor.toFixed(4)}`);
  console.log(`  Acres: ${factors.acresFactor.toFixed(4)}`);
  console.log(`  Property Type: ${factors.propertyTypeFactor.toFixed(4)}`);
  console.log(`  Floors: ${factors.floorsFactor.toFixed(4)}`);
  console.log(`  Multiple Properties: ${factors.multiplePropertiesFactor.toFixed(4)}`);

  console.log("\nResults:");
  console.log(`  Base Cost Seg Bid: ${formatMoney(results.baseCostSegBid)}`);
  console.log(`  Natural Log Quote: ${formatMoney(results.natLogQuote)}`);
  console.log(`  Multiple Properties Quote: ${formatMoney(results.multiplePropertiesQuote)}`);
  console.log(`  Cost Method Floor: ${formatMoney(results.costMethodQuote)}`);
  console.log(`  Rush Fee: ${formatMoney(results.rushFee)}`);
  console.log(`  Final Bid: ${formatMoney(results.finalBid)}`);
  console.log(`  50/50 Plan Total: ${formatMoney(results.fiftyFiftyPlanTotal)} (Installments of ${formatMoney(results.fiftyFiftyInstallment)})`);
  console.log(`  Monthly Plan Total: ${formatMoney(results.monthlyTotal)} (Installments of ${formatMoney(results.monthlyInstallment)})`);
  console.log(`  Bonus Depreciation: ${formatMoney(results.bonusDepreciation)}`);

  console.log("\nProperty Snapshot:");
  console.log(`  Land Value: ${formatMoney(results.landValue)}`);
  console.log(`  Building Value: ${formatMoney(results.buildingValue)}`);
}

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
  prospectName: "RCG Holdings",
  propertyAddress: "456 Broadway, New York, NY 10001",
  zipCode: "10001",
  taxYear: 2025,
  taxDeadline: "March",
  purchasePrice: 5_000_000,
  hasCapitalImprovements: true,
  capitalImprovementsAmount: 250_000,
  landValuePercent: 18,
  is1031Exchange: true,
  accumulated1031Depreciation: 125_000,
  sqftBuilding: 25_000,
  acresLand: 2,
  propertyType: "Office",
  numberOfFloors: 5,
  multipleProperties: 1,
  needRush: "rush",
  yearBuilt: 2015,
  priceOverride: false,
  overrideAmount: undefined,
};

const scenarioC: QuoteFormValues = {
  prospectName: "Warehouse Partners",
  propertyAddress: "789 Industrial Way, Phoenix, AZ 85001",
  zipCode: "85001",
  taxYear: 2025,
  taxDeadline: "June",
  purchasePrice: 3_000_000,
  hasCapitalImprovements: true,
  capitalImprovementsAmount: 500_000,
  landValuePercent: 12,
  is1031Exchange: false,
  accumulated1031Depreciation: 0,
  sqftBuilding: 12_500,
  acresLand: 2.5,
  propertyType: "Warehouse",
  numberOfFloors: 1,
  multipleProperties: 3,
  needRush: "no_rush",
  yearBuilt: 2012,
  priceOverride: true,
  overrideAmount: 28000,
};

try {
  logScenario("Scenario A – Multi-Family (Reference)", scenarioA);
  logScenario("Scenario B – Office with Rush", scenarioB);
  logScenario("Scenario C – Warehouse Override", scenarioC);
} catch (error) {
  console.error("Error running calculations:", error);
  process.exitCode = 1;
}
