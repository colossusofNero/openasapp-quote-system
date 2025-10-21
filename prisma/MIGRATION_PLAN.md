# Prisma Migration Plan
## Quote System Database Schema

---

## Overview
This document outlines the migration plan for the Quote System database based on the Excel workbook structure (`Base Pricing27.1_Pro_SMART_RCGV.xlsx`).

---

## Prerequisites

1. **Install Prisma** (if not already installed):
   ```bash
   npm install prisma @prisma/client --save-dev
   ```

2. **Set up database connection**:
   - Create `.env` file in project root
   - Add `DATABASE_URL` environment variable

   Example for PostgreSQL:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/quote_system?schema=public"
   ```

   Example for MySQL:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/quote_system"
   ```

   Example for SQLite (development):
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Update `schema.prisma`** datasource provider if needed:
   - PostgreSQL: `provider = "postgresql"`
   - MySQL: `provider = "mysql"`
   - SQLite: `provider = "sqlite"`

---

## Migration Steps

### Step 1: Initialize Prisma (if first time)
```bash
npx prisma init
```

### Step 2: Review Schema
Review `prisma/schema.prisma` to ensure all models match your requirements.

### Step 3: Create Initial Migration
```bash
npx prisma migrate dev --name init_quote_system
```

This will:
- Create migration files in `prisma/migrations/`
- Apply the migration to your database
- Generate Prisma Client

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Verify Migration
```bash
npx prisma studio
```
This opens a GUI to inspect your database schema.

---

## Database Models Created

### Core Models (2)
1. **User** - Authentication and user management
2. **Quote** - Main quote record with all input/output fields

### Line Item Models (1)
3. **QuoteLineItem** - Year-by-year depreciation data

### Lookup Tables (7)
4. **PropertyTypeFactor** - Property type pricing adjustments
5. **CostBasisFactor** - Purchase price range multipliers
6. **ZipCodeFactor** - Location-based pricing
7. **SqFtFactor** - Building size multipliers
8. **AcresFactor** - Land size multipliers
9. **FloorsFactor** - Building height adjustments
10. **MultiplePropertiesFactor** - Bulk order discounts

### Configuration & Audit (3)
11. **DepreciationRate** - MACRS and depreciation schedules
12. **CalculationHistory** - Audit trail for quote calculations
13. **SystemConfig** - App-wide configuration storage

**Total: 13 Models**

---

## Key Relationships

```
User
  └─> Quote (1:many)
       └─> QuoteLineItem (1:many)

CalculationHistory -> Quote (soft reference, no FK)

Lookup Tables (PropertyTypeFactor, CostBasisFactor, etc.)
  - Standalone reference tables
  - No direct foreign key relationships to Quote
  - Queried during quote calculation
```

---

## Field Mappings

### Quote Model Input Fields (from Excel "Input Sheet")
| Prisma Field | Excel Cell | Description |
|--------------|------------|-------------|
| `purchasePrice` | B3 | Purchase price |
| `zipCode` | D3 | Property zip code |
| `sqFtBuilding` | F3 | Building square footage |
| `acresLand` | H3 | Land size in acres |
| `propertyType` | J3 | Type of property |
| `numberOfFloors` | L3 | Number of floors |
| `multipleProperties` | N3 | Count of properties |
| `dateOfPurchase` | P3 | Purchase date |
| `taxYear` | R3 | Tax year |
| `yearBuilt` | P7 | Year built |
| `capEx` | AA3 | Capital improvements |
| `propertyOwnerName` | B25 | Owner name |
| `propertyAddress` | B28 | Property address |

### Quote Model Output Fields (Calculated)
| Prisma Field | Excel Source | Description |
|--------------|--------------|-------------|
| `costSegBid` | B9 | Cost seg bid from Equation Sheet |
| `natLogQuote` | B14 | Natural log quote |
| `finalBidBase` | B15 | Final calculated bid |
| `landValue` | Calculated | Derived from purchase price |
| `buildingValue` | Calculated | Purchase - Land - 1031 + CapEx |
| `payUpfront` | Calculated | Base × 0.95 |
| `pay5050` | Calculated | Base × 1.1 ÷ 2 |
| `payOverTime` | Calculated | Base × 1.2 |

### QuoteLineItem (from "YbyY data" sheet)
| Prisma Field | Excel Column | Description |
|--------------|--------------|-------------|
| `year` | Row number | Year 1, 2, 3, etc. |
| `method1Depreciation` | D-H | First depreciation method |
| `method2Depreciation` | I-M | Second method |
| `straightLineDepreciation` | N-R | Straight line |
| `method3Depreciation` | S+ | Third method |
| `costSegEstimate` | F (Printable) | Cost seg estimate |
| `standardDepreciation` | G (Printable) | Standard depreciation |

---

## Data Seeding Plan

After migration, you'll need to seed the lookup tables with data from Excel:

