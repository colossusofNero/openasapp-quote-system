/**
 * Quote Engine Usage Examples
 *
 * Real-world examples demonstrating how to use the quote calculation engine
 */

import { QuoteCalculator, createQuoteCalculator } from './calculator';
import { QuoteInput, QuoteResult } from './types';
import { getDefaultCalculatorConfig } from '../../data/lookup-tables';
import { formatCurrency, formatPercentage, validateQuoteInput } from './utils';

// ============================================================================
// EXAMPLE 1: Basic Multi-Family Property in Phoenix
// ============================================================================

export function example1_BasicMultiFamily() {
  console.log('\n=== Example 1: Multi-Family Property in Phoenix ===\n');

  // Create calculator instance
  const calculator = createQuoteCalculator(getDefaultCalculatorConfig());

  // Prepare input data
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
    propertyAddress: '123 Desert Blvd, Phoenix, AZ 85260',
    productType: 'RCGV',
  };

  // Calculate quote
  const result = calculator.calculateQuote(input);

  // Display results
  console.log(`Quote ID: ${result.quoteId}`);
  console.log(`Product: ${result.productType}`);
  console.log(`\nProperty Details:`);
  console.log(`  Purchase Price: ${formatCurrency(result.property.purchasePrice)}`);
  console.log(`  Building Value: ${formatCurrency(result.property.buildingValue)}`);
  console.log(`  Land Value: ${formatCurrency(result.property.landValue)}`);
  console.log(`  Depreciation Method: ${result.property.depreciationMethod} years`);

  console.log(`\nQuote Calculations:`);
  console.log(`  Base Quote: ${formatCurrency(result.baseQuote)}`);
  console.log(`  Natural Log Quote: ${formatCurrency(result.naturalLogQuote)}`);
  console.log(`  Cost Method Quote: ${formatCurrency(result.costMethodQuote)}`);
  console.log(`  Final Bid: ${formatCurrency(result.finalBid)} ⭐`);

  console.log(`\nPricing Factors Applied:`);
  console.log(`  Cost Basis: ${result.factors.costBasisFactor}x`);
  console.log(`  Zip Code: ${result.factors.zipCodeFactor}x`);
  console.log(`  SqFt: ${result.factors.sqFtFactor}x`);
  console.log(`  Acres: ${result.factors.acresFactor}x`);
  console.log(`  Property Type: ${result.factors.propertyTypeFactor}x`);
  console.log(`  Floors: ${result.factors.floorsFactor}x`);

  console.log(`\nPayment Options:`);
  console.log(`  Upfront (5% discount): ${formatCurrency(result.paymentOptions.upfront)}`);
  console.log(`  50/50 (10% premium): ${formatCurrency(result.paymentOptions.fiftyFifty)} × 2 = ${formatCurrency(result.paymentOptions.fiftyFiftyTotal)}`);
  console.log(`  Monthly (20% premium): ${formatCurrency(result.paymentOptions.monthly)} × 12 = ${formatCurrency(result.paymentOptions.monthlyTotal)}`);

  console.log(`\nTax Benefits:`);
  console.log(`  Year 1 Savings: ${formatCurrency(result.taxBenefits.yearOne)}`);
  console.log(`  Total Period Savings: ${formatCurrency(result.taxBenefits.totalOverPeriod)}`);
  console.log(`  ROI: ${(result.taxBenefits.totalOverPeriod / result.finalBid).toFixed(1)}x`);

  console.log(`\nFirst 5 Years Depreciation:`);
  result.depreciationSchedule.slice(0, 5).forEach((year) => {
    console.log(`  Year ${year.year}: ${formatCurrency(year.costSegEstimate)} (Cumulative Savings: ${formatCurrency(year.cumulativeSavings)})`);
  });

  return result;
}

// ============================================================================
// EXAMPLE 2: Commercial Office Building in New York
// ============================================================================

