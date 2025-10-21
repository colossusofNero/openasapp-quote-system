/**
 * Lookup Tables Data
 *
 * Extracted from VLOOKUP Tables sheet in Base Pricing27.1_Pro_SMART_RCGV.xlsx
 * These tables provide pricing adjustment factors based on property characteristics
 */

import { LookupTables } from '../lib/quote-engine/types';

/**
 * Complete lookup tables with data from Excel
 */
export const LOOKUP_TABLES: LookupTables = {
  /**
   * Cost Basis Factor (Column A-B)
   * Higher purchase prices get higher multipliers
   */
  costBasisFactors: [
    { minValue: 0, factor: 1.0 },
    { minValue: 250000, factor: 1.01 },
    { minValue: 500000, factor: 1.02 },
    { minValue: 750000, factor: 1.03 },
    { minValue: 1000000, factor: 1.075 },
    { minValue: 1500000, factor: 1.15 },
    { minValue: 2000000, factor: 1.3 },
    { minValue: 3000000, factor: 1.35 },
    { minValue: 5000000, factor: 1.4 },
    { minValue: 10000000, factor: 1.5 },
  ],

  /**
   * Zip Code Factor (Column D-E)
   * Geographic pricing adjustments
   * Based on first 2 digits of zip code
   */
  zipCodeFactors: [
    { zipCodePrefix: 0, factor: 1.0 }, // Default
    { zipCodePrefix: 10, factor: 1.11 }, // NY area
    { zipCodePrefix: 20, factor: 1.08 }, // DC area
    { zipCodePrefix: 30, factor: 1.0 }, // Southeast
    { zipCodePrefix: 40, factor: 1.02 }, // Midwest
    { zipCodePrefix: 60, factor: 1.05 }, // Chicago area
    { zipCodePrefix: 70, factor: 1.0 }, // South
    { zipCodePrefix: 80, factor: 1.03 }, // Mountain
    { zipCodePrefix: 85, factor: 1.02 }, // Arizona
    { zipCodePrefix: 90, factor: 1.09 }, // California
    { zipCodePrefix: 94, factor: 1.11 }, // SF Bay Area
    { zipCodePrefix: 98, factor: 1.07 }, // Pacific Northwest
  ],

  /**
   * SqFt Factor (Column G-H)
   * Larger buildings get higher multipliers (more complex)
   */
  sqFtFactors: [
    { minSqFt: 0, factor: 1.0 },
    { minSqFt: 1000, factor: 1.0 },
    { minSqFt: 2500, factor: 1.02 },
    { minSqFt: 5000, factor: 1.05 },
    { minSqFt: 10000, factor: 1.08 },
    { minSqFt: 15000, factor: 1.1 },
    { minSqFt: 25000, factor: 1.15 },
    { minSqFt: 35000, factor: 1.18 },
    { minSqFt: 45000, factor: 1.2 },
    { minSqFt: 55000, factor: 1.22 },
  ],

  /**
   * Acres Factor (Column J-K)
   * More land requires more analysis
   */
  acresFactors: [
    { minAcres: 0, factor: 0.75 }, // Very small lots
    { minAcres: 0.25, factor: 0.85 },
    { minAcres: 0.5, factor: 1.0 }, // Standard
    { minAcres: 1, factor: 1.05 },
    { minAcres: 2, factor: 1.1 },
    { minAcres: 3, factor: 1.15 },
    { minAcres: 5, factor: 1.2 },
    { minAcres: 7, factor: 1.25 },
    { minAcres: 9, factor: 1.3 },
  ],

  /**
   * Property Type Factor (Column M-N)
   * Different property types have different complexity
   *
   * Key insights:
   * - Retail, Warehouse, Multi-Family: Large discounts (simpler)
   * - Medical, Restaurant, Industrial: Small premiums (more complex)
   * - Office, Other: Standard pricing
   */
  propertyTypeFactors: [
    { propertyType: 'Industrial', factor: 1.01, depreciationYears: 39 },
    { propertyType: 'Medical', factor: 1.01, depreciationYears: 39 },
    { propertyType: 'Office', factor: 1.0, depreciationYears: 39 },
    { propertyType: 'Other', factor: 1.0, depreciationYears: 39 },
    { propertyType: 'Restaurant', factor: 1.01, depreciationYears: 39 },
    { propertyType: 'Retail', factor: 0.85, depreciationYears: 39 },
    { propertyType: 'Warehouse', factor: 0.4, depreciationYears: 39 },
    { propertyType: 'Multi-Family', factor: 0.4, depreciationYears: 27.5 },
    { propertyType: 'Residential/LTR', factor: 0.7, depreciationYears: 27.5 },
    { propertyType: 'Short-Term Rental', factor: 0.7, depreciationYears: 27.5 },
  ],

  /**
   * Number of Floors Factor (Column P-Q)
   * More floors = more complexity
   */
  floorsFactors: [
    { floors: 1, factor: 1.0 },
    { floors: 2, factor: 1.02 },
    { floors: 3, factor: 1.05 },
    { floors: 4, factor: 1.08 },
    { floors: 5, factor: 1.1 },
    { floors: 6, factor: 1.12 },
    { floors: 7, factor: 1.15 },
    { floors: 8, factor: 1.18 },
    { floors: 10, factor: 1.25 },
    { floors: 12, factor: 1.3 },
    { floors: 15, factor: 1.35 },
    { floors: 20, factor: 1.4 },
  ],

  /**
   * Multiple Properties Factor (Column S)
   * Discounts for analyzing multiple properties together
   */
  multiplePropertiesFactors: [
    { propertyCount: 1, discountFactor: 1.0 },
    { propertyCount: 2, discountFactor: 0.9 }, // 10% discount
    { propertyCount: 3, discountFactor: 0.85 }, // 15% discount
    { propertyCount: 4, discountFactor: 0.8 }, // 20% discount
    { propertyCount: 5, discountFactor: 0.75 }, // 25% discount
    { propertyCount: 6, discountFactor: 0.7 }, // 30% discount
  ],
};

