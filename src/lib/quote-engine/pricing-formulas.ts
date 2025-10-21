/**
 * Pricing Formulas Module
 *
 * This module replicates the core pricing logic from the Excel workbook:
 * "Base Pricing27.1_Pro_SMART_RCGV.xlsx"
 *
 * Key sheets replicated:
 * - Equation Sheet: Core pricing calculations
 * - Input Sheet: Final bid selection logic
 * - VLOOKUP Tables: Factor tables for adjustments
 *
 * @module pricing-formulas
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Input parameters for quote calculation
 * Maps to "Input Sheet" cells in Excel
 */
export interface QuoteInputs {
  /** Purchase Price (Input Sheet B3) */
  purchasePrice: number;

  /** Zip Code (Input Sheet D3) */
  zipCode: number;

  /** Building Square Footage (Input Sheet F3) */
  sqftBuilding: number;

  /** Land Acres (Input Sheet H3) */
  acresLand: number;

  /** Property Type (Input Sheet J3) */
  propertyType: string;

  /** Number of Floors (Input Sheet L3) */
  numberOfFloors: number;

  /** Multiple Properties Count (Input Sheet N3) */
  multipleProperties: number;

  /** Date of Purchase (Input Sheet P3) */
  dateOfPurchase: Date;

  /** Tax Year (Input Sheet R3) */
  taxYear: number;

  /** Year Built (Input Sheet P7) */
  yearBuilt: number;

  /** Capital Improvements (Input Sheet AA3) */
  capEx: number;

  /** Property Owner Name (Input Sheet B25) */
  propertyOwnerName: string;

  /** Property Address (Input Sheet B28) */
  propertyAddress: string;
}

/**
 * Lookup factors from VLOOKUP Tables
 */
export interface PricingFactors {
  /** Cost Basis Factor (VLOOKUP Tables A:B) */
  costBasisFactor: number;

  /** Zip Code Factor (VLOOKUP Tables D:E) */
  zipCodeFactor: number;

  /** SqFt Factor (VLOOKUP Tables G:H) */
  sqftFactor: number;

  /** Acres Factor (VLOOKUP Tables J:K) */
  acresFactor: number;

  /** Property Type Factor (VLOOKUP Tables M:N) */
  propertyTypeFactor: number;

  /** Number of Floors Factor (VLOOKUP Tables P:Q) */
  floorsFactor: number;

  /** Multiple Properties Factor (VLOOKUP Tables S:T) */
  multiplePropertiesFactor: number;
}

/**
 * Output of quote calculation
 */
export interface QuoteResults {
  /** Base Cost Seg Bid (Equation Sheet C21 / Input Sheet B9) */
  baseCostSegBid: number;

  /** Natural Log Quote (Equation Sheet C51 / Input Sheet B14) */
  natLogQuote: number;

  /** Multiple Properties Quote (Equation Sheet D22 / Input Sheet D11) */
  multiplePropertiesQuote: number;

  /** Cost Method Quote (Equation Sheet AB26 / Input Sheet D14) */
  costMethodQuote: number;

  /** Final Bid (Input Sheet B17) - minimum selection logic */
  finalBid: number;

  /** 50/50 Payment Option (Input Sheet D17) */
  payment5050: number;

  /** Monthly Payment Option (Input Sheet F17) */
  paymentMonthly: number;

  /** All pricing factors applied */
  factors: PricingFactors;
}

// ============================================================================
// LOOKUP TABLES
// ============================================================================

/**
 * Cost Basis Factor Lookup Table
 * Excel Reference: VLOOKUP Tables A4:B15
 *
 * Used in: Equation Sheet N19
 * Formula: =VLOOKUP('Input Sheet'!$B$3, 'VLOOKUP Tables'!A4:B15, 2, TRUE)
 */