export function example2_CommercialOfficeNY() {
  console.log('\n=== Example 2: Commercial Office in Manhattan ===\n');

  const calculator = createQuoteCalculator(getDefaultCalculatorConfig());

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
    propertyOwnerName: 'Manhattan Commercial Properties LLC',
    propertyAddress: '789 Broadway, New York, NY 10001',
    productType: 'Pro',
  };

  const result = calculator.calculateQuote(input);

  console.log(`Quote ID: ${result.quoteId}`);
  console.log(`Product: ${result.productType} (Premium)`);
  console.log(`Final Bid: ${formatCurrency(result.finalBid)}`);
  console.log(`\nGeographic Premium: ${result.factors.zipCodeFactor}x (NYC)`);
  console.log(`Building Size Premium: ${result.factors.sqFtFactor}x (25k sqft)`);
  console.log(`Height Premium: ${result.factors.floorsFactor}x (5 floors)`);
  console.log(`\nDepreciation: ${result.property.depreciationMethod} years (Commercial)`);
  console.log(`Year 1 Tax Benefit: ${formatCurrency(result.taxBenefits.yearOne)}`);
  console.log(`ROI: ${(result.taxBenefits.totalOverPeriod / result.finalBid).toFixed(1)}x`);

  return result;
}

// ============================================================================
// EXAMPLE 3: Multiple Properties Portfolio
// ============================================================================

export function example3_MultipleProperties() {
  console.log('\n=== Example 3: Multiple Properties Portfolio ===\n');

  const calculator = createQuoteCalculator(getDefaultCalculatorConfig());

  const input: QuoteInput = {
    purchasePrice: 8000000,
    zipCode: '33101',
    sqFtBuilding: 50000,
    acresLand: 5.0,
    propertyType: 'Retail',
    numberOfFloors: 2,
    multipleProperties: 5, // 5 properties = 25% discount
    purchaseDate: new Date('2024-03-01'),
    taxYear: 2025,
    yearBuilt: 2018,
    capEx: 0,
    propertyOwnerName: 'Florida Retail Group',
    propertyAddress: '456 Miami Ave, Miami, FL 33101',
    productType: 'RCGV',
  };

  const result = calculator.calculateQuote(input);

  console.log(`Quote ID: ${result.quoteId}`);
  console.log(`Number of Properties: ${input.multipleProperties}`);
  console.log(`Volume Discount: ${result.factors.multiplePropertiesFactor}x (25% off)`);
  console.log(`Property Type Discount: ${result.factors.propertyTypeFactor}x (Retail)`);
  console.log(`\nBase Quote (before discounts): ${formatCurrency(result.baseQuote)}`);
  console.log(`Final Bid (with discounts): ${formatCurrency(result.finalBid)}`);
  console.log(`Total Savings from Discounts: ${formatCurrency(result.baseQuote - result.finalBid)}`);
  console.log(`\nPer-Property Cost: ${formatCurrency(result.finalBid / input.multipleProperties)}`);

  return result;
}

// ============================================================================
// EXAMPLE 4: Warehouse Property (High Discount)
// ============================================================================

export function example4_Warehouse() {
  console.log('\n=== Example 4: Warehouse Property ===\n');

  const calculator = createQuoteCalculator(getDefaultCalculatorConfig());

  const input: QuoteInput = {
    purchasePrice: 3000000,
    zipCode: '60601',
    sqFtBuilding: 75000,
    acresLand: 10.0,
    propertyType: 'Warehouse',
    numberOfFloors: 1,
    multipleProperties: 1,
    purchaseDate: new Date('2024-02-01'),
    taxYear: 2025,
    yearBuilt: 2005,
    capEx: 100000,
    propertyOwnerName: 'Midwest Logistics LLC',
    propertyAddress: '789 Industrial Dr, Chicago, IL 60601',
    productType: 'RCGV',
  };

  const result = calculator.calculateQuote(input);

  console.log(`Quote ID: ${result.quoteId}`);
  console.log(`Property Type: Warehouse (Simplified Analysis)`);
  console.log(`Property Type Factor: ${result.factors.propertyTypeFactor}x (60% discount!)`);
  console.log(`Building Size: ${input.sqFtBuilding.toLocaleString()} sqft`);
  console.log(`Size Factor: ${result.factors.sqFtFactor}x`);
  console.log(`\nFinal Bid: ${formatCurrency(result.finalBid)}`);
  console.log(`Upfront Payment: ${formatCurrency(result.paymentOptions.upfront)}`);
  console.log(`\nThis property type gets high discount due to:`);
  console.log(`  • Simpler construction (single floor, open layout)`);
  console.log(`  • Fewer specialized systems`);
  console.log(`  • Lower analysis complexity`);

  return result;
}

