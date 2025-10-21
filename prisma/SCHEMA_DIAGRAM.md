# Database Schema Diagram
## Quote System - Entity Relationship Diagram

---

## Overview
This document provides a visual representation of the database schema and relationships.

---

## Core Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         QUOTE SYSTEM DATABASE                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      User        │
│──────────────────│
│ id (PK)          │
│ email (unique)   │
│ name             │
│ password         │
│ role             │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                          Quote                                   │
│──────────────────────────────────────────────────────────────────│
│ PRIMARY KEY: id                                                  │
│ FOREIGN KEY: userId → User.id                                    │
│──────────────────────────────────────────────────────────────────│
│ PRODUCT & STATUS                                                 │
│   productType           (RCGV | Pro)                             │
│   status                (draft, finalized, sent, accepted)       │
│──────────────────────────────────────────────────────────────────│
│ INPUT FIELDS (from Excel Input Sheet)                            │
│   purchasePrice         (B3)                                     │
│   zipCode               (D3)                                     │
│   sqFtBuilding          (F3)                                     │
│   acresLand             (H3)                                     │
│   propertyType          (J3)                                     │
│   numberOfFloors        (L3)                                     │
│   multipleProperties    (N3)                                     │
│   dateOfPurchase        (P3)                                     │
│   taxYear               (R3)                                     │
│   yearBuilt             (P7)                                     │
│   capEx                 (AA3)                                    │
│   accumulated1031Depreciation                                    │
│   propertyOwnerName     (B25)                                    │
│   propertyAddress       (B28)                                    │
│──────────────────────────────────────────────────────────────────│
│ CALCULATED FIELDS (from Equation Sheet)                          │
│   costSegBid            (B9)                                     │
│   natLogQuote           (B14)                                    │
│   finalBidBase          (B15)                                    │
│   landValue             (calculated)                             │
│   buildingValue         (calculated)                             │
│──────────────────────────────────────────────────────────────────│
│ APPLIED FACTORS (from VLOOKUP Tables)                            │
│   costBasisFactor                                                │
│   zipCodeFactor                                                  │
│   sqFtFactor                                                     │
│   acresFactor                                                    │
│   propertyTypeFactor                                             │
│   floorsFactor                                                   │
│   multiplePropertiesFactor                                       │
│──────────────────────────────────────────────────────────────────│
│ PAYMENT OPTIONS                                                  │
│   bidAmountOriginal                                              │
│   payUpfront            (base × 0.95)                            │
│   pay5050               (base × 1.1 ÷ 2)                         │
│   payOverTime           (base × 1.2)                             │
│   rushFee                                                        │
│   bonusQuote                                                     │
│──────────────────────────────────────────────────────────────────│
│ DEPRECIATION INFO                                                │
│   depreciationMethod    (39 | 27.5)                              │
│   depreciationYears                                              │
│──────────────────────────────────────────────────────────────────│
│ METADATA                                                         │
│   notes, internalNotes                                           │
│   calculationVersion                                             │
│   createdAt, updatedAt                                           │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      QuoteLineItem                               │
│──────────────────────────────────────────────────────────────────│
│ PRIMARY KEY: id                                                  │
│ FOREIGN KEY: quoteId → Quote.id (CASCADE DELETE)                 │
│ UNIQUE: (quoteId, year)                                          │
│──────────────────────────────────────────────────────────────────│
│ year                    (1, 2, 3, etc.)                          │
│──────────────────────────────────────────────────────────────────│
│ DEPRECIATION METHODS (from YbyY data sheet)                      │
│   method1Depreciation                                            │
│   method2Depreciation                                            │
│   straightLineDepreciation                                       │
│   method3Depreciation                                            │
│──────────────────────────────────────────────────────────────────│
│ COMPARISON DATA (from Printable Quote)                           │
│   costSegEstimate                                                │
│   standardDepreciation                                           │
│   traditionalCostSeg                                             │
│   bonusDepreciation                                              │
│──────────────────────────────────────────────────────────────────│
│ CUMULATIVE VALUES                                                │
│   cumulativeDepreciation                                         │
│   remainingBasis                                                 │
│   taxSavings                                                     │
│──────────────────────────────────────────────────────────────────│
│ TIMESTAMPS                                                       │
│   createdAt, updatedAt                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Lookup Tables (Reference Data)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          PRICING FACTORS                                 │
│                  (from Excel "VLOOKUP Tables" sheet)                     │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐
│  PropertyTypeFactor        │
│────────────────────────────│
│ id (PK)                    │
│ propertyType (unique)      │
│ factor                     │
│ secondaryFactor            │
│ description                │
│ isActive                   │
│────────────────────────────│
│ Examples:                  │
│  Industrial    → 1.01      │
│  Retail        → 0.85      │
│  Warehouse     → 0.4       │
│  Multi-Family  → 0.4       │
└────────────────────────────┘

