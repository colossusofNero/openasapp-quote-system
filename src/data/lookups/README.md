# VLOOKUP Tables - Pricing Factor Lookups

This directory contains pricing factor lookup tables extracted from the Excel workbook `Base Pricing27.1_Pro_SMART_RCGV.xlsx`.

## Extraction Date
**Generated:** 2025-10-20

## Source
**Excel File:** `reference/directory/Base Pricing27.1_Pro_SMART_RCGV.xlsx`
**Sheet:** VLOOKUP Tables
**Extraction Script:** `extract_vlookup_tables.py`

---

## JSON Files

### 1. `cost-basis-factors.json` (12 records)
**Purpose:** Pricing multiplier based on purchase price
**Usage:** Higher purchase prices get higher factors
**Structure:**
```json
{
  "purchasePrice": number,
  "factor": number
}
```

**Lookup Logic:** Use the highest threshold <= actual purchase price

**Sample:**
- $0: 1.0x
- $1,000,000: 1.075x
- $10,000,000: 1.5x

---

### 2. `zip-code-factors.json` (12 records)
**Purpose:** Regional pricing adjustment based on zip code
**Usage:** Geographic location affects pricing
**Structure:**
```json
{
  "zipCode": number,
  "factor": number
}
```

**Lookup Logic:** Use the highest threshold <= actual zip code

**Sample:**
- 0: 1.11x
- 50000: 1.06x
- 80000: 1.0x (base)

---

### 3. `sqft-factors.json` (12 records)
**Purpose:** Pricing multiplier based on building square footage
**Usage:** Larger buildings get higher factors
**Structure:**
```json
{
  "squareFeet": number | string,
  "factor": number
}
```

**Lookup Logic:** Use the highest threshold <= actual square footage

**Special Values:**
- `"55000+"`: Represents 55,000+ square feet (use for any value >= 55000)

**Sample:**
- 0: 1.0x
- 20,000: 1.1x
- 55,000+: 1.22x

---

### 4. `acres-factors.json` (12 records)
**Purpose:** Pricing adjustment based on land acreage
**Usage:** More land affects pricing (can reduce or increase)
**Structure:**
```json
{
  "acres": number | string,
  "factor": number
}
```

**Lookup Logic:** Use the highest threshold <= actual acreage

**Special Values:**
- `"9+"`: Represents 9+ acres (use for any value >= 9)

**Sample:**
- 0: 0.75x (discount for no/minimal land)
- 3: 1.0x (base)
- 9+: 1.3x

---

### 5. `property-type-factors.json` (10 records)
**Purpose:** Pricing multiplier based on property type
**Usage:** Different property types have different pricing complexities
**Structure:**
```json
{
  "propertyType": string,
  "factor": number
}
```

**Lookup Logic:** Exact match on property type string

**Property Types:**
| Property Type | Factor | Notes |
|--------------|--------|-------|
| Industrial | 1.01 | Slight premium |
| Medical | 1.01 | Slight premium |
| Office | 1.0 | Base rate |
| Other | 1.0 | Base rate |
| Restaurant | 1.01 | Slight premium |
| Retail | 0.85 | 15% discount |
| Warehouse | 0.4 | 60% discount |
| Multi-Family | 0.4 | 60% discount |
| Residential/LTR | 0.7 | 30% discount |
| Short-Term Rental | 0.7 | 30% discount |

---

### 6. `floor-factors.json` (12 records)
**Purpose:** Pricing multiplier based on number of floors
**Usage:** Multi-story buildings have higher complexity
**Structure:**
```json
{
  "numberOfFloors": number | string,
  "factor": number
}
```

**Lookup Logic:** Use the highest threshold <= actual floor count

**Special Values:**
- `"12+"`: Represents 12+ floors (use for any value >= 12)

**Sample:**
- 1: 1.0x
- 5: 1.1x
- 12+: 1.4x

---

### 7. `multiple-properties-factors.json` (7 records)
**Purpose:** Volume discount for multiple properties
**Usage:** More properties in one deal = lower per-property cost
**Structure:**
```json
{
  "propertyCount": number | string,
  "factor": number
}
```

**Lookup Logic:** Use exact match if possible, otherwise use "6+" for 6 or more properties

**Special Values:**
- `"6+"`: Represents 6 or more properties (use for any value >= 6)

**Sample:**
- 1: 1.0x (no discount)
- 3: 0.9x (10% discount)
- 6+: 0.8x (20% discount)

---

### 8. `property-types.json` (10 records)
**Purpose:** Property type mapping with codes and depreciation methods
**Usage:** Maps property type names to numeric codes and depreciation schedules
**Structure:**
```json
{
  "propertyType": string,
  "code": number,
  "depreciationMethod": number
}
```

