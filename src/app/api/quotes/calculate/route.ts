import { NextRequest } from 'next/server';
import { CalculateQuoteSchema } from '@/lib/validations/quote.schema';
import { quoteCalculator } from '@/lib/quote-engine/calculator';
import { successResponse, parseRequestBody, withErrorHandling } from '@/lib/api/response';

/**
 * POST /api/quotes/calculate
 *
 * Calculate a quote without saving it to the database.
 * This is useful for:
 * - Quote previews before submission
 * - ChatGPT integration (quick calculations)
 * - Public quote estimator tools
 * - A/B testing different property configurations
 *
 * @example
 * curl -X POST http://localhost:3000/api/quotes/calculate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "purchasePrice": 2550000,
 *     "zipCode": "85260",
 *     "sqFtBuilding": 1500,
 *     "acresLand": 0.78,
 *     "propertyType": "Multi-Family",
 *     "numberOfFloors": 2,
 *     "multipleProperties": 1,
 *     "dateOfPurchase": "2024-01-15",
 *     "taxYear": 2025,
 *     "yearBuilt": 2010,
 *     "capEx": 50000,
 *     "quoteType": "RCGV",
 *     "rushFee": false
 *   }'
 *
 * @body {Object} CalculateQuoteInput - Quote calculation parameters (no client info required)
 * @returns {Object} Calculated quote output with pricing and depreciation details
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Note: No authentication required for calculations
  // This allows public access for quote estimations

  // Parse and validate request body
  const result = await parseRequestBody(request, CalculateQuoteSchema);
  if (!result.success) {
    return result.error;
  }

  const input = result.data;

  try {
    // Calculate the quote using the QuoteCalculator
    const calculatedQuote = await quoteCalculator.calculate(input);

    // Return calculated results without saving
    return successResponse({
      ...calculatedQuote,
      note: 'This is a calculation preview. Use POST /api/quotes to save the quote.',
    });
  } catch (error) {
    console.error('Error calculating quote:', error);
    throw error;
  }
});

/**
 * Batch Calculation Endpoint (Optional Enhancement)
 *
 * POST /api/quotes/calculate/batch
 *
 * Calculate multiple quotes at once.
 * Useful for:
 * - Comparing different property configurations
 * - Bulk quote generation
 * - Sensitivity analysis (e.g., different purchase prices)
 *
 * @example
 * curl -X POST http://localhost:3000/api/quotes/calculate/batch \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "quotes": [
 *       {
 *         "purchasePrice": 2000000,
 *         "zipCode": "85260",
 *         "sqFtBuilding": 1500,
 *         "acresLand": 0.78,
 *         "propertyType": "Multi-Family",
 *         "numberOfFloors": 2,
 *         "multipleProperties": 1,
 *         "dateOfPurchase": "2024-01-15",
 *         "taxYear": 2025,
 *         "yearBuilt": 2010,
 *         "capEx": 50000,
 *         "quoteType": "RCGV",
 *         "rushFee": false
 *       },
 *       {
 *         "purchasePrice": 3000000,
 *         ... same fields with different values
 *       }
 *     ]
 *   }'
 *
 * Implementation:
 *
 * import { z } from 'zod';
 *
 * const BatchCalculateSchema = z.object({
 *   quotes: z.array(CalculateQuoteSchema).min(1).max(10),
 * });
 *
 * export const POST = withErrorHandling(async (request: NextRequest) => {
 *   const result = await parseRequestBody(request, BatchCalculateSchema);
 *   if (!result.success) return result.error;
 *
 *   const { quotes } = result.data;
 *
 *   // Calculate all quotes in parallel
 *   const calculations = await Promise.all(
 *     quotes.map((input, index) =>
 *       quoteCalculator.calculate(input).then((output) => ({ index, input, output }))
 *     )
 *   );
 *
 *   return successResponse({ calculations });
 * });
 */

/**
 * Comparison Endpoint (Optional Enhancement)
 *
 * POST /api/quotes/calculate/compare
 *
 * Compare RCGV vs Pro quotes side-by-side
 *
 * @example
 * curl -X POST http://localhost:3000/api/quotes/calculate/compare \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "purchasePrice": 2550000,
 *     "zipCode": "85260",
 *     "sqFtBuilding": 1500,
 *     "acresLand": 0.78,
 *     "propertyType": "Multi-Family",
 *     "numberOfFloors": 2,
 *     "multipleProperties": 1,
 *     "dateOfPurchase": "2024-01-15",
 *     "taxYear": 2025,
 *     "yearBuilt": 2010,
 *     "capEx": 50000,
 *     "rushFee": false
 *   }'
 *
 * Implementation:
 *
 * export const POST = withErrorHandling(async (request: NextRequest) => {
 *   const result = await parseRequestBody(request, CalculateQuoteSchema.omit({ quoteType: true }));
 *   if (!result.success) return result.error;
 *
 *   const input = result.data;
 *
 *   // Calculate both types
 *   const [rcgvQuote, proQuote] = await Promise.all([
 *     quoteCalculator.calculate({ ...input, quoteType: 'RCGV' }),
 *     quoteCalculator.calculate({ ...input, quoteType: 'Pro' }),
 *   ]);
 *
 *   return successResponse({
 *     rcgv: rcgvQuote,
 *     pro: proQuote,
 *     comparison: {
 *       priceDifference: proQuote.bidAmount - rcgvQuote.bidAmount,
 *       priceDifferencePercent:
 *         ((proQuote.bidAmount - rcgvQuote.bidAmount) / rcgvQuote.bidAmount) * 100,
 *       recommendation: proQuote.bidAmount / rcgvQuote.bidAmount > 1.3 ? 'RCGV' : 'Pro',
 *     },
 *   });
 * });
 */
