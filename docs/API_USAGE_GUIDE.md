# API Usage Guide - Quote Generation API

## Overview

This guide provides practical examples for using the OpenAsApp Quote Generation API. All examples use cURL for simplicity, but you can adapt them to any HTTP client.

---

## Base URLs

```bash
# Local Development
BASE_URL="http://localhost:3000/api"

# Staging
BASE_URL="https://staging-api.openasapp.com/v1"

# Production
BASE_URL="https://api.openasapp.com/v1"
```

---

## Authentication

Most endpoints require authentication. For development, you can skip authentication (it's marked as TODO in the code). In production, use NextAuth.js JWT tokens.

```bash
# Get your token from NextAuth.js
TOKEN="your_jwt_token_here"

# Use in requests
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/quotes
```

---

## Endpoint Examples

### 1. Calculate Quote (No Save) - Public Endpoint

Calculate a quote without saving it to the database. Perfect for quick estimates and ChatGPT integration.

**No authentication required.**

```bash
# Basic Multi-Family Property Quote
curl -X POST $BASE_URL/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 2550000,
    "zipCode": "85260",
    "sqFtBuilding": 1500,
    "acresLand": 0.78,
    "propertyType": "Multi-Family",
    "numberOfFloors": 2,
    "multipleProperties": 1,
    "dateOfPurchase": "2024-01-15",
    "taxYear": 2025,
    "yearBuilt": 2010,
    "capEx": 50000,
    "quoteType": "RCGV",
    "rushFee": false
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bidAmount": 38250,
    "landValue": 78000,
    "buildingValue": 2522000,
    "paymentOptions": {
      "upfront": {
        "amount": 36337.5,
        "discount": 5
      },
      "fiftyFifty": {
        "firstPayment": 21037.5,
        "secondPayment": 21037.5,
        "total": 42075
      },
      "monthly": {
        "monthlyAmount": 3825,
        "numberOfMonths": 12,
        "total": 45900
      }
    },
    "appliedFactors": {
      "costBasisFactor": 1.3,
      "zipCodeFactor": 1.11,
      "sqFtFactor": 1.0,
      "acresFactor": 0.75,
      "propertyTypeFactor": 0.4,
      "floorsFactor": 1.0
    },
    "depreciationSummary": {
      "method": "27.5-year",
      "year1": 504400,
      "year2": 807040,
      "year3": 484224,
      "year4": 290534.4,
      "year5": 290534.4,
      "year6": 145267.2,
      "totalTax": 755280
    },
    "quoteType": "RCGV",
    "calculatedAt": "2024-10-20T12:00:00Z",
    "note": "This is a calculation preview. Use POST /api/quotes to save the quote."
  },
  "meta": {
    "timestamp": "2024-10-20T12:00:00Z",
    "version": "1.0"
  }
}
```

---

### 2. Create and Save Quote - Authenticated

Create a quote and save it to the database for the authenticated user.

```bash
# Commercial Office Building with Rush Fee
curl -X POST $BASE_URL/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "purchasePrice": 5000000,
    "zipCode": "90210",
    "sqFtBuilding": 25000,
    "acresLand": 2.5,
    "propertyType": "Office",
    "numberOfFloors": 5,
    "multipleProperties": 1,
    "dateOfPurchase": "2024-03-01",
    "taxYear": 2024,
    "yearBuilt": 2015,
    "capEx": 100000,
    "propertyOwnerName": "Beverly Hills Office LLC",
    "propertyAddress": "456 Rodeo Dr, Beverly Hills, CA 90210",
    "quoteType": "Pro",
    "rushFee": true,
    "notes": "Client needs expedited service"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "input": { ... },
    "output": { ... },
    "status": "draft",
    "createdAt": "2024-10-20T12:00:00Z",
    "updatedAt": "2024-10-20T12:00:00Z",
    "userId": "user_123"
  },
  "meta": {
    "timestamp": "2024-10-20T12:00:00Z",
    "version": "1.0"
  }
}
```

---

### 3. Warehouse Property (Large Discount)

Warehouse properties receive a 60% discount (0.4x factor).

```bash
curl -X POST $BASE_URL/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 3000000,
    "zipCode": "75001",
    "sqFtBuilding": 50000,
    "acresLand": 5.0,
    "propertyType": "Warehouse",
    "numberOfFloors": 1,
    "multipleProperties": 1,
    "dateOfPurchase": "2024-02-10",
    "taxYear": 2024,
    "yearBuilt": 2018,
    "capEx": 0,
    "quoteType": "RCGV",
    "rushFee": false
  }'
```

---

### 4. Multiple Properties (Volume Discount)

Quoting 6 properties gets an additional 30% discount.

```bash
curl -X POST $BASE_URL/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 1500000,
    "zipCode": "33101",
    "sqFtBuilding": 10000,
    "acresLand": 1.2,
    "propertyType": "Retail",
    "numberOfFloors": 2,
    "multipleProperties": 6,
    "dateOfPurchase": "2024-04-01",
    "taxYear": 2024,
    "yearBuilt": 2012,
    "capEx": 25000,
    "quoteType": "RCGV",
    "rushFee": false
  }'
```

---

### 5. Get Quote by ID - Authenticated

Retrieve a specific quote by its UUID.

```bash
curl $BASE_URL/quotes/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "input": { ... },
    "output": { ... },
    "status": "draft",
    "createdAt": "2024-10-20T12:00:00Z",
    "updatedAt": "2024-10-20T12:00:00Z",
    "userId": "user_123"
  }
}
```

---

### 6. List All Quotes - Authenticated

List quotes with pagination, filtering, and sorting.

```bash
# Get first 20 draft quotes, sorted by creation date (newest first)
curl "$BASE_URL/quotes?page=1&limit=20&status=draft&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN"

# Search for quotes by client name
curl "$BASE_URL/quotes?search=Acme" \
  -H "Authorization: Bearer $TOKEN"

# Filter by quote type
curl "$BASE_URL/quotes?quoteType=Pro" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quotes": [
      { "id": "...", "input": { ... }, "output": { ... } },
      { "id": "...", "input": { ... }, "output": { ... } }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

---

### 7. Update Quote Status - Authenticated

Change the status of a quote (e.g., from draft to sent).

```bash
curl -X PATCH $BASE_URL/quotes/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "sent"}'
```

---

### 8. Update Quote Input - Authenticated

Update the quote input data. This triggers automatic recalculation.

```bash
curl -X PATCH $BASE_URL/quotes/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "input": {
      "purchasePrice": 2750000,
      "capEx": 75000
    }
  }'