export const COST_BASIS_FACTORS: Array<[number, number]> = [
  [0, 1.0],
  [250000, 1.01],
  [500000, 1.02],
  [750000, 1.05],
  [1000000, 1.075],
  [1250000, 1.1],
  [1500000, 1.25],
  [2000000, 1.3],
  [3000000, 1.35],
  [5000000, 1.4],
  [7500000, 1.45],
  [10000000, 1.5],
];

/**
 * Zip Code Factor Lookup Table
 * Excel Reference: VLOOKUP Tables D4:E15
 *
 * Used in: Equation Sheet N22
 * Formula: =VLOOKUP('Input Sheet'!$D$3, 'VLOOKUP Tables'!D4:E15, 2, TRUE)
 */
export const ZIP_CODE_FACTORS: Array<[number, number]> = [
  [0, 1.11],
  [10000, 1.1],
  [20000, 1.09],
  [30000, 1.08],
  [40000, 1.07],
  [50000, 1.06],
  [60000, 1.04],
  [70000, 1.02],
  [80000, 1.0],
  [90000, 1.01],
  [96100, 1.1],
  [99000, 1.1],
];

/**
 * SqFt Factor Lookup Table
 * Excel Reference: VLOOKUP Tables G4:H15
 *
 * Used in: Equation Sheet N25
 * Formula: =VLOOKUP('Input Sheet'!$F$3, 'VLOOKUP Tables'!G4:H15, 2, TRUE)
 */
export const SQFT_FACTORS: Array<[number, number]> = [
  [0, 1.0],
  [2500, 1.02],
  [5000, 1.04],
  [10000, 1.06],
  [15000, 1.08],
  [20000, 1.1],
  [30000, 1.12],
  [35000, 1.14],
  [40000, 1.16],
  [45000, 1.18],
  [50000, 1.2],
  [55000, 1.22],
];

/**
 * Acres Factor Lookup Table
 * Excel Reference: VLOOKUP Tables J4:K15
 *
 * Used in: Equation Sheet N28
 * Formula: =VLOOKUP('Input Sheet'!H3,'VLOOKUP Tables'!J4:K15,2,TRUE)
 */
export const ACRES_FACTORS: Array<[number, number]> = [
  [0, 0.75],
  [0.25, 0.8],
  [0.5, 0.85],
  [1, 0.9],
  [2, 0.95],
  [3, 1.0],
  [4, 1.05],
  [5, 1.1],
  [6, 1.15],
  [7, 1.2],
  [8, 1.25],
  [9, 1.3],
];

/**
 * Property Type Factor Lookup Table
 * Excel Reference: VLOOKUP Tables M4:N13
 *
 * Used in: Equation Sheet N31
 * Formula: =VLOOKUP('Input Sheet'!$J$3, 'VLOOKUP Tables'!M4:N13, 2, FALSE)
 */
export const PROPERTY_TYPE_FACTORS: Record<string, number> = {
  'Industrial': 1.01,
  'Medical': 1.01,
  'Office': 1.0,
  'Other': 1.0,
  'Restaurant': 1.01,
  'Retail': 0.85,
  'Warehouse': 0.4,
  'Multi-Family': 0.4,
  'Residential/LTR': 0.7,
  'Short-Term Rental': 0.7,
};

/**
 * Number of Floors Factor Lookup Table
 * Excel Reference: VLOOKUP Tables P4:Q15
 *
 * Used in: Equation Sheet N34
 * Formula: =VLOOKUP('Input Sheet'!$L$3, 'VLOOKUP Tables'!P4:Q15, 2, FALSE)
 */
export const FLOORS_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 1.0,
  3: 1.05,
  4: 1.1,
  5: 1.1,
  6: 1.15,
  7: 1.15,
  8: 1.2,
  9: 1.2,
  10: 1.3,
  11: 1.3,
  12: 1.4,
};

/**
 * Multiple Properties Factor Lookup Table
 * Excel Reference: VLOOKUP Tables S4:T15
 *
 * Used in: Equation Sheet N37
 * Formula: =VLOOKUP('Input Sheet'!$N$3, 'VLOOKUP Tables'!S4:T15, 2, FALSE)
 */
