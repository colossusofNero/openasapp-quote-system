/**
 * TypeScript Type Definitions for Quote Engine
 * Based on Excel Workbook: Base Pricing27.1_Pro_SMART_RCGV.xlsx
 */

// ============================================================================
// INPUT TYPES (Input Sheet)
// ============================================================================

/**
 * Property types supported by the system
 * Must match exactly with VLOOKUP Tables
 */
export type PropertyType =
  | 'Industrial'
  | 'Medical'
  | 'Office'
  | 'Other'
  | 'Restaurant'
  | 'Retail'
  | 'Warehouse'
  | 'Multi-Family'
  | 'Residential/LTR'
  | 'Short-Term Rental';

/**
 * Product types available
 * SMART is deprecated
 */
export type ProductType = 'RCGV' | 'Pro';

/**
 * Depreciation method (39-year or 27.5-year)
 */
export type DepreciationMethod = 39 | 27.5;

/**
 * Complete input data from the Input Sheet
 * Maps to cells B3, D3, F3, H3, J3, L3, N3, P3, R3, P7, AA3, B25, B28
 */
export interface QuoteInput {
  // Core Property Information
  purchasePrice: number; // B3
  zipCode: string; // D3
  sqFtBuilding: number; // F3
  acresLand: number; // H3
  propertyType: PropertyType; // J3
  numberOfFloors: number; // L3
  multipleProperties: number; // N3 (count of properties)

  // Dates
  purchaseDate: Date; // P3
  taxYear: number; // R3
  yearBuilt: number; // P7

  // Financial Details
  capEx: number; // AA3 - Capital Improvements
  accumulated1031Depreciation?: number; // Optional, from YbyY data B3

  // Owner Information
  propertyOwnerName: string; // B25
  propertyAddress: string; // B28

  // Product Selection
  productType: ProductType; // RCGV or Pro

  // Optional Flags
  isRushOrder?: boolean; // For rush fee calculation
}

// ============================================================================
// CALCULATION INTERMEDIATES
// ============================================================================

/**
 * Property-specific data calculated from inputs
 */
export interface PropertyData {
  purchasePrice: number;
  landValue: number;
  buildingValue: number;
  capEx: number;
  accumulated1031Depreciation: number;
  depreciationMethod: DepreciationMethod;
}

/**
 * Lookup factors from VLOOKUP Tables
 */
export interface PricingFactors {
  costBasisFactor: number; // Based on purchase price
  zipCodeFactor: number; // Based on location
  sqFtFactor: number; // Based on building size
  acresFactor: number; // Based on land size
  propertyTypeFactor: number; // Based on property type
  floorsFactor: number; // Based on number of floors
  multiplePropertiesFactor: number; // Based on property count
}

/**
 * Payment option calculations
 */
export interface PaymentOptions {
  upfront: number; // Base × 0.95
  fiftyFifty: number; // Base × 1.1 ÷ 2 (per payment)
  fiftyFiftyTotal: number; // Base × 1.1
  monthly: number; // Base × 1.2 ÷ 12 (per month)
  monthlyTotal: number; // Base × 1.2
  rushFee?: number; // Additional fee if rush order
}

/**
 * Year-by-year depreciation data
 */
export interface YearByYearData {
  year: number;
  costSegEstimate: number;
  standardDepreciation: number;
  traditionalCostSeg: number;
  bonusDepreciation: number;
  cumulativeSavings: number;
}

/**
 * Comparison table for depreciation methods
 */
export interface ComparisonTable {
  yearByYear: YearByYearData[];
  totalSavings: {
    standardVsCostSeg: number;
    standardVsBonus: number;
  };
  breakEvenYear: number;
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Complete quote result
 * Maps to Printable Quote sheets (RCGV/Pro)
 */
export interface QuoteResult {
  // Metadata
  quoteId?: string;
  generatedAt: Date;
  productType: ProductType;

  // Input Echo
  input: QuoteInput;

  // Calculated Property Values
  property: PropertyData;

