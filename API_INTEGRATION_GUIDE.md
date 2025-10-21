# API Integration Guide - Adding Prisma Database Queries

## Overview
This guide shows how to integrate Prisma database queries into the existing API routes. All routes already have TODO comments marking integration points.

## Step-by-Step Integration Pattern

### 1. Add Required Imports

At the top of each API route file, add:

```typescript
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db/prisma';
import { Decimal } from 'decimal.js';
```

### 2. Replace Mock Data with Prisma Queries

## Example 1: POST /api/quotes (Create Quote)

**Current Code (Mock):**
```typescript
export const POST = withErrorHandling(async (request: NextRequest) => {
  // TODO: Implement authentication check
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return ErrorResponses.unauthorized();
  // }

  const result = await parseRequestBody(request, QuoteInputSchema);
  if (!result.success) {
    return result.error;
  }

  const calculatedQuote = await quoteCalculator.calculate(result.data);

  // TODO: Save to database
  const savedQuote = {
    id: crypto.randomUUID(),
    // ... mock data
  };

  return successResponse(savedQuote, 201);
});
```

**Updated Code (With Prisma):**
```typescript
export const POST = withErrorHandling(async (request: NextRequest) => {
  // ✅ Add authentication
  const session = await requireAuth();

  const result = await parseRequestBody(request, QuoteInputSchema);
  if (!result.success) {
    return result.error;
  }

  const input = result.data;
  const calculatedQuote = await quoteCalculator.calculate(input);

  // ✅ Save to database with Prisma
  const savedQuote = await prisma.quote.create({
    data: {
      userId: session.user.id,
      productType: input.quoteType || 'RCGV',
      status: 'draft',

      // Input fields
      purchasePrice: new Decimal(input.purchasePrice),
      zipCode: input.zipCode,
      sqFtBuilding: input.sqFtBuilding || null,
      acresLand: input.acresLand ? new Decimal(input.acresLand) : null,
      propertyType: input.propertyType,
      numberOfFloors: input.numberOfFloors || null,
      multipleProperties: input.multipleProperties || 1,
      dateOfPurchase: input.dateOfPurchase ? new Date(input.dateOfPurchase) : null,
      taxYear: input.taxYear,
      yearBuilt: input.yearBuilt || null,
      capEx: input.capEx ? new Decimal(input.capEx) : new Decimal(0),
      accumulated1031Depreciation: new Decimal(0),
      propertyOwnerName: input.propertyOwnerName || null,
      propertyAddress: input.propertyAddress || null,

      // Calculated factors
      costBasisFactor: calculatedQuote.appliedFactors.costBasisFactor
        ? new Decimal(calculatedQuote.appliedFactors.costBasisFactor)
        : null,
      zipCodeFactor: calculatedQuote.appliedFactors.zipCodeFactor
        ? new Decimal(calculatedQuote.appliedFactors.zipCodeFactor)
        : null,
      sqFtFactor: calculatedQuote.appliedFactors.sqFtFactor
        ? new Decimal(calculatedQuote.appliedFactors.sqFtFactor)
        : null,
      acresFactor: calculatedQuote.appliedFactors.acresFactor
        ? new Decimal(calculatedQuote.appliedFactors.acresFactor)
        : null,
      propertyTypeFactor: calculatedQuote.appliedFactors.propertyTypeFactor
        ? new Decimal(calculatedQuote.appliedFactors.propertyTypeFactor)
        : null,
      floorsFactor: calculatedQuote.appliedFactors.floorsFactor
        ? new Decimal(calculatedQuote.appliedFactors.floorsFactor)
        : null,
      multiplePropertiesFactor: calculatedQuote.appliedFactors.multiplePropertiesFactor
        ? new Decimal(calculatedQuote.appliedFactors.multiplePropertiesFactor)
        : null,

      // Output fields
      bidAmountOriginal: new Decimal(calculatedQuote.bidAmount),
      landValue: calculatedQuote.landValue
        ? new Decimal(calculatedQuote.landValue)
        : null,
      buildingValue: calculatedQuote.buildingValue
        ? new Decimal(calculatedQuote.buildingValue)
        : null,

      payUpfront: calculatedQuote.paymentOptions.upfront
        ? new Decimal(calculatedQuote.paymentOptions.upfront.amount)
        : null,
      pay5050: calculatedQuote.paymentOptions.fiftyFifty
        ? new Decimal(calculatedQuote.paymentOptions.fiftyFifty.total)
        : null,
      payOverTime: calculatedQuote.paymentOptions.monthly
        ? new Decimal(calculatedQuote.paymentOptions.monthly.total)
        : null,

      depreciationMethod: calculatedQuote.depreciationSummary.method,
      calculationVersion: '27.1',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return successResponse({
    id: savedQuote.id,
    input,
    output: calculatedQuote,
    status: savedQuote.status,
    createdAt: savedQuote.createdAt.toISOString(),
    updatedAt: savedQuote.updatedAt.toISOString(),
    userId: savedQuote.userId,
    user: savedQuote.user,
  }, 201);
});
```

