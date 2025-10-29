const RUSH_FEE = 1500;
const COST_METHOD_MULTIPLIER = 1.1;
const MIN_COST_METHOD = 3300;
const MONTHLY_PREMIUM = 1.2;
const BONUS_DEPRECIATION_RATE = 0.24811459694989108;

export const PROPERTY_TYPES = [
  "Industrial",
  "Medical",
  "Office",
  "Other",
  "Restaurant",
  "Retail",
  "Warehouse",
  "Multi-Family",
  "Residential/LTR",
  "Short-Term Rental",
] as const;

export const TAX_DEADLINES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const RUSH_OPTIONS = ["no_rush", "rush"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type TaxDeadline = (typeof TAX_DEADLINES)[number];
export type RushOption = (typeof RUSH_OPTIONS)[number];

export interface QuoteFormValues {
  prospectName: string;
  propertyAddress: string;
  zipCode: string;
  taxYear: number;
  taxDeadline: TaxDeadline;
  purchasePrice: number;
  hasCapitalImprovements: boolean;
  capitalImprovementsAmount: number;
  landValuePercent: number;
  is1031Exchange: boolean;
  accumulated1031Depreciation: number;
  sqftBuilding: number;
  acresLand: number;
  propertyType: PropertyType;
  numberOfFloors: number;
  multipleProperties: number;
  needRush: RushOption;
  yearBuilt: number;
  priceOverride: boolean;
  overrideAmount?: number;
}

export interface QuoteFactors {
  costBasisFactor: number;
  zipCodeFactor: number;
  sqftFactor: number;
  acresFactor: number;
  propertyTypeFactor: number;
  floorsFactor: number;
  multiplePropertiesFactor: number;
}

export interface QuoteComputation {
  baseCostSegBid: number;
  natLogQuote: number;
  multiplePropertiesQuote: number;
  costMethodQuote: number;
  finalBid: number;
  rushFee: number;
  fiftyFiftyPlanTotal: number;
  fiftyFiftyInstallment: number;
  monthlyTotal: number;
  monthlyInstallment: number;
  landValue: number;
  buildingValue: number;
  bonusDepreciation: number;
  factors: QuoteFactors;
}

const COST_BASIS_TABLE: Array<[number, number]> = [
  [0, 1.0],
  [250_000, 1.01],
  [500_000, 1.02],
  [750_000, 1.03],
  [1_000_000, 1.075],
  [1_500_000, 1.15],
  [2_000_000, 1.3],
  [3_000_000, 1.35],
  [5_000_000, 1.4],
  [10_000_000, 1.5],
];

const ZIP_CODE_TABLE: Array<[number, number]> = [
  [0, 1.0],
  [10, 1.11],
  [20, 1.09],
  [30, 1.06],
  [40, 1.05],
  [50, 1.04],
  [60, 1.03],
  [70, 1.02],
  [80, 1.0],
  [85, 0.99],
  [90, 1.05],
  [94, 1.08],
  [98, 1.06],
];

const SQFT_TABLE: Array<[number, number]> = [
  [0, 1.0101],
  [2_500, 1.03],
  [5_000, 1.06],
  [10_000, 1.1],
  [15_000, 1.12],
  [25_000, 1.17],
  [35_000, 1.2],
  [45_000, 1.22],
  [55_000, 1.24],
];

const ACRES_TABLE: Array<[number, number]> = [
  [0, 0.75],
  [0.25, 0.85],
  [0.8, 0.9],
  [1.5, 0.95],
  [3, 1.0],
  [5, 1.05],
  [7, 1.1],
  [9, 1.15],
  [12, 1.2],
];

const FLOORS_TABLE: Array<[number, number]> = [
  [1, 1.0],
  [2, 1.03],
  [3, 1.06],
  [4, 1.09],
  [5, 1.12],
  [6, 1.15],
  [7, 1.18],
  [10, 1.22],
];

const MULTI_PROPERTIES_TABLE: Array<[number, number]> = [
  [1, 1.0],
  [2, 0.95],
  [3, 0.9],
  [4, 0.85],
  [5, 0.8],
  [6, 0.75],
];

const PROPERTY_TYPE_MAP: Record<PropertyType, number> = {
  Industrial: 1.01,
  Medical: 1.01,
  Office: 1.0,
  Other: 1.0,
  Restaurant: 1.01,
  Retail: 0.85,
  Warehouse: 0.4,
  "Multi-Family": 0.4,
  "Residential/LTR": 0.7,
  "Short-Term Rental": 0.7,
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function lookupFactor(value: number, table: Array<[number, number]>): number {
  return table.reduce((acc, [threshold, factor]) => (value >= threshold ? factor : acc), table[0][1]);
}

function getZipPrefix(zipCode: string): number {
  const trimmed = zipCode.trim();
  const prefix = trimmed.slice(0, 2);
  const parsed = Number.parseInt(prefix, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getCostBasisFactor(purchasePrice: number): number {
  return lookupFactor(purchasePrice, COST_BASIS_TABLE);
}

export function getZipCodeFactor(zipCode: string): number {
  return lookupFactor(getZipPrefix(zipCode), ZIP_CODE_TABLE);
}

export function getSqftFactor(squareFeet: number): number {
  return lookupFactor(squareFeet, SQFT_TABLE);
}

export function getAcresFactor(acres: number): number {
  return lookupFactor(acres, ACRES_TABLE);
}

export function getPropertyTypeFactor(propertyType: PropertyType): number {
  return PROPERTY_TYPE_MAP[propertyType] ?? 1.0;
}

export function getFloorsFactor(floors: number): number {
  return lookupFactor(floors, FLOORS_TABLE);
}

export function getMultiplePropertiesFactor(propertyCount: number): number {
  const capped = Math.min(propertyCount, MULTI_PROPERTIES_TABLE[MULTI_PROPERTIES_TABLE.length - 1][0]);
  return lookupFactor(capped, MULTI_PROPERTIES_TABLE);
}

export function calculateFactors(values: QuoteFormValues): QuoteFactors {
  return {
    costBasisFactor: getCostBasisFactor(values.purchasePrice),
    zipCodeFactor: getZipCodeFactor(values.zipCode),
    sqftFactor: getSqftFactor(values.sqftBuilding),
    acresFactor: getAcresFactor(values.acresLand),
    propertyTypeFactor: getPropertyTypeFactor(values.propertyType),
    floorsFactor: getFloorsFactor(values.numberOfFloors),
    multiplePropertiesFactor: getMultiplePropertiesFactor(values.multipleProperties),
  };
}

export function calculateBaseBid(values: QuoteFormValues, factors: QuoteFactors): number {
  const adjustedPrice = values.purchasePrice + (values.hasCapitalImprovements ? values.capitalImprovementsAmount : 0);
  const a21 = adjustedPrice * 0.0572355 * 0.25 * 0.08 + 4_000;

  const base =
    a21 *
    factors.costBasisFactor *
    factors.zipCodeFactor *
    factors.sqftFactor *
    factors.acresFactor *
    factors.propertyTypeFactor *
    factors.floorsFactor;

  return base;
}

export function calculateNatLogQuote(baseBid: number, constantC42 = 2_000, constantC44 = 5): number {
  const c46 = baseBid - constantC42;
  const c47 = c46 * 0.001;
  const c48 = c47 * -constantC44;
  const c49 = Math.exp(c48);
  const c50 = 1 + c49;
  return baseBid / c50;
}

export function calculateMultiplePropertiesQuote(baseBid: number, factor: number): number {
  return baseBid * factor;
}

export function calculateCostMethodQuote(baseBid: number): number {
  const scaled = baseBid * COST_METHOD_MULTIPLIER;
  return Math.max(roundCurrency(scaled), MIN_COST_METHOD);
}

function applyPriceOverride(
  candidate: number,
  values: QuoteFormValues,
): number {
  if (!values.priceOverride) {
    return candidate;
  }

  if (values.overrideAmount && values.overrideAmount > 0) {
    return values.overrideAmount;
  }

  return candidate;
}

export function calculateFinalBid(
  baseBid: number,
  natLogQuote: number,
  multiplePropertiesQuote: number,
  costMethodQuote: number,
  values: QuoteFormValues,
): number {
  const candidateMin = Math.min(baseBid, natLogQuote, multiplePropertiesQuote);
  const preferred = candidateMin < costMethodQuote ? costMethodQuote : candidateMin;
  return applyPriceOverride(preferred, values);
}

function calculateRushFee(option: RushOption): number {
  return option === "rush" ? RUSH_FEE : 0;
}

function calculatePropertySnapshots(values: QuoteFormValues) {
  const landValue = roundCurrency(values.purchasePrice * (values.landValuePercent / 100));
  const accumulated1031 = values.is1031Exchange ? values.accumulated1031Depreciation : 0;
  const capitalImprovements = values.hasCapitalImprovements ? values.capitalImprovementsAmount : 0;

  const buildingValue = roundCurrency(values.purchasePrice - landValue - accumulated1031 + capitalImprovements);
  const bonusDepreciation = roundCurrency(buildingValue * BONUS_DEPRECIATION_RATE);

  return { landValue, buildingValue, bonusDepreciation };
}

export function calculateQuote(values: QuoteFormValues): QuoteComputation {
  const factors = calculateFactors(values);
  const baseCostSegBid = roundCurrency(calculateBaseBid(values, factors));
  const natLogQuote = roundCurrency(calculateNatLogQuote(baseCostSegBid));
  const multiplePropertiesQuote = roundCurrency(
    calculateMultiplePropertiesQuote(baseCostSegBid, factors.multiplePropertiesFactor),
  );
  const costMethodQuote = roundCurrency(calculateCostMethodQuote(baseCostSegBid));
  const finalBeforeRush = roundCurrency(
    calculateFinalBid(baseCostSegBid, natLogQuote, multiplePropertiesQuote, costMethodQuote, values),
  );
  const rushFee = calculateRushFee(values.needRush);
  const finalBid = roundCurrency(finalBeforeRush + rushFee);
  const fiftyFiftyPlanTotal = roundCurrency(baseCostSegBid);
  const fiftyFiftyInstallment = roundCurrency(fiftyFiftyPlanTotal / 2);
  const monthlyTotal = roundCurrency(finalBid * MONTHLY_PREMIUM);
  const monthlyInstallment = roundCurrency(monthlyTotal / 12);
  const { landValue, buildingValue, bonusDepreciation } = calculatePropertySnapshots(values);

  return {
    baseCostSegBid,
    natLogQuote,
    multiplePropertiesQuote,
    costMethodQuote,
    finalBid,
    rushFee,
    fiftyFiftyPlanTotal,
    fiftyFiftyInstallment,
    monthlyTotal,
    monthlyInstallment,
    landValue,
    buildingValue,
    bonusDepreciation,
    factors,
  };
}

export function normaliseFormValues(values: QuoteFormValues): QuoteFormValues {
  const capitalImprovementsAmount = values.hasCapitalImprovements ? values.capitalImprovementsAmount : 0;
  const accumulated1031Depreciation = values.is1031Exchange ? values.accumulated1031Depreciation : 0;
  const overrideAmount = values.priceOverride ? values.overrideAmount : undefined;

  return {
    ...values,
    prospectName: values.prospectName.trim(),
    propertyAddress: values.propertyAddress.trim(),
    zipCode: values.zipCode.trim(),
    capitalImprovementsAmount,
    accumulated1031Depreciation,
    overrideAmount,
  };
}