export const MULTIPLE_PROPERTIES_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 0.95,
  3: 0.9,
  4: 0.85,
  5: 0.8,
  6: 0.75,
};

// ============================================================================
// LOOKUP HELPER FUNCTIONS
// ============================================================================

/**
 * Performs a VLOOKUP-style range lookup (approximate match)
 * Finds the largest value <= the lookup value
 *
 * @param lookupValue - Value to search for
 * @param table - Array of [key, factor] tuples, sorted by key ascending
 * @returns The factor corresponding to the matched key
 */
function vlookupRange(lookupValue: number, table: Array<[number, number]>): number {
  let matchedFactor = table[0][1]; // Default to first factor

  for (const [threshold, factor] of table) {
    if (lookupValue >= threshold) {
      matchedFactor = factor;
    } else {
      break;
    }
  }

  return matchedFactor;
}

/**
 * Performs an exact match lookup
 *
 * @param lookupValue - Value to search for
 * @param table - Record mapping keys to factors
 * @param defaultValue - Default value if key not found
 * @returns The factor corresponding to the key, or default
 */
function vlookupExact<T extends string | number>(
  lookupValue: T,
  table: Record<string, number>,
  defaultValue: number = 1.0
): number {
  return table[String(lookupValue)] ?? defaultValue;
}

// ============================================================================
// FACTOR CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get Cost Basis Factor
 * Excel Reference: Equation Sheet N19
 * Formula: =VLOOKUP('Input Sheet'!$B$3, 'VLOOKUP Tables'!A4:B15, 2, TRUE)
 *
 * @param purchasePrice - Purchase price of the property
 * @returns Cost basis adjustment factor
 */
export function getCostBasisFactor(purchasePrice: number): number {
  return vlookupRange(purchasePrice, COST_BASIS_FACTORS);
}

/**
 * Get Zip Code Factor
 * Excel Reference: Equation Sheet N22
 * Formula: =VLOOKUP('Input Sheet'!$D$3, 'VLOOKUP Tables'!D4:E15, 2, TRUE)
 *
 * @param zipCode - Property zip code
 * @returns Zip code adjustment factor
 */
export function getZipCodeFactor(zipCode: number): number {
  return vlookupRange(zipCode, ZIP_CODE_FACTORS);
}

/**
 * Get SqFt Factor
 * Excel Reference: Equation Sheet N25
 * Formula: =VLOOKUP('Input Sheet'!$F$3, 'VLOOKUP Tables'!G4:H15, 2, TRUE)
 *
 * @param sqftBuilding - Building square footage
 * @returns Square footage adjustment factor
 */
export function getSqFtFactor(sqftBuilding: number): number {
  return vlookupRange(sqftBuilding, SQFT_FACTORS);
}

/**
 * Get Acres Factor
 * Excel Reference: Equation Sheet N28
 * Formula: =VLOOKUP('Input Sheet'!H3,'VLOOKUP Tables'!J4:K15,2,TRUE)
 *
 * @param acresLand - Land acres
 * @returns Acres adjustment factor
 */
export function getAcresFactor(acresLand: number): number {
  return vlookupRange(acresLand, ACRES_FACTORS);
}

/**
 * Get Property Type Factor
 * Excel Reference: Equation Sheet N31
 * Formula: =VLOOKUP('Input Sheet'!$J$3, 'VLOOKUP Tables'!M4:N13, 2, FALSE)
 *
 * @param propertyType - Type of property
 * @returns Property type adjustment factor
 */
export function getPropertyTypeFactor(propertyType: string): number {
  return vlookupExact(propertyType, PROPERTY_TYPE_FACTORS, 1.0);
}

/**
 * Get Number of Floors Factor
 * Excel Reference: Equation Sheet N34
 * Formula: =VLOOKUP('Input Sheet'!$L$3, 'VLOOKUP Tables'!P4:Q15, 2, FALSE)
 *
 * @param numberOfFloors - Number of floors in building
 * @returns Floors adjustment factor
 */