  // Pricing
  baseQuote: number; // From Equation Sheet
  naturalLogQuote: number; // Alternative calculation method
  costMethodQuote: number; // Cost-based method
  finalBid: number; // Minimum of various methods

  // Applied Factors
  factors: PricingFactors;

  // Payment Options
  paymentOptions: PaymentOptions;

  // Depreciation Analysis
  depreciationSchedule: YearByYearData[];
  comparison: ComparisonTable;

  // Additional Calculations
  taxBenefits: {
    yearOne: number;
    totalOverPeriod: number;
    estimatedTaxRate: number;
  };

  // Validation & Errors
  warnings?: string[];
  errors?: string[];
}

// ============================================================================
// LOOKUP TABLE TYPES
// ============================================================================

/**
 * Cost Basis Factor Table (Column A-B in VLOOKUP Tables)
 */
export interface CostBasisFactorEntry {
  minValue: number;
  factor: number;
}

/**
 * Zip Code Factor Table (Column D-E in VLOOKUP Tables)
 */
export interface ZipCodeFactorEntry {
  zipCodePrefix: number;
  factor: number;
}

/**
 * SqFt Factor Table (Column G-H in VLOOKUP Tables)
 */
export interface SqFtFactorEntry {
  minSqFt: number;
  factor: number;
}

/**
 * Acres Factor Table (Column J-K in VLOOKUP Tables)
 */
export interface AcresFactorEntry {
  minAcres: number;
  factor: number;
}

/**
 * Property Type Factor Table (Column M-N in VLOOKUP Tables)
 */
export interface PropertyTypeFactorEntry {
  propertyType: PropertyType;
  factor: number;
  depreciationYears: DepreciationMethod;
}

/**
 * Floors Factor Table (Column P-Q in VLOOKUP Tables)
 */
export interface FloorsFactorEntry {
  floors: number;
  factor: number;
}

/**
 * Multiple Properties Discount Table (Column S in VLOOKUP Tables)
 */
export interface MultiplePropertiesEntry {
  propertyCount: number;
  discountFactor: number;
}

/**
 * Complete lookup tables
 */
export interface LookupTables {
  costBasisFactors: CostBasisFactorEntry[];
  zipCodeFactors: ZipCodeFactorEntry[];
  sqFtFactors: SqFtFactorEntry[];
  acresFactors: AcresFactorEntry[];
  propertyTypeFactors: PropertyTypeFactorEntry[];
  floorsFactors: FloorsFactorEntry[];
  multiplePropertiesFactors: MultiplePropertiesEntry[];
}

// ============================================================================
// DEPRECIATION SCHEDULES
// ============================================================================

/**
 * Depreciation rates for MACRS
 * Year 1: 20%, Year 2: 32%, Year 3: 19.2%, Year 4: 11.52%, Year 5: 11.52%, Year 6: 5.76%
 */
export interface DepreciationRates {
  year1: number; // 0.20
  year2: number; // 0.32
  year3: number; // 0.192
  year4: number; // 0.1152
  year5: number; // 0.1152
  year6: number; // 0.0576
}

/**
 * Configuration for depreciation calculations
 */
export interface DepreciationConfig {
  method: DepreciationMethod;
  rates: DepreciationRates;
  bonusDepreciationRate?: number; // e.g., 0.8 for 80% bonus
  yearsToProject: number; // Default 15-20 years
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error for quote calculation failures
 */
export class QuoteCalculationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'QuoteCalculationError';
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Calculator configuration
 */
export interface CalculatorConfig {
  lookupTables: LookupTables;
  depreciationConfig: DepreciationConfig;
  paymentMultipliers: {
    upfront: number; // 0.95
    fiftyFifty: number; // 1.1
    monthly: number; // 1.2
  };
  rushFeeAmount?: number;
  minimumQuote?: number;
  maximumQuote?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial quote for intermediate calculations
 */
export type PartialQuote = Partial<QuoteResult>;

/**
 * Quote calculation step for debugging/logging
 */
export interface CalculationStep {
  step: string;
  input: any;
  output: any;
  timestamp: Date;
}