// ============================================================================
// EXAMPLE 5: Rush Order with Premium
// ============================================================================

export function example5_RushOrder() {
  console.log('\n=== Example 5: Rush Order ===\n');

  const calculator = createQuoteCalculator(getDefaultCalculatorConfig());

  const input: QuoteInput = {
    purchasePrice: 1500000,
    zipCode: '94102',
    sqFtBuilding: 8000,
    acresLand: 0.5,
    propertyType: 'Restaurant',
    numberOfFloors: 2,
    multipleProperties: 1,
    purchaseDate: new Date('2024-09-01'),
    taxYear: 2025,
    yearBuilt: 2020,
    capEx: 75000,
    propertyOwnerName: 'SF Dining Group',
    propertyAddress: '123 Market St, San Francisco, CA 94102',
    productType: 'Pro',
    isRushOrder: true, // Rush order flag
  };

  const result = calculator.calculateQuote(input);

  console.log(`Quote ID: ${result.quoteId}`);
  console.log(`Product: ${result.productType} (Rush Order)`);
  console.log(`\nStandard Pricing:`);
  console.log(`  Final Bid: ${formatCurrency(result.finalBid)}`);
  console.log(`\nRush Order Fee: ${formatCurrency(result.paymentOptions.rushFee || 0)} 🚀`);
  console.log(`\nPayment Options (with Rush Fee):`);
  console.log(`  Upfront: ${formatCurrency(result.paymentOptions.upfront + (result.paymentOptions.rushFee || 0))}`);
  console.log(`  50/50: ${formatCurrency(result.paymentOptions.fiftyFifty + (result.paymentOptions.rushFee || 0) / 2)} × 2`);

  return result;
}

// ============================================================================
// EXAMPLE 6: Input Validation
// ============================================================================

export function example6_Validation() {
  console.log('\n=== Example 6: Input Validation ===\n');

  // Invalid input (missing required fields)
  const invalidInput = {
    purchasePrice: -100000, // Invalid: negative
    zipCode: '123', // Invalid: too short
    sqFtBuilding: 0, // Invalid: zero
    acresLand: 1.0,
    propertyType: 'InvalidType' as any, // Invalid type
    numberOfFloors: 2,
    multipleProperties: 1,
    purchaseDate: new Date(),
    taxYear: 2025,
    yearBuilt: 2010,
    capEx: 0,
    propertyOwnerName: '',
    propertyAddress: '',
    productType: 'RCGV' as const,
  };

  const validation = validateQuoteInput(invalidInput as QuoteInput);

  console.log('Validation Result:', validation.isValid ? '✅ Valid' : '❌ Invalid');
  console.log('\nErrors:');
  validation.errors.forEach((error) => {
    console.log(`  • ${error}`);
  });

  if (validation.warnings.length > 0) {
    console.log('\nWarnings:');
    validation.warnings.forEach((warning) => {
      console.log(`  ⚠ ${warning}`);
    });
  }

  return validation;
}

// ============================================================================
// EXAMPLE 7: Depreciation Schedule Comparison
// ============================================================================

