# Excel Workbook Structure Analysis
## Base Pricing27.1_Pro_SMART_RCGV.xlsx

---

## Overview
This Excel workbook contains the complete business logic for generating cost segregation quotes. It handles two active product types: **RCGV** and **Pro** (SMART is deprecated).

---

## Sheet Structure

### 1. **Input Sheet** (Main Entry Point)
**Purpose:** Primary data entry for quote generation

**Key Inputs:**
- **B3:** Purchase Price (e.g., $2,550,000)
- **D3:** Zip Code (e.g., 85260)
- **F3:** SqFt Building (e.g., 1,500)
- **H3:** Acres Land (e.g., 0.78)
- **J3:** Type of Property (e.g., Multi-Family)
- **L3:** Number of Floors
- **N3:** Multiple Properties (count)
- **P3:** Date of Purchase
- **R3:** Tax Year (e.g., 2025)
- **P7:** Year Built
- **AA3:** CapEx (Capital Improvements)
- **B25:** Name of Property Owner
- **B28:** Address of Property

**Key Outputs/Calculations:**
- **B9:** Cost Seg Bid (from Equation Sheet)
- **B14:** Nat Log Quote
- **B15:** Final Bid (minimum of various calculations)
- **B17:** Final Bid
- **D17:** 50/50 payment option
- **F17:** Monthly payment option
- **B19-B22:** Various pricing tiers with markups

---

### 2. **VLOOKUP Tables** (Pricing Factors)
**Purpose:** Lookup tables for adjusting quote based on property characteristics

**Factor Tables:**
1. **Cost Basis Factor** (Column A-B)
   - $0 → 1.0x
   - $250k → 1.01x
   - $1M → 1.075x
   - $2M → 1.3x
   - $10M+ → 1.5x

2. **Zip Code Factor** (Column D-E)
   - Ranges from 0 to 99000
   - Multipliers: 1.0 to 1.11

3. **SqFt Factor** (Column G-H)
   - 0-55,000+ sqft
   - Multipliers: 1.0 to 1.22

4. **Acres Factor** (Column J-K)
   - 0-9+ acres
   - Multipliers: 0.75 to 1.3

5. **Property Type Factor** (Column M-N)
   - Industrial: 1.01
   - Medical: 1.01
   - Office: 1.0
   - Other: 1.0
   - Restaurant: 1.01
   - **Retail: 0.85** (discount)
   - **Warehouse: 0.4** (large discount)
   - **Multi-Family: 0.4** (large discount)
   - **Residential/LTR: 0.7**
   - **Short-Term Rental: 0.7**

6. **Number of Floors Factor** (Column P-Q)
   - 1 floor: 1.0
   - 3 floors: 1.05
   - 5+ floors: 1.1-1.4

7. **Multiple Properties** (Column S)
   - Pricing adjustments for 1-6+ properties

**Property Type Mapping (M21:O30):**
- Maps property type names to numeric codes
- Also includes a secondary factor column (Column O)

---

### 3. **Equation Sheet**
**Purpose:** Core pricing calculations and formulas

**Key Calculations:**
- **C21:** Base cost seg bid calculation
- **C51:** Natural log-based quote calculation
- **AB20-AB26:** Cost method calculations
- **S4:** Land value calculations

---

### 4. **YbyY data** (Year-by-Year Depreciation)
**Purpose:** Detailed depreciation schedules over time

**Key Elements:**
- **B1:** Purchase Price (links to Input Sheet B3)
- **B2:** Land value (links to Equation Sheet S4)
- **B3:** 1031 Accumulated Depreciation
- **B4:** CapEx
- **B5:** Building value (calculated)
- **A8:** Depreciation method (39 or 27.5 years)
- **A9:** Years calculation

**Depreciation Methods:**
- Column D-H: First depreciation method
- Column I-M: Second method
- Column N-R: Straight Line (SL) method
- Column S+: Third method

**Depreciation Rates:**
- Year 1: 20% or 0.2
- Year 2: 32% or 0.32
- Year 3: 19.2% or 0.192
- Year 4: 11.52% or 0.1152
- Year 5: 11.52% or 0.1152
- Year 6: 5.76% or 0.0576

---

### 5. **Printable Quote (RCGV)** ⭐
**Purpose:** Final formatted quote output for RCGV product

**Data Map (Row 1-2):**
- **A1-A2:** Company Name (from Input Sheet B25)
- **B1-B2:** Street Address (from Input Sheet B28)
- **C1-C2:** Zip Code (from Input Sheet D3)
- **D1-D2:** Purchase Price (from Input Sheet B3)
- **E1-E2:** Capital Improvements (from Input Sheet AA3)
- **F1-F2:** Building Value (calculated)
- **G1-G2:** Land Value
- **H1-H2:** Purchase Date (from Input Sheet P3)
- **I1-I2:** SqFt Building (from Input Sheet F3)
- **J1-J2:** Acres Land (from Input Sheet H3)
- **K1-K2:** Year Built (from Input Sheet P7)
- **L1-L2:** Bid Amount Original (from B40)
- **M1-M2:** Pay Upfront (from B42)
- **N1-N2:** Pay 50/50 (from B44)
- **O1-O2:** Pay Over Time (from B47)
- **P1-P2:** Rush Fee (from C40)
- **Q1-Q2:** Multiple Properties (from Input Sheet N3)
- **R1-R2:** Bonus Quote (from I7)
- **S1-S2:** Tax Year (from F7)