```

---

### 9. Delete Quote - Authenticated

Permanently delete a quote.

```bash
curl -X DELETE $BASE_URL/quotes/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Quote deleted successfully",
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

---

### 10. Get Pricing Factors - Public Endpoint

Retrieve all lookup tables and pricing factors.

**No authentication required.**

```bash
curl $BASE_URL/quotes/factors
```

**Response:**
```json
{
  "success": true,
  "data": {
    "factors": {
      "costBasisFactors": [
        { "minValue": 0, "maxValue": 250000, "factor": 1.0 },
        { "minValue": 250000, "maxValue": 1000000, "factor": 1.01 },
        { "minValue": 1000000, "maxValue": 2000000, "factor": 1.075 },
        { "minValue": 2000000, "maxValue": 10000000, "factor": 1.3 },
        { "minValue": 10000000, "maxValue": null, "factor": 1.5 }
      ],
      "zipCodeFactors": [
        { "minZip": 0, "maxZip": 69999, "factor": 1.0 },
        { "minZip": 70000, "maxZip": 79999, "factor": 1.05 },
        { "minZip": 80000, "maxZip": 89999, "factor": 1.08 },
        { "minZip": 90000, "maxZip": 99999, "factor": 1.11 }
      ],
      "propertyTypeFactors": {
        "Industrial": 1.01,
        "Medical": 1.01,
        "Office": 1.0,
        "Other": 1.0,
        "Restaurant": 1.01,
        "Retail": 0.85,
        "Warehouse": 0.4,
        "Multi-Family": 0.4,
        "Residential/LTR": 0.7,
        "Short-Term Rental": 0.7
      },
      "sqFtFactors": [...],
      "acresFactors": [...],
      "floorsFactors": [...],
      "multiplePropertiesFactors": [...]
    },
    "metadata": {
      "description": "Pricing factors based on Excel workbook: Base Pricing27.1_Pro_SMART_RCGV.xlsx",
      "version": "27.1",
      "lastUpdated": "2025-10-20",
      "source": "VLOOKUP Tables sheet"
    }
  }
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "purchasePrice",
        "message": "Purchase price must be positive",
        "code": "too_small"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-10-20T12:00:00Z",
    "version": "1.0"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid input data
- `BAD_REQUEST` (400) - Malformed request
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Access denied
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service down

---

## Property Types and Factors

### Understanding Property Type Discounts

Property types have different factors that significantly affect the quote:

| Property Type | Factor | Discount | Depreciation Method |
|--------------|--------|----------|---------------------|
| **Warehouse** | 0.4 | **60%** | 39-year |
| **Multi-Family** | 0.4 | **60%** | 27.5-year |
| **Residential/LTR** | 0.7 | 30% | 27.5-year |
| **Short-Term Rental** | 0.7 | 30% | 27.5-year |
| **Retail** | 0.85 | 15% | 39-year |
| Office | 1.0 | 0% | 39-year |
| Industrial | 1.01 | -1% (premium) | 39-year |
| Medical | 1.01 | -1% (premium) | 39-year |
| Restaurant | 1.01 | -1% (premium) | 39-year |

**Key Insight:** Warehouse and Multi-Family properties get the largest discounts because they typically have simpler cost segregation analysis.

---

## Advanced Examples

### Example 1: High-Rise Office Building

```bash
curl -X POST $BASE_URL/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 15000000,
    "zipCode": "10001",
    "sqFtBuilding": 75000,
    "acresLand": 0.5,
    "propertyType": "Office",
    "numberOfFloors": 12,
    "multipleProperties": 1,
    "dateOfPurchase": "2024-05-01",
    "taxYear": 2024,
    "yearBuilt": 2020,
    "capEx": 250000,
    "quoteType": "Pro",
    "rushFee": false
  }'
