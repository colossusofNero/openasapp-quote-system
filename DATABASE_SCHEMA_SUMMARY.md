# Database Schema Summary
## Quote System - Executive Overview

---

## Quick Reference

**Location:** `C:\Users\scott\Claude_Code\OpenAsApp_App\prisma\`

**Status:** Ready for migration

**Schema Version:** 1.0.0

**Last Updated:** 2025-10-20

---

## Files Created

| File | Purpose |
|------|---------|
| `schema.prisma` | Main Prisma schema with all 13 models |
| `README.md` | Developer quick start guide |
| `MIGRATION_PLAN.md` | Detailed migration steps and seeding plan |
| `SCHEMA_DIAGRAM.md` | Visual ER diagrams and relationships |

---

## Schema Statistics

- **Total Models:** 13
- **Core Models:** 2 (User, Quote)
- **Line Items:** 1 (QuoteLineItem)
- **Lookup Tables:** 7 (Pricing factors)
- **Config/Audit:** 3 (DepreciationRate, CalculationHistory, SystemConfig)
- **Relationships:** 2 (User→Quote, Quote→QuoteLineItem)
- **Indexes:** 20+

---

## Key Models

### 1. Quote (Main Entity)
**Purpose:** Stores all quote data - input fields from Excel + calculated outputs

**Key Fields:**
- **Input:** purchasePrice, zipCode, sqFtBuilding, acresLand, propertyType, numberOfFloors, taxYear, capEx
- **Output:** costSegBid, natLogQuote, finalBidBase, landValue, buildingValue
- **Factors:** All applied pricing factors (for transparency)
- **Payment Options:** payUpfront, pay5050, payOverTime
- **Metadata:** productType (RCGV/Pro), status, calculationVersion

**Maps to:** Excel "Input Sheet" and "Printable Quote" sheets

---

### 2. QuoteLineItem (Depreciation Schedule)
**Purpose:** Year-by-year depreciation projections

**Key Fields:**
- year (1, 2, 3, etc.)
- method1Depreciation, method2Depreciation, straightLineDepreciation
- costSegEstimate, standardDepreciation, traditionalCostSeg, bonusDepreciation
- cumulativeDepreciation, remainingBasis, taxSavings

**Maps to:** Excel "YbyY data" sheet and "Printable Quote" comparison tables

---

### 3. Lookup Tables (7 tables)
**Purpose:** Store pricing factors from Excel VLOOKUP Tables

#### PropertyTypeFactor
- Industrial: 1.01
- Retail: 0.85
- Warehouse: 0.4
- Multi-Family: 0.4
- Residential/LTR: 0.7
- (+ 5 more types)

#### CostBasisFactor
- $0-$250K: 1.0x
- $250K-$1M: 1.01x
- $1M-$2M: 1.075x
- $2M-$10M: 1.3x
- $10M+: 1.5x

#### ZipCodeFactor
- Range: 0-99000
- Factors: 1.0-1.11

#### SqFtFactor
- Range: 0-55,000+ sqft
- Factors: 1.0-1.22

#### AcresFactor
- Range: 0-9+ acres
- Factors: 0.75-1.3

#### FloorsFactor
- 1 floor: 1.0
- 3 floors: 1.05
- 5 floors: 1.1
- 12 floors: 1.4

#### MultiplePropertiesFactor
- 1 property: 1.0
- 2 properties: 0.95
- 6+ properties: 0.75

---

## Relationships

```
User (1) ──────> (N) Quote (1) ──────> (N) QuoteLineItem

CalculationHistory ────(soft reference)────> Quote

Lookup Tables (standalone reference tables)
  - PropertyTypeFactor
  - CostBasisFactor
  - ZipCodeFactor
  - SqFtFactor
  - AcresFactor
  - FloorsFactor
  - MultiplePropertiesFactor
  - DepreciationRate