**Comparison Table (Rows 5-21):**
- **Column F:** Cost Seg Estimates by year
- **Column G:** Standard Depreciation
- **Column H:** Traditional Cost Seg
- **Column I:** Bonus Depreciation

References YbyY data for year-by-year projections using formulas like:
```
=IF('YbyY data'!$A$9=39,'YbyY data'!FV5,'YbyY data'!...)
```

---

### 6. **Printable Quote (PRO)** ⭐
**Purpose:** Final formatted quote output for Pro product

Similar structure to RCGV quote but with Pro-specific calculations and formatting.

---

### 7. **Printable Quote (SMART)** ❌ (Deprecated)
**Purpose:** Legacy quote format - no longer in use

---

### 8. **Estimate Factor**
**Purpose:** Contains estimation multipliers and adjustment factors

---

### 9. **Catchup & Catchup27.5**
**Purpose:** Handles catch-up depreciation calculations for different depreciation schedules

---

### 10. **Sheet1 & Sheet2**
**Purpose:** Utility/working sheets

---

## Key Business Logic Flow

```
1. User enters property data in "Input Sheet"
   ├─ Purchase Price, Zip, SqFt, Acres, Property Type, etc.
   │
2. "VLOOKUP Tables" provide adjustment factors
   ├─ Based on cost basis, location, size, property type
   │
3. "Equation Sheet" performs core calculations
   ├─ Applies factors to base pricing
   ├─ Generates multiple quote options
   │
4. "YbyY data" calculates depreciation schedules
   ├─ Compares different depreciation methods
   ├─ Projects savings over time
   │
5. "Printable Quote" sheets format final output
   ├─ RCGV version
   ├─ Pro version
   └─ Shows payment options and savings projections
```

---

## Pricing Calculation Components

### Base Quote Calculation
1. Start with base pricing from Equation Sheet
2. Apply VLOOKUP factors:
   - Cost Basis Factor
   - Zip Code Factor
   - SqFt Factor
   - Acres Factor
   - Property Type Factor
   - Number of Floors Factor
3. Consider multiple properties discount
4. Calculate payment options:
   - **Upfront:** Base price × 0.95
   - **50/50:** Base price × 1.1 ÷ 2
   - **Monthly:** Base price × 1.2

### Minimum Quote Logic
The system compares multiple quote methods and selects the appropriate one:
- Cost Seg Bid (B9)
- Natural Log Quote (B14)
- Multiple Properties Quote (D11)
- Cost Method Quote (D14)

Formula: `=IF(MIN(B9,B14,D11)<D14,D14,MIN(B9,B14,D11))`

---

## Active Product Lines

### ✅ RCGV
- Full cost segregation analysis
- Detailed depreciation schedules
- Payment flexibility

### ✅ Pro
- Professional-tier analysis
- Enhanced reporting
- Premium pricing

### ❌ SMART (Deprecated)
- No longer offered
- Legacy sheets remain for reference

---

## Critical Formulas to Preserve

1. **Building Value Calculation:**
   ```
   =Purchase_Price - Land - 1031_Acc_Dep + CapEx
   ```

2. **Depreciation Method Selection:**
   ```
   =VLOOKUP(Property_Type, Catchup!AR22:AS31, 2, FALSE)
   ```
   Returns either 0.1 (39-year) or other factor (27.5-year)

3. **Year-by-Year Depreciation:**
   ```
   Year 1: Building_Value × 0.2
   Year 2: Remaining × 0.32
   Year 3: Remaining × 0.192
   etc.
   ```

---

## Data Validation Rules

Based on the VLOOKUP tables, the system expects:

### Property Types (Exact Match Required):
- Industrial
- Medical
- Office
- Other
- Restaurant
- Retail
- Warehouse
- Multi-Family
- Residential/LTR
- Short-Term Rental

### Numeric Ranges:
- **Purchase Price:** $0 - $10M+ (higher values use max factor)
- **Zip Code:** 0 - 99000
- **SqFt:** 0 - 55,000+
- **Acres:** 0 - 9+
- **Floors:** 1 - 12+
- **Properties:** 1 - 6+
- **Tax Year:** Any year (e.g., 2025)

---

## Implementation Priority

### Phase 1: Core Input/Output
1. ✅ Capture all Input Sheet fields
2. ✅ Store VLOOKUP tables in database
3. ✅ Implement quote calculation engine
4. ✅ Generate RCGV quotes
5. ✅ Generate Pro quotes

### Phase 2: Advanced Features
1. Year-by-year depreciation projections
2. Multiple payment options
3. PDF quote generation
4. Comparison tables

### Phase 3: Enhancements
1. Historical quote tracking
2. Template system
3. Batch quote generation
4. API for ChatGPT integration

---

## Notes

- **SMART product is deprecated** - ignore all SMART-related sheets
- Focus implementation on **RCGV** and **Pro** printable quotes
- The Excel uses array formulas and complex VLOOKUP chains
- Depreciation calculations depend on property type and year built
- Payment options are calculated as multipliers of the base quote
- Rush fees and multiple property discounts are additive

---

## Next Steps for Development

1. **Extract VLOOKUP tables** → Seed database tables
2. **Map Input Sheet fields** → Create input form/API
3. **Convert Equation Sheet formulas** → Business logic layer
4. **Replicate YbyY calculations** → Depreciation service
5. **Format Printable Quotes** → PDF template engine
6. **Implement for RCGV first**, then Pro
7. **Ignore SMART** completely

---

**Last Updated:** 2025-10-20
**Source File:** `reference/directory/Base Pricing27.1_Pro_SMART_RCGV.xlsx`