┌────────────────────────────┐
│  CostBasisFactor           │
│────────────────────────────│
│ id (PK)                    │
│ minAmount                  │
│ maxAmount                  │
│ factor                     │
│ description                │
│ isActive                   │
│────────────────────────────│
│ Examples:                  │
│  $0-$250K      → 1.0       │
│  $250K-$1M     → 1.01      │
│  $1M-$2M       → 1.075     │
│  $2M-$10M      → 1.3       │
│  $10M+         → 1.5       │
└────────────────────────────┘

┌────────────────────────────┐
│  ZipCodeFactor             │
│────────────────────────────│
│ id (PK)                    │
│ minZipCode                 │
│ maxZipCode                 │
│ factor                     │
│ region                     │
│ description                │
│ isActive                   │
│────────────────────────────│
│ Ranges: 0 - 99000          │
│ Factors: 1.0 - 1.11        │
└────────────────────────────┘

┌────────────────────────────┐
│  SqFtFactor                │
│────────────────────────────│
│ id (PK)                    │
│ minSqFt                    │
│ maxSqFt                    │
│ factor                     │
│ description                │
│ isActive                   │
│────────────────────────────│
│ Ranges: 0 - 55,000+ sqft   │
│ Factors: 1.0 - 1.22        │
└────────────────────────────┘

┌────────────────────────────┐
│  AcresFactor               │
│────────────────────────────│
│ id (PK)                    │
│ minAcres                   │
│ maxAcres                   │
│ factor                     │
│ description                │
│ isActive                   │
│────────────────────────────│
│ Ranges: 0 - 9+ acres       │
│ Factors: 0.75 - 1.3        │
└────────────────────────────┘

┌────────────────────────────┐
│  FloorsFactor              │
│────────────────────────────│
│ id (PK)                    │
│ numberOfFloors             │
│ factor                     │
│ description                │
│ isActive                   │
│────────────────────────────│
│ Examples:                  │
│  1 floor       → 1.0       │
│  3 floors      → 1.05      │
│  5 floors      → 1.1       │
│  12 floors     → 1.4       │
└────────────────────────────┘

