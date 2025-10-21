# Pricing Calculation Flow Diagram

## Visual Representation of Quote Calculation Logic

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         QUOTE CALCULATION ENGINE                         ║
╚══════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: INPUT COLLECTION                                                 │
└──────────────────────────────────────────────────────────────────────────┘

    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃ Property Data (Input Sheet)                                      ┃
    ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
    ┃ • Purchase Price (B3)           • Property Type (J3)            ┃
    ┃ • Zip Code (D3)                  • Number of Floors (L3)        ┃
    ┃ • SqFt Building (F3)             • Multiple Properties (N3)     ┃
    ┃ • Acres Land (H3)                • Capital Improvements (AA3)   ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                   │
                                   │ validateQuoteInputs()
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2: FACTOR LOOKUP (VLOOKUP Tables)                                  │
└──────────────────────────────────────────────────────────────────────────┘

    Cost Basis      Zip Code        SqFt          Acres
    (N19)           (N22)           (N25)         (N28)
       │               │               │              │
       │               │               │              │
    ┌──▼───────┐   ┌──▼───────┐   ┌──▼───────┐   ┌──▼───────┐
    │ $0-$10M+ │   │ 0-99000  │   │ 0-55k+   │   │ 0-9+     │
    │ 1.0-1.5  │   │ 1.0-1.11 │   │ 1.0-1.22 │   │ 0.75-1.3 │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘

    Property Type   Floors          Multiple Props
    (N31)           (N34)           (N37)
       │               │               │
       │               │               │
    ┌──▼───────┐   ┌──▼───────┐   ┌──▼───────┐
    │ 10 types │   │ 1-12+    │   │ 1-6+     │
    │ 0.4-1.01 │   │ 1.0-1.4  │   │ 0.75-1.0 │
    └──────────┘   └──────────┘   └──────────┘
       │               │               │
       └───────────────┴───────────────┘
                       │
                       │ calculatePricingFactors()
                       ▼
              ┏━━━━━━━━━━━━━━━━━┓
              ┃ PricingFactors  ┃
              ┗━━━━━━━━━━━━━━━━━┛

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 3: BASE BID CALCULATION (Equation Sheet C21)                       │
└──────────────────────────────────────────────────────────────────────────┘

    Purchase Price + CapEx = A20
              │
              │ × 0.0572355 × 0.25 × 0.08 + 4000
              ▼
            A21 (Base Amount)
              │
              │ × All Factors
              │ (N22 × N19 × N25 × N28 × N31 × N34)
              ▼
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃ BASE COST SEG BID (C21)  ┃
    ┃    calculateBaseBid()    ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 4: ALTERNATIVE QUOTE CALCULATIONS                                  │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │ NATURAL LOG QUOTE (C51)                                         │
    │ ─────────────────────────────────────────────────────────────── │
    │                                                                 │
    │  Base Bid - Constant (C42)                                      │
    │         │                                                       │
    │         │ × 0.001                                               │
    │         ▼                                                       │
    │      × -Constant (C44)                                          │
    │         │                                                       │
    │         │ e^(value)                                             │
    │         ▼                                                       │
    │      1 + result                                                 │
    │         │                                                       │
    │         │ Base Bid ÷ result                                     │
    │         ▼                                                       │
    │   ┏━━━━━━━━━━━━━━━━━━━━━┓                                       │
    │   ┃ Natural Log Quote  ┃                                       │
    │   ┗━━━━━━━━━━━━━━━━━━━━━┛                                       │
    │                                                                 │
    │   Purpose: Sigmoid curve for price smoothing                   │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │ MULTIPLE PROPERTIES QUOTE (D22)                                 │
    │ ─────────────────────────────────────────────────────────────── │
    │                                                                 │
    │  Base Bid × Multiple Properties Factor (N37)                    │
    │         │                                                       │
    │         ▼                                                       │
    │   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                                │
    │   ┃ Multiple Props Quote     ┃                                │
    │   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛                                │
    │                                                                 │
    │   Purpose: Bulk discount for multiple properties               │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │ COST METHOD QUOTE (AB26)                                        │
    │ ─────────────────────────────────────────────────────────────── │
    │                                                                 │
    │  Complex calculation based on SqFt and other factors            │
    │         │                                                       │
    │         │ SUM(AB21:AB25)                                        │
    │         ▼                                                       │
    │   ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓                                  │
    │   ┃ Cost Method Quote      ┃                                  │
    │   ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛                                  │
    │                                                                 │
    │   Purpose: Alternative cost-based pricing                      │
    └─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 5: FINAL BID SELECTION (Input Sheet B17)                           │
