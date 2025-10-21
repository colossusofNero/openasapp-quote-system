# Pricing Formulas Documentation

## Overview

This document provides a detailed breakdown of the pricing formulas extracted from the Excel workbook `Base Pricing27.1_Pro_SMART_RCGV.xlsx` and implemented in `src/lib/quote-engine/pricing-formulas.ts`.

---

## Formula Dependencies and Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         QUOTE CALCULATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

1. INPUT COLLECTION
   ├─ Purchase Price (B3)
   ├─ Zip Code (D3)
   ├─ SqFt Building (F3)
   ├─ Acres Land (H3)
   ├─ Property Type (J3)
   ├─ Number of Floors (L3)
   ├─ Multiple Properties (N3)
   └─ Capital Improvements (AA3)

2. FACTOR LOOKUP (VLOOKUP Tables)
   ├─ Cost Basis Factor (N19)    ← VLOOKUP(B3, A4:B15)
   ├─ Zip Code Factor (N22)      ← VLOOKUP(D3, D4:E15)
   ├─ SqFt Factor (N25)          ← VLOOKUP(F3, G4:H15)
   ├─ Acres Factor (N28)         ← VLOOKUP(H3, J4:K15)
   ├─ Property Type Factor (N31) ← VLOOKUP(J3, M4:N13)
   ├─ Floors Factor (N34)        ← VLOOKUP(L3, P4:Q15)
   └─ Multiple Props Factor (N37)← VLOOKUP(N3, S4:T15)

3. BASE BID CALCULATION (Equation Sheet C21)
   ├─ A20 = Purchase Price + CapEx
   ├─ A21 = (A20 × 0.0572355 × 0.25 × 0.08) + 4000
   └─ C21 = A21 × N22 × N19 × N25 × N28 × N31 × N34

4. ALTERNATIVE QUOTE CALCULATIONS
   ├─ Natural Log Quote (C51)
   │  ├─ C43 = Base Bid (A40)
   │  ├─ C46 = A40 - C42 (constant)
   │  ├─ C47 = C46 × 0.001
   │  ├─ C48 = C47 × -C44 (constant)
   │  ├─ C49 = e^(C48)
   │  ├─ C50 = 1 + C49
   │  └─ C51 = C43 / C50
   │
   ├─ Multiple Properties Quote (D22)
   │  └─ D22 = C21 × N37
   │
   └─ Cost Method Quote (AB26)
      └─ AB26 = SUM(AB21:AB25)

5. FINAL BID SELECTION (Input Sheet B17)
   └─ IF(MIN(B9, B14, D11) < D14, D14, MIN(B9, B14, D11))
      ├─ B9 = Base Bid (C21)
      ├─ B14 = Nat Log Quote (C51)
      ├─ D11 = Multiple Props Quote (D22)
      └─ D14 = Cost Method Quote (AB26)

6. PAYMENT OPTIONS
   ├─ 50/50 Payment (D17) = Final Bid × 1.1 / 2
   └─ Monthly Payment (F17) = Final Bid × 1.2
```

---

## Key Formula Details

### 1. Base Cost Seg Bid (Equation Sheet C21)

**Excel Reference:** `Equation Sheet!C21`

**Formula:** `=A21*N22*N19*N25*N28*N31*N34`

**Components:**
- **A21:** Base calculation = `(A20 × 0.0572355 × 0.25 × 0.08) + 4000`
- **A20:** Adjusted purchase price = `Purchase Price + CapEx`
- **N22:** Zip Code Factor (from VLOOKUP)
- **N19:** Cost Basis Factor (from VLOOKUP)
- **N25:** SqFt Factor (from VLOOKUP)
- **N28:** Acres Factor (from VLOOKUP)
- **N31:** Property Type Factor (from VLOOKUP)
- **N34:** Floors Factor (from VLOOKUP)

**Magic Numbers Explained:**
- `0.0572355`: Base rate coefficient
- `0.25`: Quarter multiplier
- `0.08`: 8% factor
- `4000`: Minimum base fee

**TypeScript Implementation:**
```typescript
export function calculateBaseBid(inputs: QuoteInputs, factors: PricingFactors): number {
  const A20 = inputs.purchasePrice + inputs.capEx;
  const A21 = (A20 * 0.0572355 * 0.25 * 0.08) + 4000;

  return A21
    * factors.zipCodeFactor
    * factors.costBasisFactor
    * factors.sqftFactor
    * factors.acresFactor
    * factors.propertyTypeFactor
    * factors.floorsFactor;
}
```

---

### 2. Natural Log Quote (Equation Sheet C51)

**Excel Reference:** `Equation Sheet!C51`

**Formula:** `=C43/C50`

**Dependency Chain:**
```
C51 = C43 / C50
  ├─ C43 = Base Bid (from A40, which equals Input Sheet B9)
  └─ C50 = 1 + C49
      └─ C49 = e^(C48)
          └─ C48 = C47 × -C44
              └─ C47 = C46 × 0.001
                  └─ C46 = A40 - C42