┌────────────────────────────┐
│  MultiplePropertiesFactor  │
│────────────────────────────│
│ id (PK)                    │
│ propertyCount              │
│ factor                     │
│ description                │
│ isActive                   │
│────────────────────────────│
│ Examples:                  │
│  1 property    → 1.0       │
│  2 properties  → 0.95      │
│  6+ properties → 0.75      │
└────────────────────────────┘
```

---

## Configuration & Audit Tables

```
┌────────────────────────────────────────┐
│  DepreciationRate                      │
│────────────────────────────────────────│
│ id (PK)                                │
│ year                                   │
│ rate                                   │
│ method                                 │
│ depreciationPeriod                     │
│ description                            │
│ isActive                               │
│────────────────────────────────────────│
│ MACRS 5-year rates:                    │
│  Year 1 → 20% (0.20)                   │
│  Year 2 → 32% (0.32)                   │
│  Year 3 → 19.2% (0.192)                │
│  Year 4 → 11.52% (0.1152)              │
│  Year 5 → 11.52% (0.1152)              │
│  Year 6 → 5.76% (0.0576)               │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  CalculationHistory                    │
│────────────────────────────────────────│
│ id (PK)                                │
│ quoteId (not FK, for audit trail)      │
│ userId                                 │
│ calculationType                        │
│ inputData (JSON)                       │
│ outputData (JSON)                      │
│ factorsApplied (JSON)                  │
│ version                                │
│ executionTimeMs                        │
│ createdAt                              │
│────────────────────────────────────────│
│ Purpose: Audit trail for quote calcs   │
│ Preserves history even if quote        │
│ is deleted                             │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  SystemConfig                          │
│────────────────────────────────────────│
│ id (PK)                                │
│ key (unique)                           │
│ value (JSON)                           │
│ dataType                               │
│ description                            │
│ category                               │
│ isActive                               │
│ createdAt, updatedAt                   │
│────────────────────────────────────────│
│ Purpose: App-wide settings             │
│ Examples:                              │
│  - base_pricing_formula                │
│  - enable_rush_fee                     │
│  - upfront_discount_rate → 0.95        │
│  - overtime_markup_rate → 1.2          │
└────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                     QUOTE CALCULATION FLOW                         │
└────────────────────────────────────────────────────────────────────┘

1. USER INPUT
   ├─ Purchase Price, Zip, SqFt, Acres, Property Type, etc.
   │
   ▼
2. LOOKUP TABLE QUERIES
   ├─ Query PropertyTypeFactor       → Get property type multiplier
   ├─ Query CostBasisFactor          → Get cost basis multiplier
   ├─ Query ZipCodeFactor            → Get location multiplier
   ├─ Query SqFtFactor               → Get size multiplier
   ├─ Query AcresFactor              → Get land size multiplier
   ├─ Query FloorsFactor             → Get building height multiplier
   └─ Query MultiplePropertiesFactor → Get bulk discount
   │
   ▼
3. APPLY BUSINESS LOGIC (Equation Sheet)
   ├─ Base calculation with factors
   ├─ Compare multiple quote methods
   ├─ Select minimum viable quote
   ├─ Calculate payment options
   │
   ▼
4. SAVE QUOTE RECORD
   ├─ Store input data
   ├─ Store calculated outputs
   ├─ Store applied factors (for transparency)
   │
   ▼
5. GENERATE YEAR-BY-YEAR DATA
   ├─ Query DepreciationRate table
   ├─ Calculate depreciation for each year
   ├─ Create QuoteLineItem records (1 per year)
   │
   ▼
6. SAVE CALCULATION HISTORY
   ├─ Record input snapshot
   ├─ Record output snapshot
   ├─ Record factors applied
   ├─ Record execution time
   │
   ▼
7. RETURN QUOTE + LINE ITEMS
   └─ Ready for PDF generation or API response
```

---

## Indexing Strategy

### Primary Indexes (for performance)
```
User
  ├─ PRIMARY KEY: id
  └─ INDEX: email