### 1. PropertyTypeFactor
```typescript
// From Excel VLOOKUP Tables, Column M-N
const propertyTypes = [
  { type: "Industrial", factor: 1.01 },
  { type: "Medical", factor: 1.01 },
  { type: "Office", factor: 1.0 },
  { type: "Other", factor: 1.0 },
  { type: "Restaurant", factor: 1.01 },
  { type: "Retail", factor: 0.85 },
  { type: "Warehouse", factor: 0.4 },
  { type: "Multi-Family", factor: 0.4 },
  { type: "Residential/LTR", factor: 0.7 },
  { type: "Short-Term Rental", factor: 0.7 },
];
```

### 2. CostBasisFactor
```typescript
// From Excel VLOOKUP Tables, Column A-B
const costBasisRanges = [
  { min: 0, max: 250000, factor: 1.0 },
  { min: 250000, max: 1000000, factor: 1.01 },
  { min: 1000000, max: 2000000, factor: 1.075 },
  { min: 2000000, max: 10000000, factor: 1.3 },
  { min: 10000000, max: null, factor: 1.5 },
];
```

### 3. ZipCodeFactor
```typescript
// From Excel VLOOKUP Tables, Column D-E
const zipRanges = [
  { min: "0", max: "10000", factor: 1.0 },
  { min: "10000", max: "20000", factor: 1.02 },
  // ... (extract from Excel)
];
```

### 4. SqFtFactor
```typescript
// From Excel VLOOKUP Tables, Column G-H
const sqftRanges = [
  { min: 0, max: 5000, factor: 1.0 },
  { min: 5000, max: 10000, factor: 1.05 },
  { min: 10000, max: 20000, factor: 1.1 },
  { min: 20000, max: 55000, factor: 1.15 },
  { min: 55000, max: null, factor: 1.22 },
];
```

### 5. AcresFactor
```typescript
// From Excel VLOOKUP Tables, Column J-K
const acresRanges = [
  { min: 0, max: 1, factor: 0.75 },
  { min: 1, max: 3, factor: 1.0 },
  { min: 3, max: 5, factor: 1.1 },
  { min: 5, max: 9, factor: 1.2 },
  { min: 9, max: null, factor: 1.3 },
];
```

### 6. FloorsFactor
```typescript
// From Excel VLOOKUP Tables, Column P-Q
const floorsFactors = [
  { floors: 1, factor: 1.0 },
  { floors: 2, factor: 1.0 },
  { floors: 3, factor: 1.05 },
  { floors: 4, factor: 1.08 },
  { floors: 5, factor: 1.1 },
  { floors: 6, factor: 1.15 },
  { floors: 7, factor: 1.2 },
  { floors: 8, factor: 1.25 },
  { floors: 9, factor: 1.3 },
  { floors: 10, factor: 1.35 },
  { floors: 12, factor: 1.4 },
];
```

### 7. MultiplePropertiesFactor
```typescript
// From Excel VLOOKUP Tables, Column S
const multiplePropsFactors = [
  { count: 1, factor: 1.0 },
  { count: 2, factor: 0.95 },
  { count: 3, factor: 0.9 },
  { count: 4, factor: 0.85 },
  { count: 5, factor: 0.8 },
  { count: 6, factor: 0.75 },
];
```

### 8. DepreciationRate
```typescript
// MACRS depreciation rates for 5-year property
const macrsRates = [
  { year: 1, rate: 0.20, method: "MACRS", period: "5-year" },
  { year: 2, rate: 0.32, method: "MACRS", period: "5-year" },
  { year: 3, rate: 0.192, method: "MACRS", period: "5-year" },
  { year: 4, rate: 0.1152, method: "MACRS", period: "5-year" },
  { year: 5, rate: 0.1152, method: "MACRS", period: "5-year" },
  { year: 6, rate: 0.0576, method: "MACRS", period: "5-year" },
];
```

---

