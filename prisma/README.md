# Prisma Database Schema
## Quote System - Developer Guide

---

## Quick Start

### 1. Install Dependencies
```bash
npm install prisma @prisma/client --save-dev
```

### 2. Setup Environment
Create `.env` file in project root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/quote_system"
```

### 3. Run Migration
```bash
npx prisma migrate dev --name init_quote_system
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Seed Database
```bash
npx prisma db seed
```

### 6. View Database
```bash
npx prisma studio
```

---

## File Structure

```
prisma/
├── schema.prisma           # Main schema definition
├── MIGRATION_PLAN.md       # Detailed migration guide
├── SCHEMA_DIAGRAM.md       # Visual ER diagrams
├── README.md               # This file
└── migrations/             # Generated migration files
    └── <timestamp>_init_quote_system/
        └── migration.sql
```

---

## Schema Overview

### 13 Models Total

#### Core Models (2)
- **User** - Authentication and authorization
- **Quote** - Main quote record with all input/output fields

#### Line Items (1)
- **QuoteLineItem** - Year-by-year depreciation data

#### Lookup Tables (7)
- **PropertyTypeFactor** - Property type pricing
- **CostBasisFactor** - Purchase price range multipliers
- **ZipCodeFactor** - Location-based pricing
- **SqFtFactor** - Building size multipliers
- **AcresFactor** - Land size multipliers
- **FloorsFactor** - Building height adjustments
- **MultiplePropertiesFactor** - Bulk order discounts

#### Configuration & Audit (3)
- **DepreciationRate** - MACRS depreciation schedules
- **CalculationHistory** - Audit trail for calculations
- **SystemConfig** - App-wide settings

---

## Key Features

### Product Types
- **RCGV** - Full cost segregation analysis
- **Pro** - Professional-tier analysis
- **SMART** - Deprecated (not implemented)

### Quote Workflow
1. **Draft** - Initial quote creation
2. **Finalized** - Quote calculation completed
3. **Sent** - Quote sent to customer
4. **Accepted** - Customer accepted quote
5. **Completed** - Service delivered

### Payment Options
- **Pay Upfront** - Base price × 0.95 (5% discount)
- **Pay 50/50** - Base price × 1.1 ÷ 2 (10% markup, split)
- **Pay Over Time** - Base price × 1.2 (20% markup)

---

## Common Usage Examples

### Create a Quote
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const quote = await prisma.quote.create({
  data: {
    userId: "user-123",
    productType: "RCGV",
    status: "draft",
    purchasePrice: 2550000,
    zipCode: "85260",
    sqFtBuilding: 1500,
    acresLand: 0.78,
    propertyType: "Multi-Family",
    numberOfFloors: 3,
    multipleProperties: 1,
    taxYear: 2025,
    yearBuilt: 2018,
    capEx: 50000,
    propertyOwnerName: "John Doe",
    propertyAddress: "123 Main St, Phoenix, AZ",
  },
  include: {
    lineItems: true,
    user: true,
  },
});
```

### Get Quote with Line Items
```typescript
const quote = await prisma.quote.findUnique({
  where: { id: "quote-123" },
  include: {
    lineItems: {
      orderBy: { year: 'asc' },
    },
    user: true,
  },
});
```

### Lookup Pricing Factor
```typescript
// Property type
const propertyFactor = await prisma.propertyTypeFactor.findUnique({
  where: { propertyType: "Multi-Family" },
});
// Returns: { factor: 0.4, ... }

