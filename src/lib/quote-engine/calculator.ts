/**
 * Quote Calculator Engine
 *
 * Replicates the Excel pricing logic from Base Pricing27.1_Pro_SMART_RCGV.xlsx
 *
 * Core Responsibilities:
 * 1. Calculate quotes based on property inputs
 * 2. Apply pricing factors from lookup tables
 * 3. Generate payment options
 * 4. Calculate depreciation schedules
 * 5. Generate comparison tables
 */

import {
  QuoteInput,
  QuoteResult,
  PropertyData,
  PricingFactors,
  PaymentOptions,
  YearByYearData,
  ComparisonTable,
  CalculatorConfig,
  ValidationResult,
  QuoteCalculationError,
  DepreciationMethod,
  LookupTables,
  CostBasisFactorEntry,
  ZipCodeFactorEntry,
  SqFtFactorEntry,
  AcresFactorEntry,
  PropertyTypeFactorEntry,
  FloorsFactorEntry,
  MultiplePropertiesEntry,
} from './types';

/**
 * Main Quote Calculator Class
 */
export class QuoteCalculator {
  private config: CalculatorConfig;

  constructor(config: CalculatorConfig) {
    this.config = config;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Main entry point: Calculate a complete quote
   *
   * @param input - Property and owner information
   * @returns Complete quote with all calculations
   * @throws QuoteCalculationError if validation fails
   */
  public calculateQuote(input: QuoteInput): QuoteResult {
    try {
      // Step 1: Validate input
      const validation = this.validateInput(input);
      if (!validation.isValid) {
        throw new QuoteCalculationError(
          'Input validation failed',
          'VALIDATION_ERROR',
          { errors: validation.errors }
        );
      }

      // Step 2: Calculate property data
      const property = this.calculatePropertyData(input);

      // Step 3: Get pricing factors
      const factors = this.getPricingFactors(input, property);

      // Step 4: Calculate base quotes using different methods
      const baseQuote = this.calculateBaseQuote(property, factors);
      const naturalLogQuote = this.calculateNaturalLogQuote(property, factors);
      const costMethodQuote = this.calculateCostMethodQuote(property, factors);

      // Step 5: Determine final bid (minimum of various methods with logic)
      const finalBid = this.calculateFinalBid(
        baseQuote,
        naturalLogQuote,
        costMethodQuote,
        input.multipleProperties
      );

      // Step 6: Calculate payment options
      const paymentOptions = this.calculatePaymentOptions(finalBid, input.isRushOrder);

      // Step 7: Calculate depreciation schedule
      const depreciationSchedule = this.calculateDepreciationSchedule(
        property.buildingValue,
        property.depreciationMethod
      );

      // Step 8: Generate comparison table
      const comparison = this.generateComparison(depreciationSchedule, property);

      // Step 9: Calculate tax benefits
      const taxBenefits = this.calculateTaxBenefits(comparison);

      // Step 10: Assemble final result
      const result: QuoteResult = {
        quoteId: this.generateQuoteId(),
        generatedAt: new Date(),
        productType: input.productType,
        input,
        property,
        baseQuote,
        naturalLogQuote,
        costMethodQuote,
        finalBid,
        factors,
        paymentOptions,
        depreciationSchedule,
        comparison,
        taxBenefits,
        warnings: validation.warnings,
      };

      return result;
    } catch (error) {
      if (error instanceof QuoteCalculationError) {
        throw error;
      }
      throw new QuoteCalculationError(
        'Quote calculation failed',
        'CALCULATION_ERROR',
        { originalError: error }
      );
    }
  }

  // ============================================================================
  // PROPERTY DATA CALCULATION
  // ============================================================================

  /**
   * Calculate property-specific data
   *
   * Formula: Building Value = Purchase Price - Land Value - 1031 Accumulated Depreciation + CapEx
   */
  private calculatePropertyData(input: QuoteInput): PropertyData {
    // Calculate land value (simplified - can be enhanced with actual formula)
    const landValue = this.calculateLandValue(input.purchasePrice, input.acresLand);

    // Get accumulated depreciation (default to 0 if not provided)
    const accumulated1031Depreciation = input.accumulated1031Depreciation || 0;

    // Calculate building value
    const buildingValue =
      input.purchasePrice - landValue - accumulated1031Depreciation + input.capEx;

    // Determine depreciation method based on property type
    const depreciationMethod = this.getDepreciationMethod(input.propertyType);

    return {
      purchasePrice: input.purchasePrice,
      landValue,
      buildingValue,
      capEx: input.capEx,
      accumulated1031Depreciation,
      depreciationMethod,
    };
  }

  /**
   * Calculate land value
   * This is a simplified version - actual formula may vary
   */
  private calculateLandValue(purchasePrice: number, acres: number): number {
    // Simplified: 15-20% of purchase price based on acreage
    const landPercentage = Math.min(0.20, 0.10 + acres * 0.02);
    return purchasePrice * landPercentage;
  }

  /**
   * Determine depreciation method based on property type
   *
   * From Excel: VLOOKUP(Property_Type, Catchup!AR22:AS31, 2, FALSE)
   * Returns 39 for commercial, 27.5 for residential
   */
  private getDepreciationMethod(propertyType: string): DepreciationMethod {
    const residentialTypes = ['Multi-Family', 'Residential/LTR', 'Short-Term Rental'];
    return residentialTypes.includes(propertyType) ? 27.5 : 39;
  }

  // ============================================================================
  // FACTOR APPLICATION
  // ============================================================================

  /**
   * Get all pricing factors from lookup tables
   */
  private getPricingFactors(input: QuoteInput, property: PropertyData): PricingFactors {
    return {
      costBasisFactor: this.lookupCostBasisFactor(property.purchasePrice),
      zipCodeFactor: this.lookupZipCodeFactor(input.zipCode),
      sqFtFactor: this.lookupSqFtFactor(input.sqFtBuilding),
      acresFactor: this.lookupAcresFactor(input.acresLand),
      propertyTypeFactor: this.lookupPropertyTypeFactor(input.propertyType),
      floorsFactor: this.lookupFloorsFactor(input.numberOfFloors),
      multiplePropertiesFactor: this.lookupMultiplePropertiesFactor(input.multipleProperties),
    };
  }

  /**
   * Apply all factors to base price
   *
   * Formula: Base × CostBasis × ZipCode × SqFt × Acres × PropertyType × Floors × MultipleProps
   */
  public applyFactors(basePrice: number, property: PropertyData): number {
    const input = property as any; // This would come from the full input in real usage
    const factors = this.getPricingFactors(input, property);

    return (
      basePrice *
      factors.costBasisFactor *
      factors.zipCodeFactor *
      factors.sqFtFactor *
      factors.acresFactor *
      factors.propertyTypeFactor *
      factors.floorsFactor *
      factors.multiplePropertiesFactor
    );
  }

  // ============================================================================
  // LOOKUP TABLE METHODS
  // ============================================================================

  /**
   * Lookup cost basis factor (VLOOKUP equivalent)
   * Finds the highest threshold <= purchasePrice
   */
  private lookupCostBasisFactor(purchasePrice: number): number {
    const table = this.config.lookupTables.costBasisFactors;
    let factor = 1.0;

    for (const entry of table) {
      if (purchasePrice >= entry.minValue) {
        factor = entry.factor;
      } else {
        break;
      }
    }

    return factor;
  }

  /**
   * Lookup zip code factor
   * Matches first 2-3 digits of zip code
   */
  private lookupZipCodeFactor(zipCode: string): number {
    const zipPrefix = parseInt(zipCode.substring(0, 2));
    const table = this.config.lookupTables.zipCodeFactors;

    for (const entry of table) {
      if (zipPrefix >= entry.zipCodePrefix) {
        return entry.factor;
      }
    }

    return 1.0; // Default
  }

  /**
   * Lookup sqft factor
   */
  private lookupSqFtFactor(sqFt: number): number {
    const table = this.config.lookupTables.sqFtFactors;
    let factor = 1.0;

    for (const entry of table) {
      if (sqFt >= entry.minSqFt) {
        factor = entry.factor;
      } else {
        break;
      }
    }

    return factor;
  }

  /**
   * Lookup acres factor
   */
  private lookupAcresFactor(acres: number): number {
    const table = this.config.lookupTables.acresFactors;
    let factor = 1.0;

    for (const entry of table) {
      if (acres >= entry.minAcres) {
        factor = entry.factor;
      } else {
        break;
      }
    }

    return factor;
  }

  /**
   * Lookup property type factor
   */
  private lookupPropertyTypeFactor(propertyType: string): number {
    const entry = this.config.lookupTables.propertyTypeFactors.find(
      (e) => e.propertyType === propertyType
    );
    return entry?.factor || 1.0;
  }

  /**
   * Lookup floors factor
   */
  private lookupFloorsFactor(floors: number): number {
    const table = this.config.lookupTables.floorsFactors;
    let factor = 1.0;

    for (const entry of table) {
      if (floors >= entry.floors) {
        factor = entry.factor;
      } else {
        break;
      }
    }

    return factor;
  }

  /**
   * Lookup multiple properties factor
   */
  private lookupMultiplePropertiesFactor(propertyCount: number): number {
    const entry = this.config.lookupTables.multiplePropertiesFactors.find(
      (e) => e.propertyCount === propertyCount
    );
    return entry?.discountFactor || 1.0;
  }

  // ============================================================================
  // QUOTE CALCULATION METHODS
  // ============================================================================

  /**
   * Calculate base quote using standard method
   * From Equation Sheet C21
   */
  private calculateBaseQuote(property: PropertyData, factors: PricingFactors): number {
    // Base formula (simplified - would need actual Excel formula)
    const baseFee = 5000; // Starting base
    const percentageFee = property.buildingValue * 0.0045; // 0.45% of building value

    let quote = baseFee + percentageFee;

    // Apply all factors
    quote *=
      factors.costBasisFactor *
      factors.zipCodeFactor *
      factors.sqFtFactor *
      factors.acresFactor *
      factors.propertyTypeFactor *
      factors.floorsFactor *
      factors.multiplePropertiesFactor;

    return Math.round(quote);
  }

  /**
   * Calculate natural log based quote
   * From Equation Sheet C51
   */
  private calculateNaturalLogQuote(property: PropertyData, factors: PricingFactors): number {
    // Natural log formula: a * ln(buildingValue) + b
    const a = 2500;
    const b = -15000;
    const quote = a * Math.log(property.buildingValue) + b;

    // Apply factors
    const adjustedQuote = quote * factors.propertyTypeFactor * factors.multiplePropertiesFactor;

    return Math.round(Math.max(adjustedQuote, 3000)); // Minimum $3,000
  }

  /**
   * Calculate cost method quote
   * From Equation Sheet AB20-AB26
   */
  private calculateCostMethodQuote(property: PropertyData, factors: PricingFactors): number {
    // Cost-based pricing
    const hourlyRate = 150;
    const estimatedHours = 20 + property.buildingValue / 100000;

    const quote = hourlyRate * estimatedHours * factors.propertyTypeFactor;

    return Math.round(quote);
  }

  /**
   * Calculate final bid using Excel's logic
   *
   * From Input Sheet B15:
   * =IF(MIN(B9,B14,D11)<D14,D14,MIN(B9,B14,D11))
   */
  private calculateFinalBid(
    baseQuote: number,
    naturalLogQuote: number,
    costMethodQuote: number,
    multipleProperties: number
  ): number {
    const minQuote = Math.min(baseQuote, naturalLogQuote);

    // If minimum is less than cost method, use cost method
    if (minQuote < costMethodQuote) {
      return costMethodQuote;
    }

    return minQuote;
  }

  // ============================================================================
  // PAYMENT OPTIONS
  // ============================================================================

  /**
   * Calculate payment options
   *
   * From Input Sheet:
   * - Upfront: Base × 0.95 (5% discount)
   * - 50/50: Base × 1.1 ÷ 2 (10% premium, split)
   * - Monthly: Base × 1.2 ÷ 12 (20% premium, monthly)
   */
  public calculatePaymentOptions(basePrice: number, isRush?: boolean): PaymentOptions {
    const upfront = Math.round(basePrice * this.config.paymentMultipliers.upfront);
    const fiftyFiftyTotal = Math.round(basePrice * this.config.paymentMultipliers.fiftyFifty);
    const fiftyFifty = Math.round(fiftyFiftyTotal / 2);
    const monthlyTotal = Math.round(basePrice * this.config.paymentMultipliers.monthly);
    const monthly = Math.round(monthlyTotal / 12);

    const paymentOptions: PaymentOptions = {
      upfront,
      fiftyFifty,
      fiftyFiftyTotal,
      monthly,
      monthlyTotal,
    };

    if (isRush && this.config.rushFeeAmount) {
      paymentOptions.rushFee = this.config.rushFeeAmount;
    }

    return paymentOptions;
  }

  // ============================================================================
  // DEPRECIATION CALCULATIONS
  // ============================================================================

  /**
   * Calculate year-by-year depreciation schedule
   *
   * From YbyY data sheet
   * Uses MACRS rates: 20%, 32%, 19.2%, 11.52%, 11.52%, 5.76%
   */
  public calculateDepreciationSchedule(
    buildingValue: number,
    method: DepreciationMethod
  ): YearByYearData[] {
    const yearsToProject = this.config.depreciationConfig.yearsToProject;
    const rates = this.config.depreciationConfig.rates;
    const bonusRate = this.config.depreciationConfig.bonusDepreciationRate || 0.8;

    const schedule: YearByYearData[] = [];
    let remainingValue = buildingValue;
    let cumulativeCostSeg = 0;
    let cumulativeStandard = 0;

    // Standard depreciation (straight line)
    const standardAnnual = buildingValue / method;

    // Cost seg with bonus depreciation
    const bonusAmount = buildingValue * 0.3 * bonusRate; // 30% of building qualifies for bonus

    for (let year = 1; year <= yearsToProject; year++) {
      let costSegThisYear = 0;

      if (year === 1) {
        // Year 1: Bonus depreciation + first year MACRS
        costSegThisYear = bonusAmount + remainingValue * rates.year1;
      } else if (year === 2) {
        costSegThisYear = remainingValue * rates.year2;
      } else if (year === 3) {
        costSegThisYear = remainingValue * rates.year3;
      } else if (year === 4) {
        costSegThisYear = remainingValue * rates.year4;
      } else if (year === 5) {
        costSegThisYear = remainingValue * rates.year5;
      } else if (year === 6) {
        costSegThisYear = remainingValue * rates.year6;
      } else {
        // After year 6, use straight line for remaining
        const yearsLeft = method - (year - 1);
        costSegThisYear = remainingValue / yearsLeft;
      }

      const standardThisYear = standardAnnual;
      cumulativeCostSeg += costSegThisYear;
      cumulativeStandard += standardThisYear;

      schedule.push({
        year,
        costSegEstimate: Math.round(costSegThisYear),
        standardDepreciation: Math.round(standardThisYear),
        traditionalCostSeg: Math.round(costSegThisYear * 0.85), // Without bonus
        bonusDepreciation: year === 1 ? Math.round(bonusAmount) : 0,
        cumulativeSavings: Math.round(cumulativeCostSeg - cumulativeStandard),
      });

      remainingValue -= costSegThisYear;
      if (remainingValue < 0) remainingValue = 0;
    }

    return schedule;
  }

  /**
   * Generate comparison table
   * Standard depreciation vs Cost Segregation
   */
  public generateComparison(
    schedule: YearByYearData[],
    property: PropertyData
  ): ComparisonTable {
    const totalCostSeg = schedule.reduce((sum, year) => sum + year.costSegEstimate, 0);
    const totalStandard = schedule.reduce((sum, year) => sum + year.standardDepreciation, 0);
    const totalBonus = schedule.reduce((sum, year) => sum + year.bonusDepreciation, 0);

    const standardVsCostSeg = totalCostSeg - totalStandard;
    const standardVsBonus = totalBonus;

    // Find break-even year (when cumulative savings turn positive)
    let breakEvenYear = 1;
    for (const yearData of schedule) {
      if (yearData.cumulativeSavings > 0) {
        breakEvenYear = yearData.year;
        break;
      }
    }

    return {
      yearByYear: schedule,
      totalSavings: {
        standardVsCostSeg,
        standardVsBonus,
      },
      breakEvenYear,
    };
  }

  // ============================================================================
  // TAX BENEFITS
  // ============================================================================

  /**
   * Calculate estimated tax benefits
   */
  private calculateTaxBenefits(comparison: ComparisonTable) {
    const estimatedTaxRate = 0.35; // 35% estimated tax rate
    const yearOneSavings = comparison.yearByYear[0]?.cumulativeSavings || 0;
    const totalSavings = comparison.totalSavings.standardVsCostSeg;

    return {
      yearOne: Math.round(yearOneSavings * estimatedTaxRate),
      totalOverPeriod: Math.round(totalSavings * estimatedTaxRate),
      estimatedTaxRate,
    };
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate quote input
   */
  private validateInput(input: QuoteInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!input.purchasePrice || input.purchasePrice <= 0) {
      errors.push('Purchase price must be greater than 0');
    }

    if (!input.zipCode || input.zipCode.length < 5) {
      errors.push('Valid zip code is required');
    }

    if (!input.sqFtBuilding || input.sqFtBuilding <= 0) {
      errors.push('Building square footage must be greater than 0');
    }

    if (!input.propertyType) {
      errors.push('Property type is required');
    }

    if (!input.propertyOwnerName) {
      errors.push('Property owner name is required');
    }

    if (!input.propertyAddress) {
      errors.push('Property address is required');
    }

    // Warnings for unusual values
    if (input.purchasePrice > 50000000) {
      warnings.push('Purchase price is unusually high (>$50M)');
    }

    if (input.sqFtBuilding > 500000) {
      warnings.push('Building size is unusually large (>500k sqft)');
    }

    if (input.numberOfFloors > 20) {
      warnings.push('Number of floors is unusually high (>20)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate unique quote ID
   */
  private generateQuoteId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `Q-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Update calculator configuration
   */
  public updateConfig(config: Partial<CalculatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): CalculatorConfig {
    return { ...this.config };
  }

  /**
   * Alias for calculateQuote for backward compatibility
   */
  public calculate(input: QuoteInput): QuoteResult {
    return this.calculateQuote(input);
  }

  /**
   * Get all pricing factors from lookup tables
   */
  public getAllFactors() {
    return this.config.lookupTables;
  }
}

/**
 * Export default calculator instance factory
 */
export function createQuoteCalculator(config: CalculatorConfig): QuoteCalculator {
  return new QuoteCalculator(config);
}

/**
 * Default calculator configuration
 */
import { LOOKUP_TABLES, MACRS_RATES, PAYMENT_MULTIPLIERS } from '../../data/lookup-tables';

const defaultConfig: CalculatorConfig = {
  lookupTables: LOOKUP_TABLES,
  paymentMultipliers: PAYMENT_MULTIPLIERS,
  rushFeeAmount: 1500,
  depreciationConfig: {
    method: 39,
    rates: MACRS_RATES,
    yearsToProject: 39,
    bonusDepreciationRate: 0.8,
  },
};

/**
 * Export singleton instance
 */
export const quoteCalculator = new QuoteCalculator(defaultConfig);
