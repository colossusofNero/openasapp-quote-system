import { NextRequest } from 'next/server';
import { quoteCalculator } from '@/lib/quote-engine/calculator';
import { successResponse, withErrorHandling } from '@/lib/api/response';

/**
 * GET /api/quotes/factors
 *
 * Retrieve all pricing factors and lookup tables used in quote calculations.
 * This endpoint provides transparency into how quotes are calculated and
 * can be used to build dynamic form interfaces.
 *
 * Use cases:
 * - Building smart quote forms with real-time validation
 * - Displaying pricing factors to users
 * - Documentation and transparency
 * - ChatGPT integration (providing context for calculations)
 * - Building quote estimation calculators
 *
 * @example
 * curl http://localhost:3000/api/quotes/factors
 *
 * @returns {Object} All lookup factors and pricing tables
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Note: No authentication required - factors are public information
  // This allows public access for transparency and education

  try {
    // Get all lookup factors from the calculator
    const factors = await quoteCalculator.getAllFactors();

    return successResponse({
      factors,
      metadata: {
        description: 'Pricing factors based on Excel workbook: Base Pricing27.1_Pro_SMART_RCGV.xlsx',
        version: '27.1',
        lastUpdated: '2025-10-20',
        source: 'VLOOKUP Tables sheet',
      },
      usage: {
        costBasisFactors: 'Applied based on purchase price',
        zipCodeFactors: 'Applied based on property zip code',
        sqFtFactors: 'Applied based on building square footage',
        acresFactors: 'Applied based on land acreage',
        propertyTypeFactors: 'Applied based on property type (note: Warehouse and Multi-Family have large discounts)',
        floorsFactors: 'Applied based on number of floors',
        multiplePropertiesFactors: 'Applied when quoting multiple properties (volume discount)',
      },
      examples: {
        costBasis: 'A $2.5M property gets a 1.3x factor',
        zipCode: 'ZIP code 85260 (Arizona) gets a 1.11x factor',
        propertyType: 'Multi-Family properties get a 0.4x factor (60% discount)',
        multipleProperties: '6+ properties get a 0.7x factor (30% discount)',
      },
    });
  } catch (error) {
    console.error('Error fetching factors:', error);
    throw error;
  }
});

/**
 * Property Type Information Endpoint (Optional Enhancement)
 *
 * GET /api/quotes/factors/property-types
 *
 * Get detailed information about each property type
 *
 * @example
 * curl http://localhost:3000/api/quotes/factors/property-types
 *
 * @returns {Object} Detailed property type information
 */

/**
 * Example Implementation:
 *
 * export const GET = withErrorHandling(async (request: NextRequest) => {
 *   const propertyTypes = [
 *     {
 *       type: 'Multi-Family',
 *       factor: 0.4,
 *       discount: '60%',
 *       description: 'Apartment buildings, duplexes, and multi-unit residential properties',
 *       depreciationMethod: '27.5-year',
 *       typicalComponents: [
 *         'Central HVAC systems',
 *         'Common area improvements',
 *         'Landscaping and parking',
 *         'Appliances and fixtures',
 *       ],
 *       averageSavings: '$150,000 - $500,000 over 6 years',
 *     },
 *     {
 *       type: 'Warehouse',
 *       factor: 0.4,
 *       discount: '60%',
 *       description: 'Industrial warehouses and distribution centers',
 *       depreciationMethod: '39-year',
 *       typicalComponents: [
 *         'Loading docks and doors',
 *         'Warehouse racking systems',
 *         'Electrical systems',
 *         'HVAC and ventilation',
 *       ],
 *       averageSavings: '$100,000 - $400,000 over 6 years',
 *     },
 *     {
 *       type: 'Retail',
 *       factor: 0.85,
 *       discount: '15%',
 *       description: 'Retail stores, shopping centers, and commercial spaces',
 *       depreciationMethod: '39-year',
 *       typicalComponents: [
 *         'Interior finishes',
 *         'Lighting and electrical',
 *         'HVAC systems',
 *         'Parking lot improvements',
 *       ],
 *       averageSavings: '$80,000 - $300,000 over 6 years',
 *     },
 *     // ... more property types
 *   ];
 *
 *   return successResponse({ propertyTypes });
 * });
 */