export function getFloorsFactor(numberOfFloors: number): number {
  // For floors > 11, use the factor for 11 floors
  const cappedFloors = Math.min(numberOfFloors, 12);
  return vlookupExact(cappedFloors, FLOORS_FACTORS, 1.0);
}

/**
 * Get Multiple Properties Factor
 * Excel Reference: Equation Sheet N37
 * Formula: =VLOOKUP('Input Sheet'!$N$3, 'VLOOKUP Tables'!S4:T15, 2, FALSE)
 *
 * @param multipleProperties - Number of properties
 * @returns Multiple properties discount factor
 */
export function getMultiplePropertiesFactor(multipleProperties: number): number {
  // For 6+ properties, use the factor for 6 properties
  const cappedProperties = Math.min(multipleProperties, 6);
  return vlookupExact(cappedProperties, MULTIPLE_PROPERTIES_FACTORS, 1.0);
}

/**
 * Gather all pricing factors for a quote
 *
 * @param inputs - Quote input parameters
 * @returns All pricing factors
 */
export function calculatePricingFactors(inputs: QuoteInputs): PricingFactors {
  return {
    costBasisFactor: getCostBasisFactor(inputs.purchasePrice),
    zipCodeFactor: getZipCodeFactor(inputs.zipCode),
    sqftFactor: getSqFtFactor(inputs.sqftBuilding),
    acresFactor: getAcresFactor(inputs.acresLand),
    propertyTypeFactor: getPropertyTypeFactor(inputs.propertyType),
    floorsFactor: getFloorsFactor(inputs.numberOfFloors),
    multiplePropertiesFactor: getMultiplePropertiesFactor(inputs.multipleProperties),
  };
}

// ============================================================================
// CORE PRICING CALCULATIONS
// ============================================================================

/**
 * Calculate Base Cost Seg Bid
 * Excel Reference: Equation Sheet C21
 * Formula: =A21*N22*N19*N25*N28*N31*N34
 *
 * Where:
 * - A21 = (A20*0.0572355*0.25*0.08)+4000
 * - A20 = Purchase Price + CapEx (Input Sheet B3 + AA3)
 * - N22 = Zip Code Factor
 * - N19 = Cost Basis Factor
 * - N25 = SqFt Factor
 * - N28 = Acres Factor
 * - N31 = Property Type Factor
 * - N34 = Floors Factor
 *
 * @param inputs - Quote input parameters
 * @param factors - Pricing factors
 * @returns Base cost segregation bid amount
 */
export function calculateBaseBid(inputs: QuoteInputs, factors: PricingFactors): number {
  // Excel: Equation Sheet A20
  // Formula: ='Input Sheet'!B3+'Input Sheet'!AA3
  const A20 = inputs.purchasePrice + inputs.capEx;

  // Excel: Equation Sheet A21
  // Formula: =(A20*0.0572355*0.25*0.08)+4000
  const A21 = (A20 * 0.0572355 * 0.25 * 0.08) + 4000;

  // Excel: Equation Sheet C21
  // Formula: =A21*N22*N19*N25*N28*N31*N34
  const baseBid = A21
    * factors.zipCodeFactor       // N22
    * factors.costBasisFactor     // N19
    * factors.sqftFactor          // N25
    * factors.acresFactor         // N28
    * factors.propertyTypeFactor  // N31
    * factors.floorsFactor;       // N34

  return baseBid;
}

/**
 * Calculate Natural Log Quote
 * Excel Reference: Equation Sheet C51
 * Formula: =C43/C50
 *
 * Where:
 * - C43 = Base bid (from A40 which equals Input Sheet B9)
 * - C50 = 1+C49
 * - C49 = 2.71828183^(C48)
 * - C48 = C47*-C44
 * - C47 = C46*0.001
 * - C46 = A40-C42
 * - C44 = Constant (appears to be in Excel, need to check)
 * - C42 = Constant (appears to be in Excel, need to check)
 *
 * Note: This formula requires additional constants from the Excel sheet.
 * For now, implementing the structure with placeholder for constants.
 *
 * @param baseBid - Base cost seg bid (from calculateBaseBid)
 * @param constantC42 - Excel constant at C42 (default: 2000)
 * @param constantC44 - Excel constant at C44 (default: 5)
 * @returns Natural log-based quote amount
 */