**Depreciation Methods:**
- `1`: Likely represents 39-year depreciation schedule
- `2`: Likely represents 27.5-year depreciation schedule (residential)

**Mapping Table:**
| Property Type | Code | Depreciation Method |
|--------------|------|---------------------|
| Industrial | 1 | 2 |
| Medical | 2 | 2 |
| Office | 3 | 1 |
| Other | 4 | 2 |
| Restaurant | 5 | 2 |
| Retail | 6 | 2 |
| Warehouse | 7 | 2 |
| Multi-Family | 8 | 2 |
| Residential/LTR | 9 | 1 |
| Short-Term Rental | 10 | 2 |

---

## Combined Reference File

### `all-lookup-tables.json`
Contains all tables in a single JSON object for reference:
```json
{
  "cost_basis": [...],
  "zip_code": [...],
  "sqft": [...],
  "acres": [...],
  "property_type": [...],
  "floors": [...],
  "multiple_properties": [...],
  "property_type_mapping": [...]
}
```

---

## Database Seeding

These JSON files are designed for easy database import. Suggested table structures:

### SQL Schema Example

```sql
-- Cost Basis Factors
CREATE TABLE cost_basis_factors (
  id SERIAL PRIMARY KEY,
  purchase_price INTEGER NOT NULL,
  factor DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Zip Code Factors
CREATE TABLE zip_code_factors (
  id SERIAL PRIMARY KEY,
  zip_code INTEGER NOT NULL,
  factor DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Square Footage Factors
CREATE TABLE sqft_factors (
  id SERIAL PRIMARY KEY,
  square_feet VARCHAR(20) NOT NULL,  -- Handles "55000+" as string
  factor DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Acres Factors
CREATE TABLE acres_factors (
  id SERIAL PRIMARY KEY,
  acres VARCHAR(20) NOT NULL,  -- Handles "9+" as string
  factor DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property Type Factors
CREATE TABLE property_type_factors (
  id SERIAL PRIMARY KEY,
  property_type VARCHAR(50) UNIQUE NOT NULL,
  factor DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Floor Factors
CREATE TABLE floor_factors (
  id SERIAL PRIMARY KEY,
  number_of_floors VARCHAR(20) NOT NULL,  -- Handles "12+" as string
  factor DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Multiple Properties Factors
CREATE TABLE multiple_properties_factors (
  id SERIAL PRIMARY KEY,
  property_count VARCHAR(20) NOT NULL,  -- Handles "6+" as string
  factor DECIMAL(4,3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property Types (with mapping)
CREATE TABLE property_types (
  id SERIAL PRIMARY KEY,
  property_type VARCHAR(50) UNIQUE NOT NULL,
  code INTEGER NOT NULL,
  depreciation_method INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Notes

### VLOOKUP Behavior
In Excel, VLOOKUP with `FALSE` parameter finds exact matches, while `TRUE` finds the largest value less than or equal to the lookup value.

**For these tables:**
- **Exact Match:** `property_type_factors.json`, `property_types.json`
- **Range Match (<=):** All other tables (cost_basis, zip_code, sqft, acres, floors, multiple_properties)

### Handling Special Values
Some tables contain string values like "55000+" or "6+":
- These represent "or more" thresholds
- In code, check if the input value meets/exceeds the numeric part
- Example: If sqft is 60000, use the "55000+" factor (1.22)

### Lookup Example (TypeScript)
```typescript
function getCostBasisFactor(purchasePrice: number): number {
  const factors = costBasisFactors.sort((a, b) => b.purchasePrice - a.purchasePrice);

  for (const entry of factors) {
    if (purchasePrice >= entry.purchasePrice) {
      return entry.factor;
    }
  }

  return 1.0; // Default
}

function getPropertyTypeFactor(propertyType: string): number {
  const entry = propertyTypeFactors.find(f => f.propertyType === propertyType);
  return entry?.factor || 1.0;
}
```

---

## Validation

All data has been validated against the source Excel file:
- Numeric values preserved with correct precision
- String values preserved exactly (including special chars like "+")
- Property type names match exactly (case-sensitive)
- All 87 total records extracted successfully

---

## Change Log

### 2025-10-20 - Initial Extraction
- Extracted 7 factor tables from VLOOKUP Tables sheet
- Extracted property type mapping table
- Created structured JSON files for database seeding
- Validated all data against Excel source

---

## Contact

For questions about this data or the extraction process, refer to:
- **Source Excel:** `reference/directory/Base Pricing27.1_Pro_SMART_RCGV.xlsx`
- **Documentation:** `EXCEL_STRUCTURE_ANALYSIS.md`
- **Extraction Script:** `extract_vlookup_tables.py`