export function example7_DepreciationComparison() {
  console.log('\n=== Example 7: Depreciation Schedule Comparison ===\n');

  const calculator = createQuoteCalculator(getDefaultCalculatorConfig());

  const input: QuoteInput = {
    purchasePrice: 2000000,
    zipCode: '30301',
    sqFtBuilding: 10000,
    acresLand: 1.0,
    propertyType: 'Office',
    numberOfFloors: 3,
    multipleProperties: 1,
    purchaseDate: new Date('2024-01-01'),
    taxYear: 2025,
    yearBuilt: 2012,
    capEx: 0,
    propertyOwnerName: 'Atlanta Commercial Group',
    propertyAddress: '456 Peachtree St, Atlanta, GA 30301',
    productType: 'RCGV',
  };

  const result = calculator.calculateQuote(input);

  console.log(`Property: ${input.propertyType} in ${input.zipCode}`);
  console.log(`Building Value: ${formatCurrency(result.property.buildingValue)}`);
  console.log(`Depreciation Method: ${result.property.depreciationMethod} years\n`);

  console.log('Year-by-Year Comparison:');
  console.log('Year | Cost Seg    | Standard    | Difference  | Cumulative');
  console.log('-----|-------------|-------------|-------------|-------------');

  result.depreciationSchedule.slice(0, 10).forEach((year) => {
    const diff = year.costSegEstimate - year.standardDepreciation;
    console.log(
      `${year.year.toString().padStart(4)} | ${formatCurrency(year.costSegEstimate).padStart(11)} | ${formatCurrency(year.standardDepreciation).padStart(11)} | ${formatCurrency(diff).padStart(11)} | ${formatCurrency(year.cumulativeSavings).padStart(11)}`
    );
  });

  console.log(`\nTotal Savings: ${formatCurrency(result.comparison.totalSavings.standardVsCostSeg)}`);
  console.log(`Break-Even Year: ${result.comparison.breakEvenYear}`);
  console.log(`Tax Benefit (35% rate): ${formatCurrency(result.taxBenefits.totalOverPeriod)}`);
  console.log(`ROI: ${(result.taxBenefits.totalOverPeriod / result.finalBid).toFixed(1)}x`);

  return result;
}

// ============================================================================
// EXAMPLE 8: Configuration Customization
// ============================================================================

export function example8_CustomConfiguration() {
  console.log('\n=== Example 8: Custom Configuration ===\n');

  // Create calculator with custom config
  const customConfig = getDefaultCalculatorConfig();
  customConfig.minimumQuote = 5000; // Set higher minimum
  customConfig.rushFeeAmount = 2500; // Higher rush fee
  customConfig.paymentMultipliers.upfront = 0.90; // 10% discount instead of 5%

  const calculator = new QuoteCalculator(customConfig);

  const input: QuoteInput = {
    purchasePrice: 1000000,
    zipCode: '80202',
    sqFtBuilding: 5000,
    acresLand: 0.5,
    propertyType: 'Medical',
    numberOfFloors: 2,
    multipleProperties: 1,
    purchaseDate: new Date('2024-04-01'),
    taxYear: 2025,
    yearBuilt: 2019,
    capEx: 0,
    propertyOwnerName: 'Denver Medical Center',
    propertyAddress: '789 Healthcare Way, Denver, CO 80202',
    productType: 'RCGV',
  };

  const result = calculator.calculateQuote(input);

  console.log('Custom Configuration Applied:');
  console.log(`  Minimum Quote: ${formatCurrency(customConfig.minimumQuote || 0)}`);
  console.log(`  Upfront Discount: ${formatPercentage(1 - customConfig.paymentMultipliers.upfront)}`);
  console.log(`  Rush Fee: ${formatCurrency(customConfig.rushFeeAmount || 0)}`);
  console.log(`\nFinal Bid: ${formatCurrency(result.finalBid)}`);
  console.log(`Upfront Payment (10% off): ${formatCurrency(result.paymentOptions.upfront)}`);

  return result;
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export function runAllExamples() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('QUOTE ENGINE EXAMPLES - Demonstration');
  console.log('='.repeat(70));

  try {
    example1_BasicMultiFamily();
    example2_CommercialOfficeNY();
    example3_MultipleProperties();
    example4_Warehouse();
    example5_RushOrder();
    example6_Validation();
    example7_DepreciationComparison();
    example8_CustomConfiguration();

    console.log('\n');
    console.log('='.repeat(70));
    console.log('All examples completed successfully! ✅');
    console.log('='.repeat(70));
    console.log('\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