```

**Factors Applied:**
- Cost Basis: 1.5x (>$10M)
- ZIP Code: 1.0x (10001)
- SqFt: 1.22x (75,000 sqft)
- Acres: 0.75x (<1 acre)
- Property Type: 1.0x (Office)
- Floors: 1.4x (12 floors)

**Combined Factor:** 1.5 × 1.0 × 1.22 × 0.75 × 1.0 × 1.4 = **1.92x**

---

### Example 2: Property with 1031 Exchange

```bash
curl -X POST $BASE_URL/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 4000000,
    "zipCode": "78701",
    "sqFtBuilding": 20000,
    "acresLand": 1.5,
    "propertyType": "Retail",
    "numberOfFloors": 2,
    "multipleProperties": 1,
    "dateOfPurchase": "2024-06-15",
    "taxYear": 2024,
    "yearBuilt": 2008,
    "capEx": 150000,
    "accumulated1031Depreciation": 500000,
    "quoteType": "RCGV",
    "rushFee": false
  }'
```

**Note:** The `accumulated1031Depreciation` reduces the building value, which affects depreciation calculations.

---

### Example 3: Medical Office Complex

```bash
curl -X POST $BASE_URL/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 7500000,
    "zipCode": "94102",
    "sqFtBuilding": 35000,
    "acresLand": 3.0,
    "propertyType": "Medical",
    "numberOfFloors": 4,
    "multipleProperties": 1,
    "dateOfPurchase": "2024-07-01",
    "taxYear": 2024,
    "yearBuilt": 2016,
    "capEx": 200000,
    "quoteType": "Pro",
    "rushFee": true
  }'
