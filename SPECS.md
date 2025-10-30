# Quote Form Specification

## Reference Source
- **Original app:** OpenAsApp "Quote" (ID `fd467c6b-9223-44ed-9e0e-c2928bf5f5e1`).
- **Access status:** The hosted portal returned HTTP 403 from the container environment. Specification below is derived from exported Excel logic (`Base Pricing27.1_Pro_SMART_RCGV.xlsx`) and accompanying documentation inside this repository.
- **Parity intent:** Match the data model, validation, and pricing formulas observed in the OpenAsApp implementation.

## Field Inventory
| Key | UI Label | Control | Placeholder / Formatting | Required | Default | Validation Rules | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `prospectName` | Name of Prospect | Text input | `Valued Client` | Yes | – | 3–120 chars | Rendered in the summary hero. |
| `propertyAddress` | Address of Property | Text input | `123 Main St, Yourtown, US 85260` | Yes | – | 5–200 chars | Used verbatim on preview card. |
| `zipCode` | ZIP Code | Text input | `85260` | Yes | – | Exactly 5 digits | Leading zeros preserved. |
| `taxYear` | Tax Year | Numeric input | `2025` | Yes | Current year | Integer 2000–2100 | |
| `taxDeadline` | Tax Deadline | Select dropdown | Month names | Yes | `October` | Must be one of the 12 months | Mirrors OpenAsApp list. |
| `purchasePrice` | Purchase Price | Currency input | `$0.00` | Yes | – | 50,000–50,000,000 | Prefixed with `$` styling. |
| `hasCapitalImprovements` | Capital Improvements | Segmented select (Yes/No) | `No` | Yes | `No` | Boolean | When “Yes”, show amount input. |
| `capitalImprovementsAmount` | Capital Improvements Amount | Currency input | `$0.00` | Conditionally | 0 | 0–10,000,000 | Required and enabled when `hasCapitalImprovements` is `Yes`. |
| `landValuePercent` | Land Value | Numeric input | `10` | Yes | 10 | Percentage 0–80 (2 decimals) | Displayed with `%` suffix. |
| `is1031Exchange` | 1031 Exchange? | Segmented select (Yes/No) | `No` | Yes | `No` | Boolean | When “Yes”, require accumulated depreciation. |
| `accumulated1031Depreciation` | 1031 Accumulated Depreciation | Currency input | `$0.00` | Conditionally | 0 | 0–10,000,000 | Only enabled when `is1031Exchange` is `Yes`. |
| `sqftBuilding` | SqFt Building | Numeric input | `1500` | Yes | – | Integer 100–1,000,000 | |
| `acresLand` | Acres Land | Numeric input | `0.78` | Yes | 0.5 | 0.01–100 (2 decimals) | |
| `propertyType` | Type of Property | Select dropdown | – | Yes | `Multi-Family` | One of PROPERTY_TYPES | |
| `numberOfFloors` | Number of Floors | Numeric input | `1` | Yes | 1 | Integer 1–40 | |
| `multipleProperties` | Multiple Properties? | Numeric input | `1` | Yes | 1 | Integer 1–50 | Controls multi-property discount. |
| `needRush` | Need a Rush? | Select dropdown | `No Rush` | Yes | `no_rush` | Enum (`no_rush`, `rush`) | Rush adds $1,500 fee. |
| `yearBuilt` | Year Built | Numeric input | `2024` | Yes | Current year | Integer 1900–current year | |
| `priceOverride` | Price Override | Segmented select | `No` | Yes | `No` | Boolean | Enables manual final bid. |
| `overrideAmount` | Override Amount | Currency input | `$0.00` | Conditionally | – | 1,000–1,000,000 | Required when `priceOverride` is `Yes`. |

### Required / Optional Indicators
- Required fields show a red asterisk (`*`) after the label, matching OpenAsApp styling.
- Optional fields show `(optional)` in muted text.

### Error Messaging Conventions
- Inline error appears beneath each field using the copy “Please enter a valid …” with specifics from validation schema.
- Submit button remains disabled until the form is dirtied and valid.
- On submission attempt with errors, scroll to the first invalid field.

## Validation Summary
- Zod coercion converts all numeric inputs (currency, integer, percentage) and enforces the ranges listed above.
- ZIP code, tax year, and year built validations preserve leading zeros and produce user-friendly error messages.
- Selecting “Yes” for Capital Improvements or 1031 Exchange enables companion amount fields, which must then be greater than zero.
- Price Override toggles require a valid override amount; when “No” the value is cleared to avoid stale overrides.
- Currency inputs are stored as numbers, surfaced with two-decimal formatting in the UI and summary view.

## Submission Hand-off
- `/quote/preview` shows a “Email this quote to RCG” call-to-action that opens a `mailto:quotes@rcgv.com` draft populated with key inputs (prospect, property, tax info, rush flag) and the calculated final bid.
- Clicking “Start a new quote” clears the session-stored payload so quotes aren’t retained in the browser—long-term storage happens in backend systems.

## Calculation Model
All pricing calculations live in `lib/quoteMath.ts` as pure functions and are reused by UI and tests. Constants originate from `Base Pricing27.1_Pro_SMART_RCGV.xlsx` and the internal docs.