└──────────────────────────────────────────────────────────────────────────┘

         Base Bid (B9)    Nat Log (B14)    Multi Props (D11)
              │                 │                  │
              └─────────────────┴──────────────────┘
                                │
                          MIN(B9, B14, D11)
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Is MIN < Cost Method? │
                    │      (D14)            │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   YES                     NO
                    │                       │
                    ▼                       ▼
          Use Cost Method Quote   Use MIN of three quotes
                    │                       │
                    └───────────┬───────────┘
                                │
                                ▼
                      ┏━━━━━━━━━━━━━━━━━┓
                      ┃   FINAL BID     ┃
                      ┃     (B17)       ┃
                      ┗━━━━━━━━━━━━━━━━━┛

    Logic: Selects the most appropriate quote while ensuring
           the cost method acts as a minimum floor price

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 6: PAYMENT OPTIONS                                                 │
└──────────────────────────────────────────────────────────────────────────┘

                        Final Bid
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
         × 1.1 ÷ 2                   × 1.2
                │                       │
                ▼                       ▼
    ┏━━━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━━━━━┓
    ┃ 50/50 Payment    ┃   ┃ Monthly Payment    ┃
    ┃ (D17)            ┃   ┃ (F17)              ┃
    ┃                  ┃   ┃                    ┃
    ┃ Per payment:     ┃   ┃ Total:             ┃
    ┃ Final × 1.1 / 2  ┃   ┃ Final × 1.2        ┃
    ┗━━━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━━━━━━┛

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 7: FINAL OUTPUT                                                    │
└──────────────────────────────────────────────────────────────────────────┘

    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃ QuoteResults                                                     ┃
    ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
    ┃                                                                  ┃
    ┃  • baseCostSegBid: $X,XXX                                       ┃
    ┃  • natLogQuote: $X,XXX                                          ┃
    ┃  • multiplePropertiesQuote: $X,XXX                              ┃
    ┃  • costMethodQuote: $X,XXX                                      ┃
    ┃  • finalBid: $X,XXX ← Selected quote                            ┃
    ┃  • payment5050: $X,XXX per payment                              ┃
    ┃  • paymentMonthly: $X,XXX total                                 ┃
    ┃  • factors: { ... all applied factors ... }                     ┃
    ┃                                                                  ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╔══════════════════════════════════════════════════════════════════════════╗
║                              EXAMPLE FLOW                                ║
╚══════════════════════════════════════════════════════════════════════════╝

Input: Multi-Family Property
  • Purchase Price: $2,550,000
  • Zip Code: 85260
  • SqFt: 1,500
  • Acres: 0.78
  • Floors: 2
  • Properties: 1
  • CapEx: $0

Step-by-Step Calculation:

  1. Factor Lookup:
     ├─ Cost Basis (N19): 1.3    (for $2.55M)
     ├─ Zip Code (N22): 1.08     (for 85260)
     ├─ SqFt (N25): 1.0          (for 1,500 sqft)
     ├─ Acres (N28): 0.85        (for 0.78 acres)
     ├─ Property Type (N31): 0.4 (Multi-Family)
     ├─ Floors (N34): 1.0        (2 floors)
     └─ Multi Props (N37): 1.0   (1 property)

  2. Base Calculation:
     ├─ A20 = $2,550,000 + $0 = $2,550,000
     ├─ A21 = ($2,550,000 × 0.0572355 × 0.25 × 0.08) + $4,000
     │      = $2,915.20625 + $4,000 = $6,915.21
     └─ C21 = $6,915.21 × 1.08 × 1.3 × 1.0 × 0.85 × 0.4 × 1.0
            = $3,319.55

  3. Alternative Quotes:
     ├─ Nat Log (C51): $3,319.54 (slightly reduced by sigmoid)
     ├─ Multi Props (D22): $3,319.55 (same as base, factor = 1.0)
     └─ Cost Method (AB26): $2,800.00 (estimated)

  4. Final Selection:
     ├─ MIN($3,319.55, $3,319.54, $3,319.55) = $3,319.54
     ├─ Is $3,319.54 < $2,800.00? NO
     └─ Final Bid = $3,319.54

  5. Payment Options:
     ├─ 50/50: $3,319.54 × 1.1 ÷ 2 = $1,825.75 per payment
     └─ Monthly: $3,319.54 × 1.2 = $3,983.45 total