// Cost basis (range query)
const costFactor = await prisma.costBasisFactor.findFirst({
  where: {
    minAmount: { lte: 2550000 },
    OR: [
      { maxAmount: { gte: 2550000 } },
      { maxAmount: null },
    ],
  },
});
// Returns: { minAmount: 2000000, maxAmount: 10000000, factor: 1.3, ... }
```

### Add Line Items to Quote
```typescript
const lineItems = await prisma.quoteLineItem.createMany({
  data: [
    {
      quoteId: "quote-123",
      year: 1,
      costSegEstimate: 510000,
      standardDepreciation: 92727,
      traditionalCostSeg: 255000,
      bonusDepreciation: 450000,
    },
    {
      quoteId: "quote-123",
      year: 2,
      costSegEstimate: 163200,
      standardDepreciation: 92727,
      traditionalCostSeg: 81600,
      bonusDepreciation: 0,
    },
    // ... more years
  ],
});
```

### Record Calculation History
```typescript
await prisma.calculationHistory.create({
  data: {
    quoteId: quote.id,
    userId: "user-123",
    calculationType: "create",
    inputData: {
      purchasePrice: 2550000,
      zipCode: "85260",
      sqFtBuilding: 1500,
      propertyType: "Multi-Family",
      // ... all input fields
    },
    outputData: {
      costSegBid: 12500,
      natLogQuote: 13000,
      finalBidBase: 12500,
      payUpfront: 11875,
      pay5050: 6875,
      payOverTime: 15000,
      // ... all calculated fields
    },
    factorsApplied: {
      propertyTypeFactor: 0.4,
      costBasisFactor: 1.3,
      zipCodeFactor: 1.05,
      sqFtFactor: 1.1,
      acresFactor: 1.0,
      floorsFactor: 1.05,
      multiplePropertiesFactor: 1.0,
    },
    version: "1.0.0",
    executionTimeMs: 125,
  },
});
```

### Query User's Quotes
```typescript
const userQuotes = await prisma.quote.findMany({
  where: {
    userId: "user-123",
    status: { in: ["finalized", "sent", "accepted"] },
    taxYear: 2025,
  },
  include: {
    lineItems: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### Get System Config
```typescript
const config = await prisma.systemConfig.findUnique({
  where: { key: "upfront_discount_rate" },
});
// Returns: { value: 0.95, dataType: "number", ... }
```

---

## Data Validation

### Property Types (Exact Match Required)
```typescript
const validPropertyTypes = [
  "Industrial",
  "Medical",
  "Office",
  "Other",
  "Restaurant",
  "Retail",
  "Warehouse",
  "Multi-Family",
  "Residential/LTR",
  "Short-Term Rental",
];
```

### Numeric Ranges
```typescript
const validations = {
  purchasePrice: { min: 0, max: Infinity },
  zipCode: { pattern: /^\d{5}$/ }, // 5-digit US zip
  sqFtBuilding: { min: 0, max: Infinity },
  acresLand: { min: 0, max: Infinity },
  numberOfFloors: { min: 1, max: 100 },
  multipleProperties: { min: 1, max: Infinity },
  taxYear: { min: 1900, max: 2100 },
  yearBuilt: { min: 1800, max: new Date().getFullYear() },
  capEx: { min: 0, max: Infinity },
};
```

---

## Performance Tips

### 1. Use Indexes
All key fields are indexed. Ensure queries use these fields:
```typescript
// GOOD - Uses index on userId
await prisma.quote.findMany({ where: { userId: "user-123" } });

// GOOD - Uses index on status
await prisma.quote.findMany({ where: { status: "finalized" } });

// AVOID - Full table scan
await prisma.quote.findMany({ where: { propertyOwnerName: "John" } });
```

### 2. Include Only What You Need
```typescript
// GOOD - Only includes necessary relations
await prisma.quote.findUnique({
  where: { id: "quote-123" },
  select: {
    id: true,
    purchasePrice: true,
    finalBidBase: true,
    user: { select: { email: true } },
  },
});

// AVOID - Loads everything
await prisma.quote.findUnique({
  where: { id: "quote-123" },
  include: { lineItems: true, user: true },
});
```

### 3. Batch Operations
```typescript
// GOOD - Single query
await prisma.quoteLineItem.createMany({
  data: lineItems,
});

// AVOID - Multiple queries
for (const item of lineItems) {
  await prisma.quoteLineItem.create({ data: item });
}
```

### 4. Use Transactions for Related Operations
```typescript
await prisma.$transaction(async (tx) => {
  const quote = await tx.quote.create({ data: quoteData });

  await tx.quoteLineItem.createMany({
    data: lineItems.map(item => ({ ...item, quoteId: quote.id })),
  });

  await tx.calculationHistory.create({
    data: { quoteId: quote.id, ...historyData },
  });
});
```

---

## Troubleshooting

### Migration Issues
```bash
# View migration status
npx prisma migrate status

# Reset database (WARNING: destroys data)
npx prisma migrate reset

# Rollback specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

### Connection Issues
```bash
# Test connection
npx prisma db push

# View database in GUI
npx prisma studio
```

### Schema Changes
```bash
# After modifying schema.prisma
npx prisma migrate dev --name <descriptive-name>

# Regenerate client
npx prisma generate
```

---

## Testing

### Sample Test
```typescript
import { PrismaClient } from '@prisma/client';

describe('Quote CRUD', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a quote', async () => {
    const quote = await prisma.quote.create({
      data: {
        userId: 'test-user',
        productType: 'RCGV',
        purchasePrice: 2550000,
        zipCode: '85260',
        propertyType: 'Multi-Family',
        taxYear: 2025,
      },
    });

    expect(quote.id).toBeDefined();
    expect(quote.purchasePrice).toBe(2550000);
  });

  it('should lookup property type factor', async () => {
    const factor = await prisma.propertyTypeFactor.findUnique({
      where: { propertyType: 'Multi-Family' },
    });

    expect(factor?.factor).toBe(0.4);
  });
});
```

---

## Related Documentation

- **MIGRATION_PLAN.md** - Detailed migration steps and seeding
- **SCHEMA_DIAGRAM.md** - Visual ER diagrams and data flow
- **EXCEL_STRUCTURE_ANALYSIS.md** - Source Excel workbook analysis
- **Prisma Docs** - https://www.prisma.io/docs

---

## Next Steps for Level 2/3 Agents

### Level 2 Backend Agent
1. Implement quote calculation engine using this schema
2. Create REST/GraphQL API endpoints
3. Add validation middleware
4. Implement payment option calculations

### Level 3 Data Extraction Agent
1. Extract complete VLOOKUP table data from Excel
2. Generate comprehensive seed files
3. Populate all lookup tables

### Level 3 Testing Agent
1. Write integration tests for all models
2. Test quote calculation accuracy
3. Verify data integrity

---

**Schema Version:** 1.0.0
**Created:** 2025-10-20
**Status:** Ready for implementation
**Supported Products:** RCGV, Pro