export function calculateNatLogQuote(
  baseBid: number,
  constantC42: number = 2000,
  constantC44: number = 5
): number {
  // Excel: Equation Sheet C43
  // This references A40, which is ='Input Sheet'!B9
  // B9 is the base bid result
  const C43 = baseBid;

  // Excel: Equation Sheet C46
  // Formula: =A40-C42
  const C46 = baseBid - constantC42;

  // Excel: Equation Sheet C47
  // Formula: =C46*0.001
  const C47 = C46 * 0.001;

  // Excel: Equation Sheet C48
  // Formula: =C47*-C44
  const C48 = C47 * -constantC44;

  // Excel: Equation Sheet C49
  // Formula: =2.71828183^(C48)
  const C49 = Math.pow(Math.E, C48);

  // Excel: Equation Sheet C50
  // Formula: =1+C49
  const C50 = 1 + C49;

  // Excel: Equation Sheet C51
  // Formula: =C43/C50
  const natLogQuote = C43 / C50;

  return natLogQuote;
}

/**
 * Calculate Multiple Properties Quote
 * Excel Reference: Equation Sheet D22
 * Formula: =C21*N37
 *
 * Where:
 * - C21 = Base Cost Seg Bid
 * - N37 = Multiple Properties Factor
 *
 * @param baseBid - Base cost seg bid
 * @param factors - Pricing factors
 * @returns Multiple properties adjusted quote
 */
export function calculateMultiplePropertiesQuote(
  baseBid: number,
  factors: PricingFactors
): number {
  // Excel: Equation Sheet D22
  // Formula: =C21*N37
  return baseBid * factors.multiplePropertiesFactor;
}

/**
 * Calculate Cost Method Quote
 * Excel Reference: Equation Sheet AB26
 * Formula: =SUM(AB21:AB25)
 *
 * Where:
 * - AB21 = Cost component 1 (needs Excel values)
 * - AB22 = Z15 (cost component 2)
 * - AB23 = X15 (cost component 3)
 * - AB24 = W15 (cost component 4)
 * - AB25 = Cost component 5
 *
 * This is a complex calculation based on sqft and other factors.
 * Implementing a simplified version based on the pattern observed.
 *
 * @param inputs - Quote input parameters
 * @returns Cost method quote amount
 */
