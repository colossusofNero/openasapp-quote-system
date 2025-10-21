/**
 * Quote Engine - Main Export Module
 *
 * Centralized exports for the quote calculation engine
 */

// Core Calculator
export { QuoteCalculator, createQuoteCalculator, quoteCalculator } from './calculator';

// Type Definitions
export type {
  QuoteInput,
  QuoteResult,
  PropertyData,
  PropertyType,
  ProductType,
  DepreciationMethod,
  PricingFactors,
  PaymentOptions,
  YearByYearData,
  ComparisonTable,
  ValidationResult,
  CalculatorConfig,
  LookupTables,
  CostBasisFactorEntry,
  ZipCodeFactorEntry,
  SqFtFactorEntry,
  AcresFactorEntry,
  PropertyTypeFactorEntry,
  FloorsFactorEntry,
  MultiplePropertiesEntry,
  DepreciationRates,
  DepreciationConfig,
  PartialQuote,
  CalculationStep,
} from './types';

// Error Classes
export { QuoteCalculationError } from './types';

// Lookup Tables and Configuration
export {
  LOOKUP_TABLES,
  MACRS_RATES,
  PAYMENT_MULTIPLIERS,
  DEFAULT_CONFIG,
  PROPERTY_TYPE_CATEGORIES,
  VALIDATION_RANGES,
  getLookupTables,
  getPropertyTypeFactor,
  getDepreciationYears,
  isValidPropertyType,
  getDefaultCalculatorConfig,
} from '../../data/lookup-tables';

// Utility Functions
export { validateQuoteInput, formatCurrency, formatPercentage } from './utils';

// Pricing Formulas (Excel-to-TypeScript Implementation)
export {
  calculateQuote,
  calculatePricingFactors,
  calculateBaseBid,
  calculateNatLogQuote,
  calculateMultiplePropertiesQuote,
  calculateCostMethodQuote,
  calculateFinalBid,
  calculate5050Payment,
  calculateMonthlyPayment,
  getCostBasisFactor,
  getZipCodeFactor,
  getSqFtFactor,
  getAcresFactor,
  getPropertyTypeFactor as getPropertyTypeFactorFromFormulas,
  getFloorsFactor,
  getMultiplePropertiesFactor,
  validateQuoteInputs,
  createQuoteSummary,
  COST_BASIS_FACTORS,
  ZIP_CODE_FACTORS,
  SQFT_FACTORS,
  ACRES_FACTORS,
  PROPERTY_TYPE_FACTORS,
  FLOORS_FACTORS,
  MULTIPLE_PROPERTIES_FACTORS,
} from './pricing-formulas';

export type {
  QuoteInputs,
  PricingFactors as PricingFactorsFromFormulas,
  QuoteResults,
} from './pricing-formulas';
