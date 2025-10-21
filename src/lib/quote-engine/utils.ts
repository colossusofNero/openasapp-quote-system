/**
 * Utility Functions for Quote Engine
 *
 * Helper functions for validation, formatting, and calculations
 */

import {
  QuoteInput,
  ValidationResult,
  PropertyType,
  QuoteCalculationError,
} from './types';
import { VALIDATION_RANGES, isValidPropertyType } from '../../data/lookup-tables';

/**
 * Validate quote input with comprehensive checks
 *
 * @param input - Quote input to validate
 * @returns Validation result with errors and warnings
 */
export function validateQuoteInput(input: QuoteInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required Fields Validation
  if (!input.purchasePrice || input.purchasePrice <= 0) {
    errors.push('Purchase price must be greater than 0');
  }

  if (!input.zipCode || input.zipCode.length < 5) {
    errors.push('Valid 5-digit zip code is required');
  }

  if (!input.sqFtBuilding || input.sqFtBuilding <= 0) {
    errors.push('Building square footage must be greater than 0');
  }

  if (input.acresLand === undefined || input.acresLand < 0) {
    errors.push('Acres of land must be 0 or greater');
  }

  if (!input.propertyType) {
    errors.push('Property type is required');
  } else if (!isValidPropertyType(input.propertyType)) {
    errors.push(`Invalid property type: ${input.propertyType}`);
  }

  if (!input.numberOfFloors || input.numberOfFloors < 1) {
    errors.push('Number of floors must be at least 1');
  }

  if (!input.multipleProperties || input.multipleProperties < 1) {
    errors.push('Number of properties must be at least 1');
  }

  if (!input.purchaseDate) {
    errors.push('Purchase date is required');
  }

  if (!input.taxYear || input.taxYear < 1900 || input.taxYear > 2100) {
    errors.push('Valid tax year is required');
  }

  if (!input.yearBuilt || input.yearBuilt < 1800 || input.yearBuilt > new Date().getFullYear() + 5) {
    errors.push('Valid year built is required');
  }

  if (input.capEx === undefined || input.capEx < 0) {
    errors.push('Capital expenditures must be 0 or greater');
  }

  if (!input.propertyOwnerName || input.propertyOwnerName.trim().length === 0) {
    errors.push('Property owner name is required');
  }

  if (!input.propertyAddress || input.propertyAddress.trim().length === 0) {
    errors.push('Property address is required');
  }

  if (!input.productType || !['RCGV', 'Pro'].includes(input.productType)) {
    errors.push('Product type must be either RCGV or Pro');
  }

  // Range Validation with Warnings
  if (input.purchasePrice) {
    const { min, max } = VALIDATION_RANGES.purchasePrice;
    if (input.purchasePrice < min) {
      warnings.push(`Purchase price is below typical minimum ($${min.toLocaleString()})`);
    }
    if (input.purchasePrice > max) {
      warnings.push(`Purchase price is unusually high (>$${(max / 1000000).toFixed(0)}M)`);
    }
  }

  if (input.sqFtBuilding) {
    const { min, max } = VALIDATION_RANGES.sqFtBuilding;
    if (input.sqFtBuilding < min) {
      warnings.push(`Building size is unusually small (<${min} sqft)`);
    }
    if (input.sqFtBuilding > max) {
      warnings.push(`Building size is unusually large (>${(max / 1000).toFixed(0)}k sqft)`);
    }
  }

  if (input.acresLand !== undefined) {
    const { min, max } = VALIDATION_RANGES.acresLand;
    if (input.acresLand > max) {
      warnings.push(`Land size is unusually large (>${max} acres)`);
    }
  }

  if (input.numberOfFloors) {
    const { min, max } = VALIDATION_RANGES.numberOfFloors;
    if (input.numberOfFloors > 20) {
      warnings.push(`Number of floors is unusually high (>${20})`);
    }
  }

  if (input.capEx) {
    const { max } = VALIDATION_RANGES.capEx;
    if (input.capEx > max) {
      warnings.push(`Capital expenditures are unusually high (>$${(max / 1000000).toFixed(0)}M)`);
    }
  }

  // Business Logic Validation
  if (input.yearBuilt && input.purchaseDate) {
    const purchaseYear = input.purchaseDate.getFullYear();
    if (input.yearBuilt > purchaseYear) {
      warnings.push('Property was built after purchase date (future construction?)');
    }
  }

  if (input.capEx && input.purchasePrice && input.capEx > input.purchasePrice * 0.5) {
    warnings.push('Capital expenditures exceed 50% of purchase price');
  }

  // Zip Code Format Validation
  if (input.zipCode && !/^\d{5}(-\d{4})?$/.test(input.zipCode)) {
    warnings.push('Zip code format should be 5 digits or 5+4 format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format currency value for display
 *
 * @param amount - Dollar amount
 * @param includeSign - Whether to include $ sign
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, includeSign: boolean = true): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const sign = amount < 0 ? '-' : '';
  return includeSign ? `${sign}$${formatted}` : formatted;
}

/**
 * Format percentage value for display
 *
 * @param value - Decimal value (e.g., 0.35 for 35%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Calculate return on investment
 *
 * @param quotePrice - Cost of the cost segregation study
 * @param taxSavings - Total tax savings from the study
 * @returns ROI as decimal (e.g., 4.5 for 450%)
 */
export function calculateROI(quotePrice: number, taxSavings: number): number {
  if (quotePrice <= 0) return 0;
  return taxSavings / quotePrice;
}

/**
 * Format ROI for display
 *
 * @param quotePrice - Cost of the study
 * @param taxSavings - Total tax savings
 * @returns Formatted ROI string (e.g., "4.5x")
 */
export function formatROI(quotePrice: number, taxSavings: number): string {
  const roi = calculateROI(quotePrice, taxSavings);
  return `${roi.toFixed(1)}x`;
}

/**
 * Validate zip code format and extract prefix
 *
 * @param zipCode - Zip code string
 * @returns Object with validation result and prefix
 */
export function parseZipCode(zipCode: string): {
  isValid: boolean;
  prefix: number;
  full: string;
} {
  const cleaned = zipCode.replace(/[^0-9]/g, '');

  if (cleaned.length < 5) {
    return { isValid: false, prefix: 0, full: zipCode };
  }

  const prefix = parseInt(cleaned.substring(0, 2), 10);
  return {
    isValid: true,
    prefix,
    full: cleaned.substring(0, 5),
  };
}

/**
 * Calculate building value from purchase price
 * Formula: Purchase Price - Land Value - 1031 Dep + CapEx
 *
 * @param purchasePrice - Total purchase price
 * @param landValue - Value of land
 * @param capEx - Capital improvements
 * @param accumulated1031 - 1031 accumulated depreciation
 * @returns Building value
 */
export function calculateBuildingValue(
  purchasePrice: number,
  landValue: number,
  capEx: number = 0,
  accumulated1031: number = 0
): number {
  return purchasePrice - landValue - accumulated1031 + capEx;
}

/**
 * Estimate land value based on purchase price and acreage
 * This is a simplified calculation - real implementation may use local data
 *
 * @param purchasePrice - Total purchase price
 * @param acres - Acres of land
 * @returns Estimated land value
 */
export function estimateLandValue(purchasePrice: number, acres: number): number {
  // Use percentage-based approach
  // Small lots: 10-15% of purchase price
  // Standard lots: 15-20%
  // Large lots: 20-25%
  const basePercentage = 0.15;
  const acreageAdjustment = Math.min(acres * 0.01, 0.10);
  const percentage = Math.min(basePercentage + acreageAdjustment, 0.25);

  return Math.round(purchasePrice * percentage);
}

/**
 * Calculate depreciation for a specific year using MACRS rates
 *
 * @param buildingValue - Initial building value
 * @param year - Year number (1-based)
 * @param rates - MACRS rate table
 * @returns Depreciation amount for that year
 */
export function calculateMACRSDepreciation(
  buildingValue: number,
  year: number,
  rates: { year1: number; year2: number; year3: number; year4: number; year5: number; year6: number }
): number {
  switch (year) {
    case 1:
      return buildingValue * rates.year1;
    case 2:
      return buildingValue * rates.year2;
    case 3:
      return buildingValue * rates.year3;
    case 4:
      return buildingValue * rates.year4;
    case 5:
      return buildingValue * rates.year5;
    case 6:
      return buildingValue * rates.year6;
    default:
      return 0;
  }
}

/**
 * Calculate straight-line depreciation
 *
 * @param buildingValue - Initial building value
 * @param years - Depreciation period (27.5 or 39)
 * @returns Annual depreciation amount
 */
export function calculateStraightLineDepreciation(
  buildingValue: number,
  years: 27.5 | 39
): number {
  return buildingValue / years;
}

/**
 * Determine if property qualifies for bonus depreciation
 * Based on property type and purchase date
 *
 * @param propertyType - Type of property
 * @param purchaseDate - Date of purchase
 * @returns Whether bonus depreciation applies
 */
export function qualifiesForBonusDepreciation(
  propertyType: PropertyType,
  purchaseDate: Date
): boolean {
  // Bonus depreciation is generally available for:
  // - New or used property placed in service
  // - Certain property types
  // Check if purchase date is after Sept 27, 2017 (TCJA)
  const tcjaDate = new Date('2017-09-27');
  return purchaseDate >= tcjaDate;
}

/**
 * Get applicable bonus depreciation percentage based on year
 * TCJA bonus depreciation schedule
 *
 * @param year - Tax year
 * @returns Bonus depreciation percentage (0-1)
 */
export function getBonusDepreciationRate(year: number): number {
  if (year <= 2022) return 1.0; // 100%
  if (year === 2023) return 0.8; // 80%
  if (year === 2024) return 0.6; // 60%
  if (year === 2025) return 0.4; // 40%
  if (year === 2026) return 0.2; // 20%
  return 0; // 0% after 2026
}

/**
 * Round to nearest dollar
 *
 * @param amount - Dollar amount
 * @returns Rounded amount
 */
export function roundToDollar(amount: number): number {
  return Math.round(amount);
}

/**
 * Round to nearest hundred
 *
 * @param amount - Dollar amount
 * @returns Rounded amount
 */
export function roundToHundred(amount: number): number {
  return Math.round(amount / 100) * 100;
}

/**
 * Sanitize input string
 *
 * @param input - Raw input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Generate a summary description of a quote
 *
 * @param input - Quote input data
 * @param finalBid - Final bid amount
 * @returns Human-readable summary
 */
export function generateQuoteSummary(input: QuoteInput, finalBid: number): string {
  return `${input.productType} cost segregation study for ${formatCurrency(input.purchasePrice)} ${
    input.propertyType
  } property in ${input.zipCode}. Quote: ${formatCurrency(finalBid)}`;
}

/**
 * Error handling helper
 *
 * @param error - Error object
 * @returns QuoteCalculationError
 */
export function handleCalculationError(error: unknown): QuoteCalculationError {
  if (error instanceof QuoteCalculationError) {
    return error;
  }

  if (error instanceof Error) {
    return new QuoteCalculationError(
      error.message,
      'UNKNOWN_ERROR',
      { originalError: error }
    );
  }

  return new QuoteCalculationError(
    'An unknown error occurred during calculation',
    'UNKNOWN_ERROR',
    { error }
  );
}