/**
 * MACRS Depreciation Rates
 * Standard IRS depreciation schedule for personal property
 */
export const MACRS_RATES = {
  year1: 0.2, // 20%
  year2: 0.32, // 32%
  year3: 0.192, // 19.2%
  year4: 0.1152, // 11.52%
  year5: 0.1152, // 11.52%
  year6: 0.0576, // 5.76%
};

/**
 * Payment Option Multipliers
 * From Input Sheet payment calculations
 */
export const PAYMENT_MULTIPLIERS = {
  upfront: 0.95, // 5% discount for paying upfront
  fiftyFifty: 1.1, // 10% premium for 50/50 payment
  monthly: 1.2, // 20% premium for monthly payments
};

/**
 * Default Configuration Values
 */
export const DEFAULT_CONFIG = {
  rushFeeAmount: 1500, // $1,500 rush fee
  minimumQuote: 3000, // $3,000 minimum
  maximumQuote: 100000, // $100,000 maximum (for sanity check)
  yearsToProject: 15, // Project 15 years of depreciation
  bonusDepreciationRate: 0.8, // 80% bonus depreciation (as of 2025)
  estimatedTaxRate: 0.35, // 35% for tax benefit calculations
};

/**
 * Property Type Categories
 * For grouping and validation
 */
export const PROPERTY_TYPE_CATEGORIES = {
  commercial: ['Office', 'Retail', 'Medical', 'Restaurant', 'Industrial', 'Warehouse', 'Other'],
  residential: ['Multi-Family', 'Residential/LTR', 'Short-Term Rental'],
};

/**
 * Validation Ranges
 * For input validation
 */
export const VALIDATION_RANGES = {
  purchasePrice: {
    min: 50000, // $50k minimum
    max: 50000000, // $50M maximum
  },
  sqFtBuilding: {
    min: 100, // 100 sqft minimum
    max: 1000000, // 1M sqft maximum
  },
  acresLand: {
    min: 0.01, // 0.01 acres minimum
    max: 100, // 100 acres maximum
  },
  numberOfFloors: {
    min: 1,
    max: 100,
  },
  multipleProperties: {
    min: 1,
    max: 50,
  },
  capEx: {
    min: 0,
    max: 10000000, // $10M maximum
  },
};

/**
 * Helper function to get lookup tables
 */
export function getLookupTables(): LookupTables {
  return LOOKUP_TABLES;
}

/**
 * Helper function to get a specific property type factor
 */
export function getPropertyTypeFactor(propertyType: string): number {
  const entry = LOOKUP_TABLES.propertyTypeFactors.find((e) => e.propertyType === propertyType);
  return entry?.factor || 1.0;
}

/**
 * Helper function to get depreciation years for property type
 */
export function getDepreciationYears(propertyType: string): 39 | 27.5 {
  const entry = LOOKUP_TABLES.propertyTypeFactors.find((e) => e.propertyType === propertyType);
  return entry?.depreciationYears || 39;
}

/**
 * Helper function to validate property type
 */
export function isValidPropertyType(propertyType: string): boolean {
  return LOOKUP_TABLES.propertyTypeFactors.some((e) => e.propertyType === propertyType);
}

/**
 * Export all lookup data as a complete configuration
 */
export function getDefaultCalculatorConfig() {
  return {
    lookupTables: LOOKUP_TABLES,
    depreciationConfig: {
      method: 39 as const,
      rates: MACRS_RATES,
      bonusDepreciationRate: DEFAULT_CONFIG.bonusDepreciationRate,
      yearsToProject: DEFAULT_CONFIG.yearsToProject,
    },
    paymentMultipliers: PAYMENT_MULTIPLIERS,
    rushFeeAmount: DEFAULT_CONFIG.rushFeeAmount,
    minimumQuote: DEFAULT_CONFIG.minimumQuote,
    maximumQuote: DEFAULT_CONFIG.maximumQuote,
  };
}