## Example 2: GET /api/quotes (List Quotes)

**Current Code (Mock):**
```typescript
export const GET = withErrorHandling(async (request: NextRequest) => {
  // TODO: Implement authentication check

  const { searchParams } = new URL(request.url);
  const result = parseQueryParams(searchParams, QuoteListQuerySchema);

  const { page, limit, status, quoteType, sortBy, sortOrder, search } = result.data;

  // TODO: Fetch from database
  const mockQuotes = [/* ... */];
  const total = mockQuotes.length;

  return successResponse({
    quotes: mockQuotes,
    pagination: { /* ... */ },
  });
});
```

**Updated Code (With Prisma):**
```typescript
export const GET = withErrorHandling(async (request: NextRequest) => {
  // ✅ Add authentication
  const session = await requireAuth();

  const { searchParams } = new URL(request.url);
  const result = parseQueryParams(searchParams, QuoteListQuerySchema);
  if (!result.success) {
    return result.error;
  }

  const { page, limit, status, quoteType, sortBy, sortOrder, search } = result.data;

  // ✅ Build Prisma query
  const where: any = {
    userId: session.user.id,
  };

  if (status) {
    where.status = status;
  }

  if (quoteType) {
    where.productType = quoteType;
  }

  if (search) {
    where.OR = [
      { propertyOwnerName: { contains: search, mode: 'insensitive' } },
      { propertyAddress: { contains: search, mode: 'insensitive' } },
    ];
  }

  // ✅ Fetch from database
  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return successResponse({
    quotes: quotes.map(quote => ({
      id: quote.id,
      status: quote.status,
      productType: quote.productType,
      purchasePrice: quote.purchasePrice.toNumber(),
      propertyType: quote.propertyType,
      propertyOwnerName: quote.propertyOwnerName,
      propertyAddress: quote.propertyAddress,
      bidAmountOriginal: quote.bidAmountOriginal?.toNumber(),
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
      user: quote.user,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
});
```

## Example 3: GET /api/quotes/[id] (Get Single Quote)

**Updated Code (With Prisma):**
```typescript
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // ✅ Add authentication
    const session = await requireAuth();
    const { id } = params;

    // ✅ Fetch from database
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!quote) {
      return ErrorResponses.notFound('Quote');
    }

    // ✅ Check ownership
    if (quote.userId !== session.user.id) {
      return ErrorResponses.forbidden('You do not have access to this quote');
    }

    return successResponse({
      id: quote.id,
      status: quote.status,
      productType: quote.productType,
      // ... map all fields
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
      user: quote.user,
    });
  }
);
```

## Example 4: PATCH /api/quotes/[id] (Update Quote)

**Updated Code (With Prisma):**
```typescript
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireAuth();
    const { id } = params;

    const body = await request.json();

    // ✅ Check if quote exists and user owns it
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      return ErrorResponses.notFound('Quote');
    }

    if (existingQuote.userId !== session.user.id) {
      return ErrorResponses.forbidden('You do not have access to this quote');
    }

    // ✅ Update quote
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        status: body.status || existingQuote.status,
        notes: body.notes !== undefined ? body.notes : existingQuote.notes,
        // Add other updatable fields
      },
    });

    return successResponse({
      id: updatedQuote.id,
      status: updatedQuote.status,
      updatedAt: updatedQuote.updatedAt.toISOString(),
    });
  }
);
```

