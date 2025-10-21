/**
 * Unit Tests for Quote Calculator
 *
 * Tests the core business logic of the quote calculation engine
 */

import { QuoteCalculator } from '../../../src/lib/quote-engine/calculator';
import {
  QuoteInput,
  QuoteResult,
  PropertyData,
  PaymentOptions,
  YearByYearData,
  ComparisonTable,
  QuoteCalculationError,
} from '../../../src/lib/quote-engine/types';
import { getDefaultCalculatorConfig } from '../../../src/data/lookup-tables';

describe('QuoteCalculator', () => {
  let calculator: QuoteCalculator;

  beforeEach(() => {
    calculator = new QuoteCalculator(getDefaultCalculatorConfig());
  });

  // ============================================================================
  // SETUP AND CONFIGURATION TESTS
  // ============================================================================

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = calculator.getConfig();
      expect(config).toBeDefined();
      expect(config.lookupTables).toBeDefined();
      expect(config.depreciationConfig).toBeDefined();
      expect(config.paymentMultipliers).toBeDefined();
    });

    it('should allow configuration updates', () => {
      const newMinimum = 5000;
      calculator.updateConfig({ minimumQuote: newMinimum });
      const config = calculator.getConfig();
      expect(config.minimumQuote).toBe(newMinimum);
    });
  });

  // ============================================================================
  // INPUT VALIDATION TESTS
  // ============================================================================

  describe('Input Validation', () => {
    const validInput: QuoteInput = {
      purchasePrice: 2550000,
      zipCode: '85260',
      sqFtBuilding: 1500,
      acresLand: 0.78,
      propertyType: 'Multi-Family',
      numberOfFloors: 2,
      multipleProperties: 1,
      purchaseDate: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2010,
      capEx: 50000,
      propertyOwnerName: 'Test Owner LLC',
      propertyAddress: '123 Main St, Phoenix, AZ 85260',
      productType: 'RCGV',
    };

    it('should accept valid input', () => {
      expect(() => calculator.calculateQuote(validInput)).not.toThrow();
    });

    it('should reject negative purchase price', () => {
      const invalidInput = { ...validInput, purchasePrice: -100000 };
      expect(() => calculator.calculateQuote(invalidInput)).toThrow(QuoteCalculationError);
    });

    it('should reject zero purchase price', () => {
      const invalidInput = { ...validInput, purchasePrice: 0 };
      expect(() => calculator.calculateQuote(invalidInput)).toThrow(QuoteCalculationError);
    });

    it('should reject invalid zip code', () => {
      const invalidInput = { ...validInput, zipCode: '123' };
      expect(() => calculator.calculateQuote(invalidInput)).toThrow(QuoteCalculationError);
    });

    it('should reject missing property owner name', () => {
      const invalidInput = { ...validInput, propertyOwnerName: '' };
      expect(() => calculator.calculateQuote(invalidInput)).toThrow(QuoteCalculationError);
    });

    it('should reject missing property address', () => {
      const invalidInput = { ...validInput, propertyAddress: '' };
      expect(() => calculator.calculateQuote(invalidInput)).toThrow(QuoteCalculationError);
    });

    it('should warn for unusually high purchase price', () => {
      const input = { ...validInput, purchasePrice: 60000000 };
      const result = calculator.calculateQuote(input);
      expect(result.warnings?.length).toBeGreaterThan(0);
      expect(result.warnings?.[0]).toContain('unusually high');
    });
  });

  // ============================================================================
  // QUOTE CALCULATION TESTS
  // ============================================================================

  describe('Quote Calculation', () => {
    const sampleInput: QuoteInput = {
      purchasePrice: 2550000,
      zipCode: '85260',
      sqFtBuilding: 1500,
      acresLand: 0.78,
      propertyType: 'Multi-Family',
      numberOfFloors: 2,
      multipleProperties: 1,
      purchaseDate: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2010,
      capEx: 50000,
      propertyOwnerName: 'John Smith',
      propertyAddress: '123 Main St, Phoenix, AZ 85260',
      productType: 'RCGV',
    };

    it('should calculate a complete quote', () => {
      const result = calculator.calculateQuote(sampleInput);

      expect(result).toBeDefined();
      expect(result.quoteId).toBeDefined();
      expect(result.finalBid).toBeGreaterThan(0);
      expect(result.property).toBeDefined();
      expect(result.factors).toBeDefined();
      expect(result.paymentOptions).toBeDefined();
      expect(result.depreciationSchedule).toBeDefined();
      expect(result.comparison).toBeDefined();
    });

    it('should generate unique quote IDs', () => {
      const result1 = calculator.calculateQuote(sampleInput);
      const result2 = calculator.calculateQuote(sampleInput);

      expect(result1.quoteId).not.toBe(result2.quoteId);
    });

    it('should calculate property data correctly', () => {
      const result = calculator.calculateQuote(sampleInput);
      const property = result.property;

      expect(property.purchasePrice).toBe(sampleInput.purchasePrice);
      expect(property.capEx).toBe(sampleInput.capEx);
      expect(property.landValue).toBeGreaterThan(0);
      expect(property.buildingValue).toBeGreaterThan(0);
      expect(property.buildingValue).toBeLessThan(property.purchasePrice);
    });

    it('should apply 27.5 year depreciation for residential properties', () => {
      const result = calculator.calculateQuote(sampleInput);
      expect(result.property.depreciationMethod).toBe(27.5);
    });

    it('should apply 39 year depreciation for commercial properties', () => {
      const commercialInput = { ...sampleInput, propertyType: 'Office' as const };
      const result = calculator.calculateQuote(commercialInput);
      expect(result.property.depreciationMethod).toBe(39);
    });

    it('should return minimum quote of various calculation methods', () => {
      const result = calculator.calculateQuote(sampleInput);

      expect(result.finalBid).toBeGreaterThanOrEqual(result.config.minimumQuote || 0);
      expect(result.finalBid).toBeLessThanOrEqual(
        Math.max(result.baseQuote, result.naturalLogQuote, result.costMethodQuote)
      );
    });
  });

  // ============================================================================
  // FACTOR APPLICATION TESTS
  // ============================================================================

  describe('Pricing Factors', () => {
    const baseInput: QuoteInput = {
      purchasePrice: 1000000,
      zipCode: '85260',
      sqFtBuilding: 5000,
      acresLand: 1.0,
      propertyType: 'Office',
      numberOfFloors: 2,
      multipleProperties: 1,
      purchaseDate: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2010,
      capEx: 0,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
      productType: 'RCGV',
    };

    it('should apply higher cost basis factor for expensive properties', () => {
      const cheapProperty = { ...baseInput, purchasePrice: 500000 };
      const expensiveProperty = { ...baseInput, purchasePrice: 5000000 };

      const result1 = calculator.calculateQuote(cheapProperty);
      const result2 = calculator.calculateQuote(expensiveProperty);

      expect(result2.factors.costBasisFactor).toBeGreaterThan(result1.factors.costBasisFactor);
    });

    it('should apply zip code factor correctly', () => {
      const phoenixInput = { ...baseInput, zipCode: '85260' };
      const nyInput = { ...baseInput, zipCode: '10001' };

      const result1 = calculator.calculateQuote(phoenixInput);
      const result2 = calculator.calculateQuote(nyInput);

      // NY should have higher factor
      expect(result2.factors.zipCodeFactor).toBeGreaterThan(result1.factors.zipCodeFactor);
    });

    it('should apply sqft factor for larger buildings', () => {
      const smallBuilding = { ...baseInput, sqFtBuilding: 1000 };
      const largeBuilding = { ...baseInput, sqFtBuilding: 50000 };

      const result1 = calculator.calculateQuote(smallBuilding);
      const result2 = calculator.calculateQuote(largeBuilding);

      expect(result2.factors.sqFtFactor).toBeGreaterThan(result1.factors.sqFtFactor);
    });

    it('should apply property type discount for multi-family', () => {
      const officeInput = { ...baseInput, propertyType: 'Office' as const };
      const multiFamily = { ...baseInput, propertyType: 'Multi-Family' as const };

      const result1 = calculator.calculateQuote(officeInput);
      const result2 = calculator.calculateQuote(multiFamily);

      // Multi-family should have lower factor (0.4 vs 1.0)
      expect(result2.factors.propertyTypeFactor).toBeLessThan(result1.factors.propertyTypeFactor);
    });

    it('should apply discount for multiple properties', () => {
      const singleProperty = { ...baseInput, multipleProperties: 1 };
      const multipleProps = { ...baseInput, multipleProperties: 5 };

      const result1 = calculator.calculateQuote(singleProperty);
      const result2 = calculator.calculateQuote(multipleProps);

      expect(result2.factors.multiplePropertiesFactor).toBeLessThan(
        result1.factors.multiplePropertiesFactor
      );
    });
  });

  // ============================================================================
  // PAYMENT OPTIONS TESTS
  // ============================================================================

  describe('Payment Options', () => {
    it('should calculate upfront discount correctly', () => {
      const basePrice = 10000;
      const options = calculator.calculatePaymentOptions(basePrice);

      expect(options.upfront).toBe(9500); // 10000 * 0.95
    });

    it('should calculate 50/50 payment with premium', () => {
      const basePrice = 10000;
      const options = calculator.calculatePaymentOptions(basePrice);

      expect(options.fiftyFiftyTotal).toBe(11000); // 10000 * 1.1
      expect(options.fiftyFifty).toBe(5500); // 11000 / 2
    });

    it('should calculate monthly payment with premium', () => {
      const basePrice = 10000;
      const options = calculator.calculatePaymentOptions(basePrice);

      expect(options.monthlyTotal).toBe(12000); // 10000 * 1.2
      expect(options.monthly).toBe(1000); // 12000 / 12
    });

    it('should add rush fee when requested', () => {
      const basePrice = 10000;
      const options = calculator.calculatePaymentOptions(basePrice, true);

      expect(options.rushFee).toBeDefined();
      expect(options.rushFee).toBeGreaterThan(0);
    });

    it('should not add rush fee when not requested', () => {
      const basePrice = 10000;
      const options = calculator.calculatePaymentOptions(basePrice, false);

      expect(options.rushFee).toBeUndefined();
    });
  });

  // ============================================================================
  // DEPRECIATION SCHEDULE TESTS
  // ============================================================================

  describe('Depreciation Schedule', () => {
    const buildingValue = 2000000;

    it('should calculate depreciation schedule for 39 years', () => {
      const schedule = calculator.calculateDepreciationSchedule(buildingValue, 39);

      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0].year).toBe(1);
    });

    it('should calculate depreciation schedule for 27.5 years', () => {
      const schedule = calculator.calculateDepreciationSchedule(buildingValue, 27.5);

      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0].year).toBe(1);
    });

    it('should have higher first year depreciation with bonus', () => {
      const schedule = calculator.calculateDepreciationSchedule(buildingValue, 39);

      // Year 1 should be significantly higher due to bonus depreciation
      expect(schedule[0].costSegEstimate).toBeGreaterThan(schedule[1].costSegEstimate);
      expect(schedule[0].bonusDepreciation).toBeGreaterThan(0);
    });

    it('should have zero bonus depreciation after year 1', () => {
      const schedule = calculator.calculateDepreciationSchedule(buildingValue, 39);

      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].bonusDepreciation).toBe(0);
      }
    });

    it('should follow MACRS rates for years 1-6', () => {
      const schedule = calculator.calculateDepreciationSchedule(buildingValue, 39);

      // Year 2 should use 32% rate (higher than year 3's 19.2%)
      expect(schedule[1].costSegEstimate).toBeGreaterThan(schedule[2].costSegEstimate);
    });

    it('should calculate cumulative savings', () => {
      const schedule = calculator.calculateDepreciationSchedule(buildingValue, 39);

      // Cumulative savings should be tracked
      expect(schedule[0].cumulativeSavings).toBeDefined();

      // Should generally increase over time (with cost seg)
      const lastYear = schedule[schedule.length - 1];
      expect(Math.abs(lastYear.cumulativeSavings)).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // COMPARISON TABLE TESTS
  // ============================================================================

  describe('Comparison Table', () => {
    const sampleInput: QuoteInput = {
      purchasePrice: 2000000,
      zipCode: '85260',
      sqFtBuilding: 5000,
      acresLand: 1.0,
      propertyType: 'Office',
      numberOfFloors: 2,
      multipleProperties: 1,
      purchaseDate: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2010,
      capEx: 0,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
      productType: 'RCGV',
    };

    it('should generate comparison table', () => {
      const result = calculator.calculateQuote(sampleInput);
      const comparison = result.comparison;

      expect(comparison).toBeDefined();
      expect(comparison.yearByYear).toBeDefined();
      expect(comparison.totalSavings).toBeDefined();
      expect(comparison.breakEvenYear).toBeDefined();
    });

    it('should calculate total savings correctly', () => {
      const result = calculator.calculateQuote(sampleInput);
      const comparison = result.comparison;

      expect(comparison.totalSavings.standardVsCostSeg).toBeDefined();
      expect(comparison.totalSavings.standardVsBonus).toBeDefined();
    });

    it('should identify break-even year', () => {
      const result = calculator.calculateQuote(sampleInput);
      const comparison = result.comparison;

      expect(comparison.breakEvenYear).toBeGreaterThanOrEqual(1);
      expect(comparison.breakEvenYear).toBeLessThanOrEqual(comparison.yearByYear.length);
    });
  });

  // ============================================================================
  // TAX BENEFITS TESTS
  // ============================================================================

  describe('Tax Benefits', () => {
    const sampleInput: QuoteInput = {
      purchasePrice: 2000000,
      zipCode: '85260',
      sqFtBuilding: 5000,
      acresLand: 1.0,
      propertyType: 'Office',
      numberOfFloors: 2,
      multipleProperties: 1,
      purchaseDate: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2010,
      capEx: 0,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
      productType: 'RCGV',
    };

    it('should calculate year one tax benefits', () => {
      const result = calculator.calculateQuote(sampleInput);

      expect(result.taxBenefits.yearOne).toBeDefined();
      expect(result.taxBenefits.yearOne).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total tax benefits over period', () => {
      const result = calculator.calculateQuote(sampleInput);

      expect(result.taxBenefits.totalOverPeriod).toBeDefined();
      expect(result.taxBenefits.totalOverPeriod).toBeGreaterThan(result.taxBenefits.yearOne);
    });

    it('should use 35% estimated tax rate', () => {
      const result = calculator.calculateQuote(sampleInput);

      expect(result.taxBenefits.estimatedTaxRate).toBe(0.35);
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases', () => {
    const validInput: QuoteInput = {
      purchasePrice: 1000000,
      zipCode: '85260',
      sqFtBuilding: 5000,
      acresLand: 1.0,
      propertyType: 'Office',
      numberOfFloors: 2,
      multipleProperties: 1,
      purchaseDate: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2010,
      capEx: 0,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
      productType: 'RCGV',
    };

    it('should handle very small properties', () => {
      const smallInput = { ...validInput, purchasePrice: 100000, sqFtBuilding: 500 };
      const result = calculator.calculateQuote(smallInput);

      expect(result.finalBid).toBeGreaterThan(0);
    });

    it('should handle very large properties', () => {
      const largeInput = { ...validInput, purchasePrice: 20000000, sqFtBuilding: 200000 };
      const result = calculator.calculateQuote(largeInput);

      expect(result.finalBid).toBeGreaterThan(0);
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it('should handle properties with no land', () => {
      const noLandInput = { ...validInput, acresLand: 0.01 };
      const result = calculator.calculateQuote(noLandInput);

      expect(result.finalBid).toBeGreaterThan(0);
    });

    it('should handle properties with no capex', () => {
      const noCapExInput = { ...validInput, capEx: 0 };
      const result = calculator.calculateQuote(noCapExInput);

      expect(result.finalBid).toBeGreaterThan(0);
      expect(result.property.capEx).toBe(0);
    });

    it('should handle properties with high capex', () => {
      const highCapExInput = { ...validInput, capEx: 500000 };
      const result = calculator.calculateQuote(highCapExInput);

      expect(result.property.buildingValue).toBeGreaterThan(validInput.purchasePrice);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Full Quote Integration', () => {
    it('should generate complete RCGV quote', () => {
      const input: QuoteInput = {
        purchasePrice: 2550000,
        zipCode: '85260',
        sqFtBuilding: 1500,
        acresLand: 0.78,
        propertyType: 'Multi-Family',
        numberOfFloors: 2,
        multipleProperties: 1,
        purchaseDate: new Date('2024-01-15'),
        taxYear: 2025,
        yearBuilt: 2010,
        capEx: 50000,
        propertyOwnerName: 'Phoenix Property Group LLC',
        propertyAddress: '456 Desert Blvd, Phoenix, AZ 85260',
        productType: 'RCGV',
      };

      const result = calculator.calculateQuote(input);

      // Verify all major components are present
      expect(result.quoteId).toMatch(/^Q-/);
      expect(result.productType).toBe('RCGV');
      expect(result.finalBid).toBeGreaterThan(3000);
      expect(result.paymentOptions.upfront).toBeLessThan(result.finalBid);
      expect(result.paymentOptions.fiftyFiftyTotal).toBeGreaterThan(result.finalBid);
      expect(result.paymentOptions.monthlyTotal).toBeGreaterThan(result.paymentOptions.fiftyFiftyTotal);
      expect(result.depreciationSchedule.length).toBeGreaterThan(10);
      expect(result.comparison.totalSavings.standardVsCostSeg).toBeDefined();
    });

    it('should generate complete Pro quote', () => {
      const input: QuoteInput = {
        purchasePrice: 5000000,
        zipCode: '10001',
        sqFtBuilding: 25000,
        acresLand: 2.5,
        propertyType: 'Office',
        numberOfFloors: 5,
        multipleProperties: 1,
        purchaseDate: new Date('2024-06-01'),
        taxYear: 2025,
        yearBuilt: 2015,
        capEx: 250000,
        propertyOwnerName: 'Manhattan Commercial Properties',
        propertyAddress: '789 Broadway, New York, NY 10001',
        productType: 'Pro',
      };

      const result = calculator.calculateQuote(input);

      expect(result.productType).toBe('Pro');
      expect(result.finalBid).toBeGreaterThan(10000); // Higher for Pro
      expect(result.factors.zipCodeFactor).toBeGreaterThan(1.05); // NY premium
      expect(result.property.depreciationMethod).toBe(39); // Commercial
    });
  });
});