/**
 * Factor Calculation Simulator (Optional Enhancement)
 *
 * POST /api/quotes/factors/simulate
 *
 * Simulate how factors combine for a given property
 * without running a full quote calculation
 *
 * @example
 * curl -X POST http://localhost:3000/api/quotes/factors/simulate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "purchasePrice": 2550000,
 *     "zipCode": "85260",
 *     "sqFtBuilding": 1500,
 *     "acresLand": 0.78,
 *     "propertyType": "Multi-Family",
 *     "numberOfFloors": 2,
 *     "multipleProperties": 1
 *   }'
 *
 * @returns {Object} Individual factors and their combined effect
 */

/**
 * Example Implementation:
 *
 * import { z } from 'zod';
 *
 * const SimulateFactorsSchema = z.object({
 *   purchasePrice: z.number().positive(),
 *   zipCode: z.string().regex(/^\d{5}$/),
 *   sqFtBuilding: z.number().positive(),
 *   acresLand: z.number().nonnegative(),
 *   propertyType: PropertyTypeEnum,
 *   numberOfFloors: z.number().int().positive(),
 *   multipleProperties: z.number().int().positive(),
 * });
 *
 * export const POST = withErrorHandling(async (request: NextRequest) => {
 *   const result = await parseRequestBody(request, SimulateFactorsSchema);
 *   if (!result.success) return result.error;
 *
 *   const input = result.data;
 *
 *   // Get individual factors
 *   const costBasisFactor = getCostBasisFactor(input.purchasePrice);
 *   const zipCodeFactor = getZipCodeFactor(input.zipCode);
 *   const sqFtFactor = getSqFtFactor(input.sqFtBuilding);
 *   const acresFactor = getAcresFactor(input.acresLand);
 *   const propertyTypeFactor = getPropertyTypeFactor(input.propertyType);
 *   const floorsFactor = getFloorsFactor(input.numberOfFloors);
 *   const multiplePropertiesFactor =
 *     input.multipleProperties > 1 ? getMultiplePropertiesFactor(input.multipleProperties) : 1.0;
 *
 *   // Calculate combined factor
 *   const combinedFactor =
 *     costBasisFactor *
 *     zipCodeFactor *
 *     sqFtFactor *
 *     acresFactor *
 *     propertyTypeFactor *
 *     floorsFactor *
 *     multiplePropertiesFactor;
 *
 *   // Calculate base bid (1.5% of purchase price)
 *   const baseBid = input.purchasePrice * 0.015;
 *
 *   // Calculate adjusted bid
 *   const adjustedBid = baseBid * combinedFactor;
 *
 *   return successResponse({
 *     factors: {
 *       costBasisFactor: { value: costBasisFactor, explanation: `Purchase price ${input.purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` },
 *       zipCodeFactor: { value: zipCodeFactor, explanation: `ZIP code ${input.zipCode}` },
 *       sqFtFactor: { value: sqFtFactor, explanation: `${input.sqFtBuilding.toLocaleString()} sqft` },
 *       acresFactor: { value: acresFactor, explanation: `${input.acresLand} acres` },
 *       propertyTypeFactor: { value: propertyTypeFactor, explanation: input.propertyType },
 *       floorsFactor: { value: floorsFactor, explanation: `${input.numberOfFloors} floors` },
 *       multiplePropertiesFactor: { value: multiplePropertiesFactor, explanation: `${input.multipleProperties} properties` },
 *       combinedFactor: { value: combinedFactor, explanation: 'Product of all factors' },
 *     },
 *     calculation: {
 *       baseBid: { amount: baseBid, percentage: 1.5 },
 *       adjustedBid: { amount: adjustedBid, explanation: `Base bid × ${combinedFactor.toFixed(4)}` },
 *       difference: { amount: adjustedBid - baseBid, percentage: ((adjustedBid - baseBid) / baseBid) * 100 },
 *     },
 *   });
 * });
 */
