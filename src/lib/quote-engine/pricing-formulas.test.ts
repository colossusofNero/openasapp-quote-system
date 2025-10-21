/**
 * Test Suite for Pricing Formulas
 *
 * This test file validates the pricing formulas against known Excel outputs
 * and edge cases.
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateQuote,
  validateQuoteInputs,
  getCostBasisFactor,
  getZipCodeFactor,
  getSqFtFactor,
  getAcresFactor,
  getPropertyTypeFactor,
  getFloorsFactor,
  getMultiplePropertiesFactor,
  calculateBaseBid,
  calculateNatLogQuote,
  calculateFinalBid,
  calculate5050Payment,
  calculateMonthlyPayment,
  formatCurrency,
  type QuoteInputs,
  type PricingFactors,
} from './pricing-formulas';

describe('Factor Lookup Functions', () => {
  describe('getCostBasisFactor', () => {
    it('should return correct factors for boundary values', () => {
      expect(getCostBasisFactor(0)).toBe(1.0);
      expect(getCostBasisFactor(250000)).toBe(1.01);
      expect(getCostBasisFactor(1000000)).toBe(1.075);
      expect(getCostBasisFactor(10000000)).toBe(1.5);
    });

    it('should return correct factors for in-between values', () => {
      expect(getCostBasisFactor(100000)).toBe(1.0); // Below 250k
      expect(getCostBasisFactor(600000)).toBe(1.02); // Between 500k-750k
      expect(getCostBasisFactor(15000000)).toBe(1.5); // Above 10M
    });
  });

  describe('getZipCodeFactor', () => {
    it('should return correct factors for zip code ranges', () => {
      expect(getZipCodeFactor(5000)).toBe(1.11);
      expect(getZipCodeFactor(15000)).toBe(1.1);
      expect(getZipCodeFactor(85000)).toBe(1.0);
      expect(getZipCodeFactor(99500)).toBe(1.1);
    });
  });

  describe('getSqFtFactor', () => {
    it('should return correct factors for sqft ranges', () => {
      expect(getSqFtFactor(1000)).toBe(1.0);
      expect(getSqFtFactor(3000)).toBe(1.02);
      expect(getSqFtFactor(25000)).toBe(1.1);
      expect(getSqFtFactor(60000)).toBe(1.22);
    });
  });

  describe('getAcresFactor', () => {
    it('should return correct factors for acreage', () => {
      expect(getAcresFactor(0.1)).toBe(0.75);
      expect(getAcresFactor(0.5)).toBe(0.85);
      expect(getAcresFactor(3)).toBe(1.0);
      expect(getAcresFactor(10)).toBe(1.3);
    });
  });

  describe('getPropertyTypeFactor', () => {
    it('should return correct factors for property types', () => {
      expect(getPropertyTypeFactor('Office')).toBe(1.0);
      expect(getPropertyTypeFactor('Industrial')).toBe(1.01);
      expect(getPropertyTypeFactor('Retail')).toBe(0.85);
      expect(getPropertyTypeFactor('Warehouse')).toBe(0.4);
      expect(getPropertyTypeFactor('Multi-Family')).toBe(0.4);
    });

    it('should return default factor for unknown property type', () => {
      expect(getPropertyTypeFactor('Unknown')).toBe(1.0);
    });
  });

  describe('getFloorsFactor', () => {
    it('should return correct factors for floor counts', () => {
      expect(getFloorsFactor(1)).toBe(1.0);
      expect(getFloorsFactor(3)).toBe(1.05);
      expect(getFloorsFactor(8)).toBe(1.2);
      expect(getFloorsFactor(15)).toBe(1.4); // Capped at 12
    });
  });

  describe('getMultiplePropertiesFactor', () => {
    it('should return correct discount factors', () => {
      expect(getMultiplePropertiesFactor(1)).toBe(1.0);
      expect(getMultiplePropertiesFactor(2)).toBe(0.95);
      expect(getMultiplePropertiesFactor(5)).toBe(0.8);
      expect(getMultiplePropertiesFactor(10)).toBe(0.75); // Capped at 6
    });
  });
});

describe('Base Calculation Functions', () => {
  const mockFactors: PricingFactors = {
    costBasisFactor: 1.3,
    zipCodeFactor: 1.08,
    sqftFactor: 1.0,
    acresFactor: 0.85,
    propertyTypeFactor: 0.4,
    floorsFactor: 1.0,
    multiplePropertiesFactor: 1.0,
  };

  describe('calculateBaseBid', () => {
    it('should calculate base bid correctly', () => {
      const inputs: QuoteInputs = {
        purchasePrice: 2550000,
        zipCode: 85260,
        sqftBuilding: 1500,
        acresLand: 0.78,
        propertyType: 'Multi-Family',
        numberOfFloors: 2,
        multipleProperties: 1,
        dateOfPurchase: new Date('2024-01-15'),
        taxYear: 2025,
        yearBuilt: 2020,
        capEx: 0,
        propertyOwnerName: 'Test Owner',
        propertyAddress: '123 Test St',
      };

      const baseBid = calculateBaseBid(inputs, mockFactors);

      // A20 = 2550000 + 0 = 2550000
      // A21 = (2550000 * 0.0572355 * 0.25 * 0.08) + 4000 = 6915.20625
      // C21 = 6915.20625 * 1.08 * 1.3 * 1.0 * 0.85 * 0.4 * 1.0 = 3319.55
      expect(baseBid).toBeCloseTo(3319.55, 0);
    });

    it('should include CapEx in calculation', () => {
      const inputs: QuoteInputs = {
        purchasePrice: 2000000,
        zipCode: 85260,
        sqftBuilding: 1500,
        acresLand: 0.78,
        propertyType: 'Multi-Family',
        numberOfFloors: 2,
        multipleProperties: 1,
        dateOfPurchase: new Date('2024-01-15'),
        taxYear: 2025,
        yearBuilt: 2020,
        capEx: 500000,
        propertyOwnerName: 'Test Owner',
        propertyAddress: '123 Test St',
      };

      const baseBid = calculateBaseBid(inputs, mockFactors);

      // A20 = 2000000 + 500000 = 2500000
      // A21 = (2500000 * 0.0572355 * 0.25 * 0.08) + 4000 = 6861.775
      // Should be different from the previous test
      expect(baseBid).toBeGreaterThan(3000);
    });
  });

  describe('calculateNatLogQuote', () => {
    it('should calculate natural log quote correctly', () => {
      const baseBid = 5000;
      const natLog = calculateNatLogQuote(baseBid, 2000, 5);

      // C46 = 5000 - 2000 = 3000
      // C47 = 3000 * 0.001 = 3
      // C48 = 3 * -5 = -15
      // C49 = e^(-15) ≈ 3.059e-7
      // C50 = 1 + 3.059e-7 ≈ 1.00000031
      // C51 = 5000 / 1.00000031 ≈ 4999.998
      expect(natLog).toBeCloseTo(5000, 0);
    });

    it('should reduce quote for higher base bids', () => {
      const lowBid = calculateNatLogQuote(3000, 2000, 5);
      const highBid = calculateNatLogQuote(10000, 2000, 5);

      // Higher base bid should result in lower relative quote
      expect(highBid / 10000).toBeLessThan(lowBid / 3000);
    });
  });

  describe('calculateFinalBid', () => {
    it('should select minimum when above cost method', () => {
      const result = calculateFinalBid(5000, 4800, 4900, 4000);
      expect(result).toBe(4800); // Minimum of first three
    });

    it('should select cost method when below minimum', () => {
      const result = calculateFinalBid(5000, 4800, 4900, 5500);
      expect(result).toBe(5500); // Cost method is floor
    });

    it('should handle equal values correctly', () => {
      const result = calculateFinalBid(5000, 5000, 5000, 5000);
      expect(result).toBe(5000);
    });
  });

  describe('Payment Calculations', () => {
    it('should calculate 50/50 payment correctly', () => {
      const finalBid = 10000;
      const payment = calculate5050Payment(finalBid);
      expect(payment).toBe(5500); // 10000 * 1.1 / 2
    });

    it('should calculate monthly payment correctly', () => {
      const finalBid = 10000;
      const payment = calculateMonthlyPayment(finalBid);
      expect(payment).toBe(12000); // 10000 * 1.2
    });
  });
});

describe('Input Validation', () => {
  const validInputs: QuoteInputs = {
    purchasePrice: 2550000,
    zipCode: 85260,
    sqftBuilding: 1500,
    acresLand: 0.78,
    propertyType: 'Multi-Family',
    numberOfFloors: 2,
    multipleProperties: 1,
    dateOfPurchase: new Date('2024-01-15'),
    taxYear: 2025,
    yearBuilt: 2020,
    capEx: 0,
    propertyOwnerName: 'Test Owner',
    propertyAddress: '123 Test St',
  };

  it('should pass validation for valid inputs', () => {
    const errors = validateQuoteInputs(validInputs);
    expect(errors).toHaveLength(0);
  });

  it('should reject negative purchase price', () => {
    const invalid = { ...validInputs, purchasePrice: -100 };
    const errors = validateQuoteInputs(invalid);
    expect(errors).toContain('Purchase price must be greater than 0');
  });

  it('should reject invalid zip code', () => {
    const invalid = { ...validInputs, zipCode: 999999 };
    const errors = validateQuoteInputs(invalid);
    expect(errors).toContain('Zip code must be between 0 and 99999');
  });

  it('should reject invalid property type', () => {
    const invalid = { ...validInputs, propertyType: 'Invalid Type' };
    const errors = validateQuoteInputs(invalid);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Invalid property type'))).toBe(true);
  });

  it('should reject negative square footage', () => {
    const invalid = { ...validInputs, sqftBuilding: -500 };
    const errors = validateQuoteInputs(invalid);
    expect(errors).toContain('Building square footage must be greater than 0');
  });

  it('should reject negative acres', () => {
    const invalid = { ...validInputs, acresLand: -1 };
    const errors = validateQuoteInputs(invalid);
    expect(errors).toContain('Land acres cannot be negative');
  });
});

describe('Complete Quote Calculation', () => {
  it('should calculate complete quote for Multi-Family property', () => {
    const inputs: QuoteInputs = {
      purchasePrice: 2550000,
      zipCode: 85260,
      sqftBuilding: 1500,
      acresLand: 0.78,
      propertyType: 'Multi-Family',
      numberOfFloors: 2,
      multipleProperties: 1,
      dateOfPurchase: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2020,
      capEx: 0,
      propertyOwnerName: 'Acme Properties LLC',
      propertyAddress: '123 Main St, Phoenix, AZ 85260',
    };

    const results = calculateQuote(inputs);

    // Verify all results are numbers
    expect(typeof results.baseCostSegBid).toBe('number');
    expect(typeof results.natLogQuote).toBe('number');
    expect(typeof results.multiplePropertiesQuote).toBe('number');
    expect(typeof results.costMethodQuote).toBe('number');
    expect(typeof results.finalBid).toBe('number');
    expect(typeof results.payment5050).toBe('number');
    expect(typeof results.paymentMonthly).toBe('number');

    // Verify all results are positive
    expect(results.baseCostSegBid).toBeGreaterThan(0);
    expect(results.finalBid).toBeGreaterThan(0);
    expect(results.payment5050).toBeGreaterThan(0);
    expect(results.paymentMonthly).toBeGreaterThan(0);

    // Verify payment relationships
    expect(results.paymentMonthly).toBeCloseTo(results.finalBid * 1.2, 1);
    expect(results.payment5050).toBeCloseTo((results.finalBid * 1.1) / 2, 1);

    // Verify factors were calculated
    expect(results.factors.propertyTypeFactor).toBe(0.4); // Multi-Family
  });

  it('should calculate complete quote for Office property', () => {
    const inputs: QuoteInputs = {
      purchasePrice: 5000000,
      zipCode: 10001,
      sqftBuilding: 25000,
      acresLand: 2,
      propertyType: 'Office',
      numberOfFloors: 5,
      multipleProperties: 1,
      dateOfPurchase: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2018,
      capEx: 250000,
      propertyOwnerName: 'Office Corp',
      propertyAddress: '456 Business Blvd, New York, NY 10001',
    };

    const results = calculateQuote(inputs);

    // Office property should have 1.0 factor
    expect(results.factors.propertyTypeFactor).toBe(1.0);

    // Larger property should have higher quote
    expect(results.finalBid).toBeGreaterThan(5000);
  });

  it('should apply multiple properties discount', () => {
    const singleProperty: QuoteInputs = {
      purchasePrice: 2000000,
      zipCode: 85260,
      sqftBuilding: 1500,
      acresLand: 0.78,
      propertyType: 'Multi-Family',
      numberOfFloors: 2,
      multipleProperties: 1,
      dateOfPurchase: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2020,
      capEx: 0,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
    };

    const multipleProperties: QuoteInputs = {
      ...singleProperty,
      multipleProperties: 3,
    };

    const singleResult = calculateQuote(singleProperty);
    const multipleResult = calculateQuote(multipleProperties);

    // Multiple properties quote should be less due to discount
    expect(multipleResult.multiplePropertiesQuote).toBeLessThan(singleResult.multiplePropertiesQuote);
    expect(multipleResult.factors.multiplePropertiesFactor).toBe(0.9); // 3 properties
  });
});

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1234567)).toBe('$1,234,567');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should round to nearest dollar', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(1234.49)).toBe('$1,234');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle minimum purchase price', () => {
    const inputs: QuoteInputs = {
      purchasePrice: 100000,
      zipCode: 85260,
      sqftBuilding: 1000,
      acresLand: 0.5,
      propertyType: 'Office',
      numberOfFloors: 1,
      multipleProperties: 1,
      dateOfPurchase: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2020,
      capEx: 0,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
    };

    const results = calculateQuote(inputs);
    expect(results.finalBid).toBeGreaterThan(0);
  });

  it('should handle maximum purchase price', () => {
    const inputs: QuoteInputs = {
      purchasePrice: 20000000,
      zipCode: 85260,
      sqftBuilding: 50000,
      acresLand: 10,
      propertyType: 'Office',
      numberOfFloors: 12,
      multipleProperties: 1,
      dateOfPurchase: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2020,
      capEx: 1000000,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
    };

    const results = calculateQuote(inputs);
    expect(results.finalBid).toBeGreaterThan(0);
    expect(results.factors.costBasisFactor).toBe(1.5); // Max factor
  });

  it('should handle warehouse property with large discount', () => {
    const inputs: QuoteInputs = {
      purchasePrice: 2000000,
      zipCode: 85260,
      sqftBuilding: 30000,
      acresLand: 3,
      propertyType: 'Warehouse',
      numberOfFloors: 1,
      multipleProperties: 1,
      dateOfPurchase: new Date('2024-01-15'),
      taxYear: 2025,
      yearBuilt: 2020,
      capEx: 0,
      propertyOwnerName: 'Test Owner',
      propertyAddress: '123 Test St',
    };

    const results = calculateQuote(inputs);
    expect(results.factors.propertyTypeFactor).toBe(0.4); // Large discount
    expect(results.baseCostSegBid).toBeLessThan(10000); // Should be significantly reduced
  });
});