1. **Lookup Factors**
   - **Cost Basis:** Same tiering as the Excel sheet (0 → 1.0 … ≥10M → 1.5).
   - **ZIP Code:** Uses the first two digits; Arizona prefix 85 receives a 0.99 factor, NYC prefix 10 gets 1.11.
   - **SqFt:** Starts at 1.0101 for sub-2.5k sqft, then climbs through 1.24 for ≥55k sqft.
   - **Acres:** 0 → 0.75, 0.25 → 0.85, 0.8 → 0.9, 1.5 → 0.95 … 12+ → 1.2.
   - **Property Type / Floors / Multiple Properties:** Same categories as OpenAsApp; floors top out at 1.22 for 10+ stories, multi-property discounts floor at 0.75 for 6+.

2. **Base Cost Segregation Bid**
   - `AdjustedPrice = purchasePrice + (hasCapitalImprovements ? capitalImprovementsAmount : 0)`
   - `A21 = (AdjustedPrice × 0.0572355 × 0.25 × 0.08) + 4,000`
   - `BaseBid = A21 × costBasis × zip × sqft × acres × propertyType × floors`

3. **Natural Log Quote**
   - Same sigmoid smoothing as Excel using constants C42 = 2000 and C44 = 5.

4. **Multiple Properties Quote**
   - Applies the lookup discount factor directly: `Multi = BaseBid × multiplePropertiesFactor`.

5. **Cost Method Quote**
   - Simplified floor: `CostMethod = max(round(BaseBid × 1.1, 2), 3300)`.

6. **Final Bid Selection & Adjustments**
   - `candidateMin = min(BaseBid, NatLog, Multi)`
   - `preferred = candidateMin < CostMethod ? CostMethod : candidateMin`
   - Manual override wins if present; a rush fee of $1,500 is then added when `needRush = rush`.

7. **Payment Options**
   - 50/50 plan mirrors the base bid (`total = BaseBid`, `installment = total / 2`).
   - Monthly plan adds a 20% premium (`MonthlyTotal = FinalBid × 1.2`, `MonthlyInstallment = MonthlyTotal / 12`).

8. **Bonus Depreciation Snapshot**
   - Land value = `purchasePrice × landValuePercent / 100`.
   - Building value subtracts land and 1031 depreciation, adds capital improvements.
  - Bonus depreciation = `buildingValue × 0.2481145969` (80% bonus × ~31% effective capture).

## Sample Scenarios
The following scenarios will be used for automated tests (`lib/quoteMath.test.ts`). Amounts are rounded to the nearest dollar.

### Scenario A – Multi-Family (Scottsdale, AZ)
| Field | Value |
| --- | --- |
| Prospect | Valued Client |
| Address | 123 Main St, Yourtown, US 85260 |
| ZIP | 85260 |
| Purchase Price | $2,550,000 |
| Capital Improvements | No (Amount $0) |
| Land Value | 10% |
| 1031 Exchange | No |
| Building SqFt | 1,500 |
| Acres | 0.78 |
| Property Type | Multi-Family |
| Floors | 1 |
| Multiple Properties | 1 |
| Tax Year / Deadline | 2025 • October |
| Need a Rush? | No |
| Year Built | 2024 |

**Expected Outputs**
- Base Cost Seg Bid: **$3,058.20**
- Natural Log Quote: **$3,042.87**
- Multiple Properties Quote: **$3,058.20**
- Cost Method Quote: **$3,364.02**
- Final Bid: **$3,364.02**
- 50/50 Plan: **$3,058.20** total (**$1,529.10** × 2)
- Monthly Plan: **$4,036.82** total (**$336.40** × 12)
- Bonus Depreciation: **$569,423**

### Scenario B – Office (New York, NY)
| Field | Value |
| --- | --- |
| Prospect | NYC Properties Inc |
| Address | 456 Broadway, New York, NY 10001 |
| ZIP | 10001 |
| Purchase Price | $5,000,000 |
| Capital Improvements | Yes (Amount $250,000) |
| Land Value | 18% |
| 1031 Exchange | No |
| Building SqFt | 25,000 |
| Acres | 2.0 |
| Property Type | Office |
| Floors | 5 |
| Multiple Properties | 1 |
| Tax Year / Deadline | 2025 • March |
| Need a Rush? | No |
| Year Built | 2015 |

**Expected Outputs**
- Base Cost Seg Bid: **$19,364.25**
- Natural Log Quote: **$19,364.25**
- Multiple Properties Quote: **$19,364.25**
- Cost Method Quote: **$21,300.68**
- Final Bid: **$21,300.68**
- 50/50 Plan: **$19,364.25** total (**$9,682.13** × 2)
- Monthly Plan: **$25,560.82** total (**$2,130.07** × 12)
- Bonus Depreciation: **$1,079,298.50**

> **Assumptions:** Cost method constants are inferred from documentation and tuned to ensure the floor behavior observed in OpenAsApp spreadsheets. Any discrepancies once granted direct app access should be reconciled by updating `quoteMath.ts` and this specification.