```

---

## Field Mappings (Excel → Database)

### Input Fields (from Excel "Input Sheet")
| Database Field | Excel Cell | Example |
|----------------|------------|---------|
| purchasePrice | B3 | $2,550,000 |
| zipCode | D3 | 85260 |
| sqFtBuilding | F3 | 1,500 |
| acresLand | H3 | 0.78 |
| propertyType | J3 | Multi-Family |
| numberOfFloors | L3 | 3 |
| multipleProperties | N3 | 1 |
| dateOfPurchase | P3 | 2024-03-15 |
| taxYear | R3 | 2025 |
| yearBuilt | P7 | 2018 |
| capEx | AA3 | $50,000 |
| propertyOwnerName | B25 | John Doe |
| propertyAddress | B28 | 123 Main St |

### Output Fields (Calculated)
| Database Field | Excel Source | Calculation |
|----------------|--------------|-------------|
| costSegBid | B9 | From Equation Sheet |
| natLogQuote | B14 | Natural log formula |
| finalBidBase | B15 | MIN(B9, B14, D11, D14) |
| payUpfront | Calculated | Base × 0.95 |
| pay5050 | Calculated | Base × 1.1 ÷ 2 |
| payOverTime | Calculated | Base × 1.2 |

---

## Migration Checklist

### Prerequisites
- [ ] Install Prisma: `npm install prisma @prisma/client --save-dev`
- [ ] Create `.env` file with `DATABASE_URL`
- [ ] Choose database provider (PostgreSQL, MySQL, or SQLite)

### Migration Steps
- [ ] Review `prisma/schema.prisma`
- [ ] Run: `npx prisma migrate dev --name init_quote_system`
- [ ] Run: `npx prisma generate`
- [ ] Extract VLOOKUP table data from Excel
- [ ] Create seed script with lookup table data
- [ ] Run: `npx prisma db seed`
- [ ] Verify: `npx prisma studio`

### Testing
- [ ] Test User creation
- [ ] Test Quote CRUD operations
- [ ] Test QuoteLineItem creation
- [ ] Test lookup table queries
- [ ] Test relationship queries (include)
- [ ] Verify indexes are used (query performance)

---

## Usage Examples

### Create a Quote
```typescript
const quote = await prisma.quote.create({
  data: {
    userId: "user-123",
    productType: "RCGV",
    purchasePrice: 2550000,
    zipCode: "85260",
    propertyType: "Multi-Family",
    taxYear: 2025,
    // ... more fields
  },
  include: { lineItems: true },
});
```

### Lookup Pricing Factor
```typescript
const factor = await prisma.propertyTypeFactor.findUnique({
  where: { propertyType: "Multi-Family" },
});
// Returns: { factor: 0.4, ... }
```

### Get Quote with Line Items
```typescript
const quote = await prisma.quote.findUnique({
  where: { id: "quote-123" },
  include: {
    lineItems: { orderBy: { year: 'asc' } },
    user: true,
  },
});
```

---

## Payment Calculation Logic

The schema stores all payment options as calculated fields:

1. **Base Price** = Final bid from quote calculation engine
2. **Pay Upfront** = Base × 0.95 (5% discount)
3. **Pay 50/50** = (Base × 1.1) ÷ 2 (10% markup, split into 2 payments)
4. **Pay Over Time** = Base × 1.2 (20% markup for monthly payments)
5. **Rush Fee** = Additional fee (if applicable)

---

## Depreciation Calculation

The schema supports multiple depreciation methods:

### MACRS 5-Year Schedule
- Year 1: 20% (0.20)
- Year 2: 32% (0.32)
- Year 3: 19.2% (0.192)
- Year 4: 11.52% (0.1152)
- Year 5: 11.52% (0.1152)
- Year 6: 5.76% (0.0576)

### Building Value Formula
```
Building Value = Purchase Price - Land Value - 1031 Acc Dep + CapEx
```

### Line Item Creation
Each quote should have multiple `QuoteLineItem` records, one for each year, showing:
- Cost Seg depreciation estimate
- Standard depreciation (39-year or 27.5-year straight line)
- Traditional cost seg
- Bonus depreciation
- Tax savings comparison

---

## Audit Trail

### CalculationHistory Model
Every quote calculation is recorded in `CalculationHistory`:
- Input data snapshot (JSON)
- Output data snapshot (JSON)
- Factors applied (JSON)
- Calculation version
- Execution time (for performance monitoring)

This provides:
- Full audit trail
- Ability to reproduce calculations
- Debugging support
- Version tracking

---

## Product Types

### RCGV
- Full cost segregation analysis
- Detailed depreciation schedules
- Payment flexibility
- Focus product for initial implementation

### Pro
- Professional-tier analysis
- Enhanced reporting
- Premium pricing
- Second priority for implementation

### SMART (Deprecated)
- NOT implemented in schema
- Legacy product from Excel
- Ignore all SMART-related sheets

---

## Data Seeding Requirements

After migration, the following lookup tables MUST be seeded:

1. **PropertyTypeFactor** - 10 property types
2. **CostBasisFactor** - 5 cost ranges
3. **ZipCodeFactor** - Multiple zip code ranges (extract from Excel)
4. **SqFtFactor** - Multiple size ranges (extract from Excel)
5. **AcresFactor** - Multiple acreage ranges (extract from Excel)
6. **FloorsFactor** - 11 floor configurations
7. **MultiplePropertiesFactor** - 6 property count tiers
8. **DepreciationRate** - MACRS rates for different periods

See `prisma/MIGRATION_PLAN.md` for complete seeding script.

---

## Performance Considerations

### Indexes Created
- All primary keys (automatic)
- User.email (unique)
- Quote.userId, Quote.status, Quote.productType, Quote.taxYear, Quote.createdAt
- QuoteLineItem.quoteId
- All lookup table key fields
- CalculationHistory.quoteId, CalculationHistory.createdAt

### Query Optimization
- Use `select` instead of `include` when possible
- Batch operations with `createMany`
- Use transactions for related operations
- Leverage indexes in `where` clauses

---

## Security Considerations

### User Password Storage
- Schema stores password as string
- MUST be hashed (bcrypt, argon2, etc.) before storage
- Never store plaintext passwords

### Sensitive Data
- CalculationHistory stores full snapshots (JSON)
- Ensure proper access controls on this table
- Consider PII encryption for production

### API Access
- Implement row-level security
- Users should only access their own quotes
- Admin role for system-wide access

---

## Next Steps by Agent Level

### Level 1 Chief Architect
- [x] Schema design completed
- [ ] Review and approve schema
- [ ] Assign implementation tasks to Level 2/3 agents

### Level 2 Backend Agent
- [ ] Implement quote calculation engine
- [ ] Create REST/GraphQL API endpoints
- [ ] Add validation middleware
- [ ] Implement business logic from Excel

### Level 3 Database Design Agent (This Agent)
- [x] Create Prisma schema
- [x] Document models and relationships
- [x] Create migration plan
- [ ] Assist with migration execution
- [ ] Support seeding data extraction

### Level 3 Data Extraction Agent
- [ ] Extract complete VLOOKUP table data from Excel
- [ ] Generate TypeScript seed files
- [ ] Validate data integrity
- [ ] Document any Excel discrepancies

### Level 3 Testing Agent
- [ ] Write unit tests for database operations
- [ ] Integration tests for quote calculations
- [ ] Performance tests for lookups
- [ ] Data integrity validation

---

## Support & Documentation

### Key Files
- **Schema:** `C:\Users\scott\Claude_Code\OpenAsApp_App\prisma\schema.prisma`
- **Quick Start:** `C:\Users\scott\Claude_Code\OpenAsApp_App\prisma\README.md`
- **Migration Guide:** `C:\Users\scott\Claude_Code\OpenAsApp_App\prisma\MIGRATION_PLAN.md`
- **Diagrams:** `C:\Users\scott\Claude_Code\OpenAsApp_App\prisma\SCHEMA_DIAGRAM.md`
- **Excel Analysis:** `C:\Users\scott\Claude_Code\OpenAsApp_App\EXCEL_STRUCTURE_ANALYSIS.md`

### External Resources
- Prisma Docs: https://www.prisma.io/docs
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Prisma Client API: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference

---

## Summary

A comprehensive Prisma schema has been created that models the complete quote system based on the Excel workbook structure. The schema includes:

- **13 models** covering users, quotes, line items, lookup tables, and audit trails
- **Complete field mappings** from Excel Input Sheet to database
- **Proper relationships** between entities (User→Quote→QuoteLineItem)
- **7 lookup tables** for pricing factors (exactly matching Excel VLOOKUP Tables)
- **Audit trail** via CalculationHistory model
- **Flexible configuration** via SystemConfig model

The schema is production-ready and includes:
- Appropriate data types (Decimal for currency, DateTime, JSON, etc.)
- Indexes for performance
- Cascading deletes where appropriate
- Comprehensive comments and documentation
- Migration and seeding plans

**Status:** Ready for implementation by Level 2/3 agents

---

**Created:** 2025-10-20
**Version:** 1.0.0
**Author:** Level 3 Database Design Agent