╔══════════════════════════════════════════════════════════════════════════╗
║                         KEY FORMULA CONSTANTS                            ║
╚══════════════════════════════════════════════════════════════════════════╝

Base Bid Calculation (A21):
  • 0.0572355 ← Base rate coefficient
  • 0.25      ← Quarter multiplier
  • 0.08      ← 8% factor
  • 4000      ← Minimum base fee

Natural Log Quote (C51):
  • C42 = 2000  ← Threshold constant
  • C44 = 5     ← Decay rate
  • e = 2.71828 ← Euler's number

Payment Options:
  • 1.1  ← 10% markup for 50/50 split
  • 1.2  ← 20% markup for monthly payment

╔══════════════════════════════════════════════════════════════════════════╗
║                        PROPERTY TYPE IMPACTS                             ║
╚══════════════════════════════════════════════════════════════════════════╝

Same property with different types:

                        Factor    Impact on $10,000 Base Bid
  ─────────────────────────────────────────────────────────────
  Warehouse             0.4       $4,000  (60% discount)
  Multi-Family          0.4       $4,000  (60% discount)
  Residential/LTR       0.7       $7,000  (30% discount)
  Short-Term Rental     0.7       $7,000  (30% discount)
  Retail                0.85      $8,500  (15% discount)
  Office                1.0       $10,000 (no change)
  Other                 1.0       $10,000 (no change)
  Industrial            1.01      $10,100 (+1% premium)
  Medical               1.01      $10,100 (+1% premium)
  Restaurant            1.01      $10,100 (+1% premium)

Note: Multi-Family and Warehouse properties receive the largest
      discount (60%) because they typically have simpler cost
      segregation analysis requirements.

╔══════════════════════════════════════════════════════════════════════════╗
║                     MULTIPLE PROPERTIES DISCOUNT                         ║
╚══════════════════════════════════════════════════════════════════════════╝

Number of Properties → Discount Factor → Example ($10,000 base)

  1 property  → 1.00 (0% off)   → $10,000
  2 properties → 0.95 (5% off)   → $9,500 per property
  3 properties → 0.90 (10% off)  → $9,000 per property
  4 properties → 0.85 (15% off)  → $8,500 per property
  5 properties → 0.80 (20% off)  → $8,000 per property
  6+ properties → 0.75 (25% off)  → $7,500 per property

Total Revenue Example (3 properties):
  • Individual quotes: 3 × $10,000 = $30,000
  • With discount: 3 × $9,000 = $27,000
  • Discount given: $3,000 (10%)

╔══════════════════════════════════════════════════════════════════════════╗
║                           ERROR HANDLING                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

Validation Checks:
  ✓ Purchase price > $0
  ✓ Zip code in range 0-99,999
  ✓ SqFt building > 0
  ✓ Acres land ≥ 0
  ✓ Valid property type from list
  ✓ Number of floors ≥ 1
  ✓ Multiple properties ≥ 1
  ✓ CapEx ≥ 0

Default Handling:
  • Unknown property type → Factor 1.0
  • Floors > 12 → Use factor for 12
  • Properties > 6 → Use factor for 6
  • Values below table minimum → Use first factor
  • Values above table maximum → Use last factor

═══════════════════════════════════════════════════════════════════════════

Last Updated: October 20, 2025
Source: Base Pricing27.1_Pro_SMART_RCGV.xlsx
Implementation: src/lib/quote-engine/pricing-formulas.ts
```