## Example 5: DELETE /api/quotes/[id] (Delete Quote)

**Updated Code (With Prisma):**
```typescript
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireAuth();
    const { id } = params;

    // ✅ Check if quote exists and user owns it
    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      return ErrorResponses.notFound('Quote');
    }

    if (quote.userId !== session.user.id) {
      return ErrorResponses.forbidden('You do not have access to this quote');
    }

    // ✅ Delete quote (cascades to line items)
    await prisma.quote.delete({
      where: { id },
    });

    return successResponse({
      message: 'Quote deleted successfully',
      id,
    });
  }
);
```

## Important Notes

### Decimal.js Handling
Prisma uses Decimal.js for Decimal fields. Always convert:
```typescript
// Writing to DB
purchasePrice: new Decimal(input.purchasePrice)

// Reading from DB
purchasePrice: quote.purchasePrice.toNumber()
```

### Date Handling
Convert strings to Date objects:
```typescript
// Writing to DB
dateOfPurchase: input.dateOfPurchase ? new Date(input.dateOfPurchase) : null

// Reading from DB
dateOfPurchase: quote.dateOfPurchase?.toISOString()
```

### NULL vs Undefined
Use null for optional database fields:
```typescript
sqFtBuilding: input.sqFtBuilding || null  // NOT undefined
```

### Error Handling
All API routes use `withErrorHandling()` wrapper which:
- Catches errors automatically
- Returns proper error responses
- Logs errors to console

### Authentication
Always use `requireAuth()` for protected routes:
```typescript
const session = await requireAuth();  // Throws if not authenticated
const userId = session.user.id;
```

### Ownership Checks
Always verify user owns the resource:
```typescript
if (quote.userId !== session.user.id) {
  return ErrorResponses.forbidden('You do not have access to this quote');
}
```

## Testing After Integration

### 1. Test with cURL
```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","name":"Test"}'

# Create quote (need session cookie from browser)
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{...quote data...}'
```

### 2. Test with Prisma Studio
```bash
npm run prisma:studio
# Browse to http://localhost:5555
# View created quotes in the database
```

### 3. Test with Browser
1. Sign in at `/api/auth/signin`
2. Use browser DevTools to make API calls
3. Check session cookie is included

## Files to Update

1. ✅ `src/app/api/quotes/route.ts` - POST and GET endpoints
2. ✅ `src/app/api/quotes/[id]/route.ts` - GET, PATCH, DELETE endpoints
3. ⚠️ `src/app/api/quotes/calculate/route.ts` - No changes needed (no auth)
4. ⚠️ `src/app/api/quotes/factors/route.ts` - No changes needed (no auth)

## Quick Checklist

- [ ] Import `requireAuth`, `prisma`, and `Decimal`
- [ ] Replace `// TODO` comments with actual code
- [ ] Add `await requireAuth()` for protected routes
- [ ] Replace mock data with `prisma.quote.create/findMany/findUnique/update/delete`
- [ ] Convert numbers to `Decimal` for database writes
- [ ] Convert `Decimal` to numbers for API responses
- [ ] Handle dates properly (Date objects for writes, ISO strings for reads)
- [ ] Add ownership checks for single-quote operations
- [ ] Test all endpoints after changes
- [ ] Check Prisma Studio to verify data is saved correctly

## Common Pitfalls

1. **Forgetting to convert Decimal**: Always use `new Decimal()` for writes and `.toNumber()` for reads
2. **Not checking ownership**: Always verify `quote.userId === session.user.id`
3. **Using undefined instead of null**: Database fields expect `null`, not `undefined`
4. **Forgetting to await**: All Prisma operations are async
5. **Not handling optional fields**: Check for null/undefined before accessing nested properties
6. **Session not available**: Make sure user is signed in and session cookie is sent

## Summary

The integration pattern is consistent across all endpoints:
1. Add imports
2. Add authentication
3. Replace mocks with Prisma queries
4. Handle Decimal and Date conversions
5. Check ownership for single-resource operations
6. Test thoroughly

All the hard work is done - just need to uncomment and adapt the existing TODO sections!
