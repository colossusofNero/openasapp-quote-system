import { NextRequest } from 'next/server';
import { QuoteInputSchema, QuoteListQuerySchema } from '@/lib/validations/quote.schema';
import { quoteCalculator } from '@/lib/quote-engine/calculator';
import {
  successResponse,
  ErrorResponses,
  parseRequestBody,
  parseQueryParams,
  withErrorHandling,
} from '@/lib/api/response';

/**
 * POST /api/quotes
 *
 * Create a new quote and save it to the database
 *
 * @example
 * curl -X POST http://localhost:3000/api/quotes \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
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
 *     "propertyOwnerName": "Acme Properties LLC",
 *     "propertyAddress": "123 Main St, Scottsdale, AZ 85260",
 *     "quoteType": "RCGV",
 *     "rushFee": false
 *   }'
 *
 * @returns {Object} Created quote with calculated values
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // TODO: Implement authentication check
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return ErrorResponses.unauthorized();
  // }

  // Parse and validate request body
  const result = await parseRequestBody(request, QuoteInputSchema);
  if (!result.success) {
    return result.error;
  }

  const input = result.data;

  try {
    // Map schema fields to calculator fields
    const calculatorInput = {
      ...input,
      purchaseDate: new Date(input.dateOfPurchase),
      productType: input.quoteType,
      isRushOrder: input.rushFee,
    };

    // Calculate the quote using the QuoteCalculator
    const calculatedQuote = await quoteCalculator.calculate(calculatorInput as any);

    // TODO: Save to database using Prisma
    // const savedQuote = await prisma.quote.create({
    //   data: {
    //     userId: session.user.id,
    //     status: 'draft',
    //     input: input as any,
    //     output: calculatedQuote as any,
    //   },
    // });

    // Mock saved quote for now
    const savedQuote = {
      id: crypto.randomUUID(),
      input,
      output: calculatedQuote,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'mock-user-id',
    };

    return successResponse(savedQuote, 201);
  } catch (error) {
    console.error('Error creating quote:', error);
    throw error;
  }
});

/**
 * GET /api/quotes
 *
 * List all quotes with pagination and filtering
 *
 * @example
 * curl http://localhost:3000/api/quotes?page=1&limit=20&status=draft&sortBy=createdAt&sortOrder=desc \
 *   -H "Authorization: Bearer YOUR_TOKEN"
 *
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} status - Filter by status (draft, sent, accepted, rejected, expired)
 * @query {string} quoteType - Filter by quote type (RCGV, Pro)
 * @query {string} sortBy - Sort field (createdAt, updatedAt, bidAmount)
 * @query {string} sortOrder - Sort order (asc, desc)
 * @query {string} search - Search by client name or property address
 *
 * @returns {Object} Paginated list of quotes
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // TODO: Implement authentication check
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return ErrorResponses.unauthorized();
  // }

  // Parse and validate query parameters
  const { searchParams } = new URL(request.url);
  const result = parseQueryParams(searchParams, QuoteListQuerySchema);
  if (!result.success) {
    return result.error;
  }

  const { page, limit, status, quoteType, sortBy, sortOrder, search } = result.data;

  try {
    // TODO: Fetch from database using Prisma
    // const quotes = await prisma.quote.findMany({
    //   where: {
    //     userId: session.user.id,
    //     ...(status && { status }),
    //     ...(quoteType && { 'output.quoteType': quoteType }),
    //     ...(search && {
    //       OR: [
    //         { 'input.propertyOwnerName': { contains: search, mode: 'insensitive' } },
    //         { 'input.propertyAddress': { contains: search, mode: 'insensitive' } },
    //       ],
    //     }),
    //   },
    //   orderBy: { [sortBy]: sortOrder },
    //   skip: (page - 1) * limit,
    //   take: limit,
    // });
    //
    // const total = await prisma.quote.count({
    //   where: { userId: session.user.id, ...(status && { status }) },
    // });

    // Mock data for now
    const mockQuotes = [
      {
        id: crypto.randomUUID(),
        input: {
          purchasePrice: 2550000,
          zipCode: '85260',
          sqFtBuilding: 1500,
          acresLand: 0.78,
          propertyType: 'Multi-Family',
          numberOfFloors: 2,
          multipleProperties: 1,
          dateOfPurchase: '2024-01-15',
          taxYear: 2025,
          yearBuilt: 2010,
          capEx: 50000,
          propertyOwnerName: 'Acme Properties LLC',
          propertyAddress: '123 Main St, Scottsdale, AZ 85260',
          quoteType: 'RCGV' as const,
          rushFee: false,
        },
        output: {
          bidAmount: 38250,
          landValue: 78000,
          buildingValue: 2522000,
          paymentOptions: {
            upfront: { amount: 36337.5, discount: 5 },
            fiftyFifty: {
              firstPayment: 21037.5,
              secondPayment: 21037.5,
              total: 42075,
            },
            monthly: { monthlyAmount: 3825, numberOfMonths: 12, total: 45900 },
          },
          appliedFactors: {
            costBasisFactor: 1.3,
            zipCodeFactor: 1.11,
            sqFtFactor: 1.0,
            acresFactor: 0.75,
            propertyTypeFactor: 0.4,
            floorsFactor: 1.0,
          },
          depreciationSummary: {
            method: '27.5-year' as const,
            year1: 504400,
            year2: 807040,
            year3: 484224,
            year4: 290534.4,
            year5: 290534.4,
            year6: 145267.2,
            totalTax: 755280,
          },
          quoteType: 'RCGV' as const,
          calculatedAt: new Date().toISOString(),
        },
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'mock-user-id',
      },
    ];

    const total = mockQuotes.length;

    return successResponse({
      quotes: mockQuotes.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
});

/**
 * Authentication Integration Points
 *
 * To integrate NextAuth.js:
 *
 * 1. Install dependencies:
 *    npm install next-auth @auth/prisma-adapter
 *
 * 2. Create auth config: src/lib/auth/config.ts
 *    export const authOptions = { ... }
 *
 * 3. Uncomment authentication checks in this file
 *
 * 4. Import:
 *    import { getServerSession } from "next-auth";
 *    import { authOptions } from "@/lib/auth/config";
 *
 * 5. Check session:
 *    const session = await getServerSession(authOptions);
 *    if (!session) return ErrorResponses.unauthorized();
 *
 * 6. Use user ID:
 *    userId: session.user.id
 */