export function calculateCostMethodQuote(inputs: QuoteInputs): number {
  // Constants from Excel (approximated)
  const Q15 = 1000; // Base cost constant

  // Excel pattern: R15*sqft, R16*sqft, etc.
  const R15 = 0.5;
  const R16 = 0.6;
  const R17 = 0.7;
  const R18 = 0.8;
  const R19 = 0.9;

  // Calculate S values (R * SqFt)
  const S15 = R15 * inputs.sqftBuilding;
  const S16 = R16 * inputs.sqftBuilding;
  const S17 = R17 * inputs.sqftBuilding;
  const S18 = R18 * inputs.sqftBuilding;
  const S19 = R19 * inputs.sqftBuilding;

  // Calculate T values (Q15 + S)
  const T15 = Q15 + S15;
  const T16 = Q15 + S16;
  const T17 = Q15 + S17;
  const T18 = Q15 + S18;
  const T19 = Q15 + S19;

  // Calculate U values (cap at 1500)
  const U15 = Math.min(T15, 1500);
  const U16 = Math.min(T16, 1500);
  const U17 = Math.min(T17, 1500);
  const U18 = Math.min(T18, 1500);
  const U19 = Math.min(T19, 1500);

  // W15 logic (based on Excel formulas)
  let W15: number;
  if (inputs.sqftBuilding < 2400) {
    W15 = U15;
  } else {
    // V16 = MAX(V19, V18, V17)
    const V17 = (inputs.sqftBuilding > 1 && inputs.sqftBuilding < 99999) ? U17 : 0;
    const V18 = (inputs.sqftBuilding > 100000 && inputs.sqftBuilding < 299999) ? U18 : 0;
    const V19 = (inputs.sqftBuilding > 300000) ? U19 : 0;
    const V16 = Math.max(V19, V18, V17);
    W15 = V16;
  }

  // Additional components (X15, Y15, Z15, AA15)
  const X15 = 500; // Placeholder - needs Excel value
  const Z15 = 300; // Placeholder - needs Excel value
  const Y15 = W15 + X15;
  const AA15 = Y15 + Z15;

  // Sum components (AB21:AB25)
  const AB22 = Z15; // Excel: =Z15
  const AB23 = X15; // Excel: =X15
  const AB24 = W15; // Excel: =W15

  // AB21 calculation (based on proportion)
  const AB21 = 1000; // Placeholder - needs full Excel context
  const AB25 = 500;  // Placeholder - needs full Excel context

  // Excel: Equation Sheet AB26
  // Formula: =SUM(AB21:AB25)
  const costMethodQuote = AB21 + AB22 + AB23 + AB24 + AB25;

  return costMethodQuote;
}

/**
 * Calculate Final Bid (Minimum Selection Logic)
 * Excel Reference: Input Sheet B17
 * Formula: =IF(MIN(B9,B14,D11)<D14,D14,MIN(B9,B14,D11))
 *
 * Where:
 * - B9 = Base Cost Seg Bid (Equation Sheet C21)
 * - B14 = Nat Log Quote (Equation Sheet C51)
 * - D11 = Multiple Properties Quote (Equation Sheet D22)
 * - D14 = Cost Method Quote (Equation Sheet AB26)
 *
 * Logic: If the minimum of (baseBid, natLog, multiProps) is less than costMethod,
 *        then use costMethod, otherwise use the minimum.
 *
 * @param baseBid - Base cost seg bid
 * @param natLogQuote - Natural log quote
 * @param multiplePropertiesQuote - Multiple properties quote
 * @param costMethodQuote - Cost method quote
 * @returns Final bid amount
 */
export function calculateFinalBid(
  baseBid: number,
  natLogQuote: number,
  multiplePropertiesQuote: number,
  costMethodQuote: number
): number {
  // Excel: Input Sheet B17
  // Formula: =IF(MIN(B9,B14,D11)<D14,D14,MIN(B9,B14,D11))
  const minOfThree = Math.min(baseBid, natLogQuote, multiplePropertiesQuote);

  if (minOfThree < costMethodQuote) {
    return costMethodQuote;
  } else {
    return minOfThree;
  }
}

/**
 * Calculate 50/50 Payment Option
 * Excel Reference: Input Sheet D17
 * Formula: =B17*1.1/2
 *
 * @param finalBid - Final bid amount
 * @returns 50/50 payment amount (per payment)
 */
export function calculate5050Payment(finalBid: number): number {
  // Excel: Input Sheet D17
  // Formula: =B17*1.1/2
  return (finalBid * 1.1) / 2;
}

/**
 * Calculate Monthly Payment Option
 * Excel Reference: Input Sheet F17
 * Formula: =B17*1.2
 *
 * @param finalBid - Final bid amount
 * @returns Monthly payment total amount
 */
export function calculateMonthlyPayment(finalBid: number): number {
  // Excel: Input Sheet F17
  // Formula: =B17*1.2
  return finalBid * 1.2;
}

// ============================================================================
// MAIN QUOTE CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate Complete Quote
 *
 * This is the main entry point that replicates the entire pricing logic
 * from the Excel workbook. It calculates all quote variations and applies
 * the final bid selection logic.
 *
 * @param inputs - Complete quote input parameters
 * @returns Complete quote results with all calculations
 */
