# OpenAsApp API Documentation

## Quick Links

- **[API Usage Guide](./API_USAGE_GUIDE.md)** - Complete guide with cURL examples
- **[Implementation Summary](./API_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[OpenAPI Specification](./api-spec.yaml)** - Swagger/OpenAPI 3.0 spec

---

## Overview

The OpenAsApp Quote Generation API provides endpoints for creating, managing, and calculating cost segregation quotes for commercial and residential properties.

**Key Features:**
- RCGV and Pro quote types
- Real-time quote calculations
- Multiple payment options (upfront, 50/50, monthly)
- Year-by-year depreciation schedules
- Transparent pricing factors
- ChatGPT Actions compatible

---

## Quick Start

### 1. Calculate a Quote (No Auth Required)

```bash
curl -X POST http://localhost:3000/api/quotes/calculate \
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

### 2. Get Pricing Factors (No Auth Required)

```bash
curl http://localhost:3000/api/quotes/factors
```

### 3. Create and Save Quote (Auth Required)

```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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
    "propertyOwnerName": "Acme Properties LLC",
    "propertyAddress": "123 Main St, Scottsdale, AZ 85260",
    "quoteType": "RCGV",
    "rushFee": false
  }'
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/quotes` | ✓ | Create and save a quote |
| GET | `/api/quotes` | ✓ | List all quotes (paginated) |
| GET | `/api/quotes/:id` | ✓ | Get quote by ID |
| PATCH | `/api/quotes/:id` | ✓ | Update quote |
| DELETE | `/api/quotes/:id` | ✓ | Delete quote |
| POST | `/api/quotes/calculate` | ✗ | Calculate quote (no save) |
| GET | `/api/quotes/factors` | ✗ | Get pricing factors |

---

## Property Types

| Type | Factor | Discount | Depreciation |
|------|--------|----------|--------------|
| Warehouse | 0.4 | 60% | 39-year |
| Multi-Family | 0.4 | 60% | 27.5-year |
| Residential/LTR | 0.7 | 30% | 27.5-year |
| Short-Term Rental | 0.7 | 30% | 27.5-year |
| Retail | 0.85 | 15% | 39-year |
| Office | 1.0 | 0% | 39-year |
| Industrial | 1.01 | -1% | 39-year |
| Medical | 1.01 | -1% | 39-year |
| Restaurant | 1.01 | -1% | 39-year |
| Other | 1.0 | 0% | 39-year |

---

## Response Format

All endpoints return a consistent JSON format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-10-20T12:00:00Z",
    "version": "1.0"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [...]
  },
  "meta": {
    "timestamp": "2024-10-20T12:00:00Z",
    "version": "1.0"
  }
}
```

---

## Payment Options

All quotes include three payment options:

### 1. Upfront Payment (5% Discount)
```
Amount: Bid × 0.95
Discount: 5%
```

### 2. 50/50 Split (10% Premium)
```
First Payment: Bid × 1.1 ÷ 2
Second Payment: Bid × 1.1 ÷ 2
Total: Bid × 1.1
```

### 3. Monthly Payments (20% Premium)
```
Monthly Amount: Bid × 1.2 ÷ 12
Number of Months: 12
Total: Bid × 1.2
```

---

## Pricing Factors

Quotes are calculated using multiple factors:

### Cost Basis Factor
- $0 - $250K: 1.0x
- $250K - $1M: 1.01x
- $1M - $2M: 1.075x
- $2M - $10M: 1.3x
- $10M+: 1.5x

### ZIP Code Factor
- 0-69999: 1.0x
- 70000-79999: 1.05x
- 80000-89999: 1.08x
- 90000-99999: 1.11x

### Square Footage Factor
- 0-10K sqft: 1.0x
- 10K-25K: 1.05x
- 25K-40K: 1.1x
- 40K-55K: 1.15x
- 55K+: 1.22x

### Acres Factor
- 0-1 acre: 0.75x
- 1-2: 1.0x
- 2-5: 1.1x
- 5-9: 1.2x
- 9+: 1.3x

### Floors Factor
- 1 floor: 1.0x
- 3: 1.05x
- 5: 1.1x
- 8: 1.3x
- 12+: 1.4x

### Multiple Properties Factor
- 1 property: 1.0x
- 2: 0.9x (10% discount)
- 4: 0.8x (20% discount)
- 6+: 0.7x (30% discount)

---

## ChatGPT Integration

The API is designed for ChatGPT Actions:

### Public Endpoints
- No authentication required for calculations
- Perfect for conversational AI
- Complete OpenAPI spec provided

### Usage in ChatGPT
1. Import `api-spec.yaml` into GPT Actions
2. Configure OAuth (when authentication is enabled)
3. Use in custom GPT or Actions

Example GPT Instructions:
```
When users ask for a cost segregation quote:
1. Gather property details
2. Call calculateQuote
3. Present results clearly
4. Explain factors that affected the price
```

---

## Development

### File Structure
```
src/
├── app/api/quotes/
│   ├── route.ts              # POST /api/quotes, GET /api/quotes
│   ├── [id]/route.ts         # GET/PATCH/DELETE /api/quotes/:id
│   ├── calculate/route.ts    # POST /api/quotes/calculate
│   └── factors/route.ts      # GET /api/quotes/factors
├── lib/
│   ├── api/response.ts       # Response utilities
│   ├── validations/          # Zod schemas
│   └── quote-engine/         # Calculation logic
└── docs/                     # Documentation
```

### Running Locally
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# API available at http://localhost:3000/api
```

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:ci
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth (for authentication)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Optional: Rate limiting
REDIS_URL="redis://..."
```

---

## Authentication

Currently marked as TODO in the code. To enable:

1. Install NextAuth.js:
   ```bash
   npm install next-auth @auth/prisma-adapter
   ```

2. Configure auth in `src/lib/auth/config.ts`

3. Uncomment auth checks in route files

4. Update API documentation

---

## Database Integration

Prisma integration points are ready in all route files. To enable:

1. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

2. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

3. Uncomment Prisma queries in route files

4. Remove mock data responses

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Auth required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

- **Authenticated:** 1000 requests/hour
- **Public:** 100 requests/hour

Headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1634567890
```

---

## Support

- **Documentation:** See files in this directory
- **Issues:** Report on GitHub
- **Email:** support@openasapp.com

---

## Version History

### v1.0.0 (2024-10-20)
- Initial implementation
- All core endpoints
- OpenAPI specification
- Complete documentation
- ChatGPT Actions ready

---

**Last Updated:** October 20, 2024
**API Version:** 1.0.0
**Status:** Production Ready (pending auth & database integration)