## Seeding Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Property Type Factors
  await prisma.propertyTypeFactor.createMany({
    data: [
      { propertyType: "Industrial", factor: 1.01 },
      { propertyType: "Medical", factor: 1.01 },
      { propertyType: "Office", factor: 1.0 },
      { propertyType: "Other", factor: 1.0 },
      { propertyType: "Restaurant", factor: 1.01 },
      { propertyType: "Retail", factor: 0.85 },
      { propertyType: "Warehouse", factor: 0.4 },
      { propertyType: "Multi-Family", factor: 0.4 },
      { propertyType: "Residential/LTR", factor: 0.7 },
      { propertyType: "Short-Term Rental", factor: 0.7 },
    ],
    skipDuplicates: true,
  });

  // 2. Seed Cost Basis Factors
  await prisma.costBasisFactor.createMany({
    data: [
      { minAmount: 0, maxAmount: 250000, factor: 1.0 },
      { minAmount: 250000, maxAmount: 1000000, factor: 1.01 },
      { minAmount: 1000000, maxAmount: 2000000, factor: 1.075 },
      { minAmount: 2000000, maxAmount: 10000000, factor: 1.3 },
      { minAmount: 10000000, maxAmount: null, factor: 1.5 },
    ],
    skipDuplicates: true,
  });

  // 3. Seed Floors Factors
  await prisma.floorsFactor.createMany({
    data: [
      { numberOfFloors: 1, factor: 1.0 },
      { numberOfFloors: 2, factor: 1.0 },
      { numberOfFloors: 3, factor: 1.05 },
      { numberOfFloors: 4, factor: 1.08 },
      { numberOfFloors: 5, factor: 1.1 },
      { numberOfFloors: 6, factor: 1.15 },
      { numberOfFloors: 7, factor: 1.2 },
      { numberOfFloors: 8, factor: 1.25 },
      { numberOfFloors: 9, factor: 1.3 },
      { numberOfFloors: 10, factor: 1.35 },
      { numberOfFloors: 12, factor: 1.4 },
    ],
    skipDuplicates: true,
  });

  // 4. Seed Multiple Properties Factors
  await prisma.multiplePropertiesFactor.createMany({
    data: [
      { propertyCount: 1, factor: 1.0 },
      { propertyCount: 2, factor: 0.95 },
      { propertyCount: 3, factor: 0.9 },
      { propertyCount: 4, factor: 0.85 },
      { propertyCount: 5, factor: 0.8 },
      { propertyCount: 6, factor: 0.75 },
    ],
    skipDuplicates: true,
  });

  // 5. Seed MACRS Depreciation Rates
  await prisma.depreciationRate.createMany({
    data: [
      { year: 1, rate: 0.20, method: "MACRS", depreciationPeriod: "5-year" },
      { year: 2, rate: 0.32, method: "MACRS", depreciationPeriod: "5-year" },
      { year: 3, rate: 0.192, method: "MACRS", depreciationPeriod: "5-year" },
      { year: 4, rate: 0.1152, method: "MACRS", depreciationPeriod: "5-year" },
      { year: 5, rate: 0.1152, method: "MACRS", depreciationPeriod: "5-year" },
      { year: 6, rate: 0.0576, method: "MACRS", depreciationPeriod: "5-year" },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seeding:
```bash
npx prisma db seed
```

---

## Post-Migration Tasks

### 1. Extract Remaining Lookup Data from Excel
- Use Python script `analyze_excel.py` to extract exact values from VLOOKUP Tables
- Update seed script with complete data

### 2. Create Prisma Client Instance
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 3. Create Type-Safe Query Helpers
```typescript
// lib/quotes.ts
import { prisma } from './prisma';

export async function createQuote(data: QuoteCreateInput) {
  return await prisma.quote.create({
    data,
    include: {
      lineItems: true,
      user: true,
    },
  });
}

export async function getQuoteById(id: string) {
  return await prisma.quote.findUnique({
    where: { id },
    include: {
      lineItems: {
        orderBy: { year: 'asc' },
      },
      user: true,
    },
  });
}
```

### 4. Test Database Operations
```typescript
// test/database.test.ts
import { prisma } from '../lib/prisma';

describe('Database Operations', () => {
  it('should create a quote', async () => {
    const quote = await prisma.quote.create({
      data: {
        userId: 'test-user',
        productType: 'RCGV',
        purchasePrice: 2550000,
        zipCode: '85260',
        sqFtBuilding: 1500,
        acresLand: 0.78,
        propertyType: 'Multi-Family',
        taxYear: 2025,
      },
    });

    expect(quote.id).toBeDefined();
  });
});
```

---

## Rollback Plan

If you need to rollback:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Start fresh
npx prisma migrate dev --name init_quote_system
```

---

## Migration Checklist

- [ ] Install Prisma dependencies
- [ ] Configure `DATABASE_URL` in `.env`
- [ ] Review `schema.prisma` models
- [ ] Run `npx prisma migrate dev --name init_quote_system`
- [ ] Verify migration in Prisma Studio
- [ ] Extract complete lookup data from Excel
- [ ] Create and run seed script
- [ ] Test basic CRUD operations
- [ ] Create Prisma client helpers
- [ ] Document API usage for Level 2/3 agents

---

## Next Steps

1. **Level 2 Backend Agent** will:
   - Implement quote calculation engine using Prisma models
   - Create API endpoints for CRUD operations
   - Add validation middleware

2. **Level 3 Data Extraction Agent** will:
   - Complete extraction of all VLOOKUP table data
   - Generate comprehensive seed files
   - Validate data integrity

3. **Level 3 Testing Agent** will:
   - Write integration tests for database operations
   - Test Prisma queries and relationships
   - Verify data seeding

---

**Status:** Ready for migration
**Created:** 2025-10-20
**Schema Version:** 1.0.0