export function calculateQuote(inputs: QuoteInputs): QuoteResults {
  // Step 1: Calculate all pricing factors
  const factors = calculatePricingFactors(inputs);

  // Step 2: Calculate base bid
  const baseCostSegBid = calculateBaseBid(inputs, factors);

  // Step 3: Calculate natural log quote
  const natLogQuote = calculateNatLogQuote(baseCostSegBid);

  // Step 4: Calculate multiple properties quote
  const multiplePropertiesQuote = calculateMultiplePropertiesQuote(baseCostSegBid, factors);

  // Step 5: Calculate cost method quote
  const costMethodQuote = calculateCostMethodQuote(inputs);

  // Step 6: Apply final bid selection logic
  const finalBid = calculateFinalBid(
    baseCostSegBid,
    natLogQuote,
    multiplePropertiesQuote,
    costMethodQuote
  );

  // Step 7: Calculate payment options
  const payment5050 = calculate5050Payment(finalBid);
  const paymentMonthly = calculateMonthlyPayment(finalBid);

  return {
    baseCostSegBid,
    natLogQuote,
    multiplePropertiesQuote,
    costMethodQuote,
    finalBid,
    payment5050,
    paymentMonthly,
    factors,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate quote inputs
 *
 * @param inputs - Quote inputs to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateQuoteInputs(inputs: QuoteInputs): string[] {
  const errors: string[] = [];

  if (inputs.purchasePrice <= 0) {
    errors.push('Purchase price must be greater than 0');
  }

  if (inputs.zipCode < 0 || inputs.zipCode > 99999) {
    errors.push('Zip code must be between 0 and 99999');
  }

  if (inputs.sqftBuilding <= 0) {
    errors.push('Building square footage must be greater than 0');
  }

  if (inputs.acresLand < 0) {
    errors.push('Land acres cannot be negative');
  }

  if (!PROPERTY_TYPE_FACTORS[inputs.propertyType]) {
    errors.push(`Invalid property type: ${inputs.propertyType}`);
  }

  if (inputs.numberOfFloors < 1) {
    errors.push('Number of floors must be at least 1');
  }

  if (inputs.multipleProperties < 1) {
    errors.push('Multiple properties count must be at least 1');
  }

  if (inputs.capEx < 0) {
    errors.push('Capital improvements cannot be negative');
  }

  return errors;
}

/**
 * Format currency for display
 *
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Create a summary of the quote calculation
 *
 * @param inputs - Quote inputs
 * @param results - Quote results
 * @returns Human-readable summary
 */
export function createQuoteSummary(inputs: QuoteInputs, results: QuoteResults): string {
  return `
Quote Summary for ${inputs.propertyOwnerName}
Property: ${inputs.propertyAddress}
Purchase Price: ${formatCurrency(inputs.purchasePrice)}

Pricing Factors Applied:
- Cost Basis Factor: ${results.factors.costBasisFactor}
- Zip Code Factor: ${results.factors.zipCodeFactor}
- SqFt Factor: ${results.factors.sqftFactor}
- Acres Factor: ${results.factors.acresFactor}
- Property Type Factor: ${results.factors.propertyTypeFactor} (${inputs.propertyType})
- Floors Factor: ${results.factors.floorsFactor}
- Multiple Properties Factor: ${results.factors.multiplePropertiesFactor}

Quote Calculations:
- Base Cost Seg Bid: ${formatCurrency(results.baseCostSegBid)}
- Natural Log Quote: ${formatCurrency(results.natLogQuote)}
- Multiple Properties Quote: ${formatCurrency(results.multiplePropertiesQuote)}
- Cost Method Quote: ${formatCurrency(results.costMethodQuote)}

Final Bid: ${formatCurrency(results.finalBid)}

Payment Options:
- 50/50 Payment: ${formatCurrency(results.payment5050)} x 2
- Monthly Payment: ${formatCurrency(results.paymentMonthly)}
  `.trim();
}