```

**Rush Fee:** +15% on the final bid amount

---

## Integration Examples

### JavaScript/TypeScript (fetch)

```typescript
async function calculateQuote(input: CalculateQuoteInput) {
  const response = await fetch(`${BASE_URL}/quotes/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const result = await response.json();
  return result.data;
}

// Usage
const quote = await calculateQuote({
  purchasePrice: 2550000,
  zipCode: '85260',
  sqFtBuilding: 1500,
  acresLand: 0.78,
  propertyType: 'Multi-Family',
  numberOfFloors: 2,
  multipleProperties: 1,
  dateOfPurchase: '2024-01-15',
  taxYear: 2025,
  yearBuilt: 2010,
  capEx: 50000,
  quoteType: 'RCGV',
  rushFee: false,
});

console.log(`Bid Amount: $${quote.bidAmount.toLocaleString()}`);
console.log(`Upfront Payment: $${quote.paymentOptions.upfront.amount.toLocaleString()}`);
```

---

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:3000/api"

def calculate_quote(input_data):
    response = requests.post(
        f"{BASE_URL}/quotes/calculate",
        json=input_data
    )
    response.raise_for_status()
    return response.json()["data"]

# Usage
quote = calculate_quote({
    "purchasePrice": 2550000,
    "zipCode": "85260",
    "sqFtBuilding": 1500,
    "acresLand": 0.78,
    "propertyType": "Multi-Family",
    "numberOfFloors": 2,
    "multipleProperties": 1,
    "dateOfPurchase": "2024-01-15",
    "taxYear": 2025,
    "yearBuilt": 2010,
    "capEx": 50000,
    "quoteType": "RCGV",
    "rushFee": False
})

print(f"Bid Amount: ${quote['bidAmount']:,.2f}")
print(f"Upfront Payment: ${quote['paymentOptions']['upfront']['amount']:,.2f}")
```

---

## ChatGPT Integration

### GPT Action Schema Snippet

```yaml
openapi: 3.0.0
info:
  title: Quote Calculator
  version: 1.0.0
servers:
  - url: https://api.openasapp.com/v1
paths:
  /quotes/calculate:
    post:
      operationId: calculateQuote
      summary: Calculate a cost segregation quote
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - purchasePrice
                - zipCode
                - sqFtBuilding
                - acresLand
                - propertyType
                - numberOfFloors
                - dateOfPurchase
                - taxYear
                - yearBuilt
              properties:
                purchasePrice:
                  type: number
                zipCode:
                  type: string
                # ... other properties
```

### GPT Instructions

```
You are a cost segregation quote assistant. When a user provides property details:

1. Use the calculateQuote action to get pricing
2. Present the results clearly:
   - Bid amount
   - Payment options (upfront, 50/50, monthly)
   - Estimated tax savings over 6 years
3. Explain which factors affected the quote
4. Suggest optimizations if applicable
```

---

## Testing

### Test with Different Property Types

```bash
# Test all property types
for type in "Industrial" "Medical" "Office" "Retail" "Warehouse" "Multi-Family" "Residential/LTR" "Short-Term Rental"; do
  echo "Testing: $type"
  curl -X POST $BASE_URL/quotes/calculate \
    -H "Content-Type: application/json" \
    -d "{
      \"purchasePrice\": 2000000,
      \"zipCode\": \"85260\",
      \"sqFtBuilding\": 10000,
      \"acresLand\": 1.0,
      \"propertyType\": \"$type\",
      \"numberOfFloors\": 2,
      \"multipleProperties\": 1,
      \"dateOfPurchase\": \"2024-01-15\",
      \"taxYear\": 2024,
      \"yearBuilt\": 2010,
      \"capEx\": 0,
      \"quoteType\": \"RCGV\",
      \"rushFee\": false
    }" | jq '.data.bidAmount'
done
```

---

## Rate Limits

- **Authenticated Users:** 1000 requests/hour
- **Public Endpoints:** 100 requests/hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1634567890
```

---

## Support

For API support:
- Email: support@openasapp.com
- Documentation: https://docs.openasapp.com
- GitHub Issues: https://github.com/openasapp/api/issues

---

**Last Updated:** 2024-10-20
**API Version:** 1.0