```

**Constants:**
- **C42:** Threshold constant (typically 2000)
- **C44:** Decay rate (typically 5)

**Purpose:** This formula creates a sigmoid-like curve that smooths price transitions based on property value.

**TypeScript Implementation:**
```typescript
export function calculateNatLogQuote(
  baseBid: number,
  constantC42: number = 2000,
  constantC44: number = 5
): number {
  const C46 = baseBid - constantC42;
  const C47 = C46 * 0.001;
  const C48 = C47 * -constantC44;
  const C49 = Math.pow(Math.E, C48);
  const C50 = 1 + C49;
  return baseBid / C50;
}
```

---

### 3. Multiple Properties Quote (Equation Sheet D22)

**Excel Reference:** `Equation Sheet!D22`

**Formula:** `=C21*N37`

**Components:**
- **C21:** Base Cost Seg Bid
- **N37:** Multiple Properties Factor (discount for bulk orders)

**Factor Table:**
| Properties | Factor |
|------------|--------|
| 1          | 1.0    |
| 2          | 0.95   |
| 3          | 0.9    |
| 4          | 0.85   |
| 5          | 0.8    |
| 6+         | 0.75   |

**TypeScript Implementation:**
```typescript
export function calculateMultiplePropertiesQuote(
  baseBid: number,
  factors: PricingFactors
): number {
  return baseBid * factors.multiplePropertiesFactor;
}
```

---

### 4. Cost Method Quote (Equation Sheet AB26)

**Excel Reference:** `Equation Sheet!AB26`

**Formula:** `=SUM(AB21:AB25)`

**Components:**
- **AB21:** Calculated cost component 1
- **AB22:** `=Z15` (cost component 2)
- **AB23:** `=X15` (cost component 3)
- **AB24:** `=W15` (cost component 4)
- **AB25:** Cost component 5

**Dependency Chain (for W15):**
```
W15 = IF(SqFt < 2400, U15, V16)
  ├─ U15 = MIN(T15, 1500)
  │   └─ T15 = Q15 + S15
  │       └─ S15 = R15 × SqFt
  │
  └─ V16 = MAX(V19, V18, V17)
      ├─ V17 = IF(SqFt between 1-99999, U17, 0)
      ├─ V18 = IF(SqFt between 100000-299999, U18, 0)
      └─ V19 = IF(SqFt > 300000, U19, 0)