Quote
  ├─ PRIMARY KEY: id
  ├─ FOREIGN KEY: userId → User.id
  ├─ INDEX: userId (for user's quote list)
  ├─ INDEX: status (for filtering)
  ├─ INDEX: productType (for filtering)
  ├─ INDEX: taxYear (for reporting)
  └─ INDEX: createdAt (for sorting)

QuoteLineItem
  ├─ PRIMARY KEY: id
  ├─ FOREIGN KEY: quoteId → Quote.id
  ├─ UNIQUE: (quoteId, year)
  └─ INDEX: quoteId (for quote detail queries)

PropertyTypeFactor
  └─ INDEX: propertyType (for lookups)

CostBasisFactor
  └─ INDEX: minAmount (for range queries)

ZipCodeFactor
  └─ INDEX: minZipCode (for range queries)

SqFtFactor
  └─ INDEX: minSqFt (for range queries)

AcresFactor
  └─ INDEX: minAcres (for range queries)

FloorsFactor
  └─ INDEX: numberOfFloors (for lookups)

MultiplePropertiesFactor
  └─ INDEX: propertyCount (for lookups)

DepreciationRate
  ├─ UNIQUE: (year, method, depreciationPeriod)
  └─ INDEX: method (for filtering)

CalculationHistory
  ├─ INDEX: quoteId (for audit queries)
  └─ INDEX: createdAt (for time-based queries)

SystemConfig
  ├─ INDEX: key (for config lookups)
  └─ INDEX: category (for grouped configs)
```

---

## Query Examples

### 1. Create a new quote with line items
```typescript
const quote = await prisma.quote.create({
  data: {
    userId: "user-123",
    productType: "RCGV",
    purchasePrice: 2550000,
    zipCode: "85260",
    sqFtBuilding: 1500,
    acresLand: 0.78,
    propertyType: "Multi-Family",
    taxYear: 2025,
    lineItems: {
      create: [
        { year: 1, costSegEstimate: 510000, standardDepreciation: 92727 },
        { year: 2, costSegEstimate: 163200, standardDepreciation: 92727 },
        // ... more years
      ],
    },
  },
  include: {
    lineItems: true,
  },
});
```

### 2. Get all quotes for a user
```typescript
const quotes = await prisma.quote.findMany({
  where: { userId: "user-123" },
  include: {
    lineItems: {
      orderBy: { year: 'asc' },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

### 3. Lookup pricing factors
```typescript
// Property type factor
const propTypeFactor = await prisma.propertyTypeFactor.findUnique({
  where: { propertyType: "Multi-Family" },
});

// Cost basis factor (range query)
const costFactor = await prisma.costBasisFactor.findFirst({
  where: {
    minAmount: { lte: 2550000 },
    OR: [
      { maxAmount: { gte: 2550000 } },
      { maxAmount: null },
    ],
  },
});

// Floors factor
const floorsFactor = await prisma.floorsFactor.findUnique({
  where: { numberOfFloors: 3 },
});
```

### 4. Get depreciation rates
```typescript
const macrsRates = await prisma.depreciationRate.findMany({
  where: {
    method: "MACRS",
    depreciationPeriod: "5-year",
  },
  orderBy: { year: 'asc' },
});
```

### 5. Record calculation history
```typescript
await prisma.calculationHistory.create({
  data: {
    quoteId: quote.id,
    userId: "user-123",
    calculationType: "create",
    inputData: { /* input snapshot */ },
    outputData: { /* output snapshot */ },
    factorsApplied: {
      propertyType: 0.4,
      costBasis: 1.3,
      zipCode: 1.05,
      // ...
    },
    version: "1.0.0",
    executionTimeMs: 150,
  },
});
```

---

## Schema Statistics

| Category | Count | Description |
|----------|-------|-------------|
| **Core Models** | 2 | User, Quote |
| **Line Item Models** | 1 | QuoteLineItem |
| **Lookup Tables** | 7 | Pricing factor tables |
| **Config/Audit** | 3 | DepreciationRate, CalculationHistory, SystemConfig |
| **Total Models** | 13 | Complete schema |
| **Relationships** | 2 | User→Quote, Quote→QuoteLineItem |
| **Indexes** | 20+ | For optimal query performance |

---

## Next Steps

1. Run migration: `npx prisma migrate dev --name init_quote_system`
2. Seed lookup tables with Excel data
3. Test CRUD operations
4. Implement quote calculation engine
5. Create API endpoints for Level 2 Backend Agent

---

**Created:** 2025-10-20
**Schema Version:** 1.0.0
**Status:** Ready for implementation