```

**Note:** This is the most complex calculation and may require additional Excel constants for full accuracy.

---

### 5. Final Bid Selection (Input Sheet B17)

**Excel Reference:** `Input Sheet!B17`

**Formula:** `=IF(MIN(B9,B14,D11)<D14,D14,MIN(B9,B14,D11))`

**Logic:**
1. Calculate minimum of: Base Bid (B9), Nat Log Quote (B14), Multiple Props Quote (D11)
2. If this minimum is less than Cost Method Quote (D14):
   - Return Cost Method Quote (floor/minimum price)
3. Else:
   - Return the calculated minimum

**Purpose:** Ensures the quote never goes below the cost method threshold while selecting the most appropriate pricing model.

**TypeScript Implementation:**
```typescript
export function calculateFinalBid(
  baseBid: number,
  natLogQuote: number,
  multiplePropertiesQuote: number,
  costMethodQuote: number
): number {
  const minOfThree = Math.min(baseBid, natLogQuote, multiplePropertiesQuote);
  return minOfThree < costMethodQuote ? costMethodQuote : minOfThree;
}
```

---

### 6. Payment Options

#### 50/50 Payment (Input Sheet D17)

**Excel Reference:** `Input Sheet!D17`

**Formula:** `=B17*1.1/2`

**Purpose:** Splits the final bid into two payments with a 10% markup for payment flexibility.

**Example:**
- Final Bid: $10,000
- 50/50 Payment: $10,000 × 1.1 / 2 = $5,500 per payment

#### Monthly Payment (Input Sheet F17)

**Excel Reference:** `Input Sheet!F17`

**Formula:** `=B17*1.2`

**Purpose:** Allows extended payment with a 20% markup.

**Example:**
- Final Bid: $10,000
- Monthly Payment Total: $10,000 × 1.2 = $12,000

---

## VLOOKUP Factor Tables

### Cost Basis Factor (A4:B15)

**Excel Reference:** `Equation Sheet!N19`

**Formula:** `=VLOOKUP('Input Sheet'!$B$3, 'VLOOKUP Tables'!A4:B15, 2, TRUE)`

| Purchase Price | Factor |
|----------------|--------|
| $0             | 1.0    |
| $250,000       | 1.01   |
| $500,000       | 1.02   |
| $750,000       | 1.05   |
| $1,000,000     | 1.075  |
| $1,250,000     | 1.1    |
| $1,500,000     | 1.25   |
| $2,000,000     | 1.3    |
| $3,000,000     | 1.35   |
| $5,000,000     | 1.4    |
| $7,500,000     | 1.45   |
| $10,000,000+   | 1.5    |

**Lookup Type:** Range (TRUE) - finds largest value ≤ lookup value

---

### Zip Code Factor (D4:E15)

**Excel Reference:** `Equation Sheet!N22`

**Formula:** `=VLOOKUP('Input Sheet'!$D$3, 'VLOOKUP Tables'!D4:E15, 2, TRUE)`

| Zip Range   | Factor |
|-------------|--------|
| 0-9,999     | 1.11   |
| 10,000-19,999| 1.1   |
| 20,000-29,999| 1.09  |
| 30,000-39,999| 1.08  |
| 40,000-49,999| 1.07  |
| 50,000-59,999| 1.06  |
| 60,000-69,999| 1.04  |
| 70,000-79,999| 1.02  |
| 80,000-89,999| 1.0   |
| 90,000-96,099| 1.01  |
| 96,100-98,999| 1.1   |
| 99,000+     | 1.1    |

---

### SqFt Factor (G4:H15)

**Excel Reference:** `Equation Sheet!N25`

**Formula:** `=VLOOKUP('Input Sheet'!$F$3, 'VLOOKUP Tables'!G4:H15, 2, TRUE)`

| SqFt Range     | Factor |
|----------------|--------|
| 0-2,499        | 1.0    |
| 2,500-4,999    | 1.02   |
| 5,000-9,999    | 1.04   |
| 10,000-14,999  | 1.06   |
| 15,000-19,999  | 1.08   |
| 20,000-29,999  | 1.1    |
| 30,000-34,999  | 1.12   |
| 35,000-39,999  | 1.14   |
| 40,000-44,999  | 1.16   |
| 45,000-49,999  | 1.18   |
| 50,000-54,999  | 1.2    |
| 55,000+        | 1.22   |

---

### Acres Factor (J4:K15)

**Excel Reference:** `Equation Sheet!N28`

**Formula:** `=VLOOKUP('Input Sheet'!H3,'VLOOKUP Tables'!J4:K15,2,TRUE)`

| Acres Range | Factor |
|-------------|--------|
| 0-0.24      | 0.75   |
| 0.25-0.49   | 0.8    |
| 0.5-0.99    | 0.85   |
| 1-1.99      | 0.9    |
| 2-2.99      | 0.95   |
| 3-3.99      | 1.0    |
| 4-4.99      | 1.05   |
| 5-5.99      | 1.1    |
| 6-6.99      | 1.15   |
| 7-7.99      | 1.2    |
| 8-8.99      | 1.25   |
| 9+          | 1.3    |

---

### Property Type Factor (M4:N13)

**Excel Reference:** `Equation Sheet!N31`

**Formula:** `=VLOOKUP('Input Sheet'!$J$3, 'VLOOKUP Tables'!M4:N13, 2, FALSE)`

| Property Type      | Factor |
|--------------------|--------|
| Industrial         | 1.01   |
| Medical            | 1.01   |
| Office             | 1.0    |
| Other              | 1.0    |
| Restaurant         | 1.01   |
| Retail             | 0.85   |
| Warehouse          | 0.4    |
| Multi-Family       | 0.4    |
| Residential/LTR    | 0.7    |
| Short-Term Rental  | 0.7    |

**Lookup Type:** Exact (FALSE) - must match exactly

---

### Number of Floors Factor (P4:Q15)

**Excel Reference:** `Equation Sheet!N34`

**Formula:** `=VLOOKUP('Input Sheet'!$L$3, 'VLOOKUP Tables'!P4:Q15, 2, FALSE)`

| Floors | Factor |
|--------|--------|
| 1      | 1.0    |
| 2      | 1.0    |
| 3      | 1.05   |
| 4      | 1.1    |
| 5      | 1.1    |
| 6      | 1.15   |
| 7      | 1.15   |
| 8      | 1.2    |
| 9      | 1.2    |
| 10     | 1.3    |
| 11     | 1.3    |
| 12+    | 1.4    |

---

### Multiple Properties Factor (S4:T15)

**Excel Reference:** `Equation Sheet!N37`

**Formula:** `=VLOOKUP('Input Sheet'!$N$3, 'VLOOKUP Tables'!S4:T15, 2, FALSE)`

| Properties | Factor |
|------------|--------|
| 1          | 1.0    |
| 2          | 0.95   |
| 3          | 0.9    |
| 4          | 0.85   |
| 5          | 0.8    |
| 6+         | 0.75   |

---

## Implementation Notes

### Completed Features

1. **All Factor Lookups** - All VLOOKUP tables replicated as TypeScript constants
2. **Base Bid Calculation** - Complete implementation with all factors
3. **Natural Log Quote** - Sigmoid curve pricing model
4. **Multiple Properties Quote** - Bulk discount calculation
5. **Final Bid Selection** - Minimum selection logic with floor
6. **Payment Options** - 50/50 and Monthly calculations
7. **Validation** - Input validation for all parameters
8. **Utilities** - Currency formatting and quote summary

### Areas Requiring Additional Excel Values

1. **Cost Method Quote (AB26)** - Some intermediate constants need extraction
2. **Natural Log Constants (C42, C44)** - Should verify exact values from Excel
3. **Land Value Calculation (S4)** - Not yet implemented (for depreciation calculations)

### Testing Recommendations

1. **Create Test Cases** from existing Excel quotes
2. **Compare Outputs** between TypeScript and Excel for same inputs
3. **Validate Edge Cases**:
   - Properties at factor boundaries (e.g., exactly $250,000)
   - Very large properties (>$10M)
   - Multiple property counts (1-6+)
   - All property types

---

## Usage Example

```typescript
import { calculateQuote, validateQuoteInputs, createQuoteSummary } from './pricing-formulas';

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
  capEx: 50000,
  propertyOwnerName: 'Acme Properties LLC',
  propertyAddress: '123 Main St, Phoenix, AZ 85260'
};

// Validate inputs
const errors = validateQuoteInputs(inputs);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
  return;
}

// Calculate quote
const results = calculateQuote(inputs);

// Display results
console.log(createQuoteSummary(inputs, results));
```

---

## Formula Traceability Matrix

| TypeScript Function | Excel Cell | Excel Sheet | Formula |
|---------------------|------------|-------------|---------|
| `calculateBaseBid()` | C21 | Equation Sheet | `=A21*N22*N19*N25*N28*N31*N34` |
| `calculateNatLogQuote()` | C51 | Equation Sheet | `=C43/C50` |
| `calculateMultiplePropertiesQuote()` | D22 | Equation Sheet | `=C21*N37` |
| `calculateCostMethodQuote()` | AB26 | Equation Sheet | `=SUM(AB21:AB25)` |
| `calculateFinalBid()` | B17 | Input Sheet | `=IF(MIN(B9,B14,D11)<D14,D14,MIN(B9,B14,D11))` |
| `calculate5050Payment()` | D17 | Input Sheet | `=B17*1.1/2` |
| `calculateMonthlyPayment()` | F17 | Input Sheet | `=B17*1.2` |
| `getCostBasisFactor()` | N19 | Equation Sheet | `=VLOOKUP('Input Sheet'!$B$3, 'VLOOKUP Tables'!A4:B15, 2, TRUE)` |
| `getZipCodeFactor()` | N22 | Equation Sheet | `=VLOOKUP('Input Sheet'!$D$3, 'VLOOKUP Tables'!D4:E15, 2, TRUE)` |
| `getSqFtFactor()` | N25 | Equation Sheet | `=VLOOKUP('Input Sheet'!$F$3, 'VLOOKUP Tables'!G4:H15, 2, TRUE)` |
| `getAcresFactor()` | N28 | Equation Sheet | `=VLOOKUP('Input Sheet'!H3,'VLOOKUP Tables'!J4:K15,2,TRUE)` |
| `getPropertyTypeFactor()` | N31 | Equation Sheet | `=VLOOKUP('Input Sheet'!$J$3, 'VLOOKUP Tables'!M4:N13, 2, FALSE)` |
| `getFloorsFactor()` | N34 | Equation Sheet | `=VLOOKUP('Input Sheet'!$L$3, 'VLOOKUP Tables'!P4:Q15, 2, FALSE)` |
| `getMultiplePropertiesFactor()` | N37 | Equation Sheet | `=VLOOKUP('Input Sheet'!$N$3, 'VLOOKUP Tables'!S4:T15, 2, FALSE)` |

---

**Last Updated:** 2025-10-20
**Source File:** `reference/directory/Base Pricing27.1_Pro_SMART_RCGV.xlsx`
**TypeScript File:** `src/lib/quote-engine/pricing-formulas.ts`
