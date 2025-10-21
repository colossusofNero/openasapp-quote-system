# Immediate Fixes Required - Action Items

**Priority:** P0 - CRITICAL
**Time Required:** 1-2 hours
**Status:** Must complete before testing can proceed

---

## Fix #1: Install PostgreSQL Database ⏱️ 30-60 minutes

### Why This is Critical
Without a database, **nothing can be tested**. All API endpoints, authentication, and data persistence are blocked.

### Option A: Install PostgreSQL (Recommended)

**Windows Installation:**
1. Download PostgreSQL 16: https://www.postgresql.org/download/windows/
2. Run installer (use default settings)
3. Set postgres user password: `postgres`
4. Verify installation:
   ```powershell
   psql --version
   # Should show: psql (PostgreSQL) 16.x
   ```

**Create Database:**
```powershell
# Open Command Prompt or PowerShell
psql -U postgres

# In psql prompt:
CREATE DATABASE openasapp_quotes;
\q
```

**Test Connection:**
```bash
psql -U postgres -d openasapp_quotes
# Should connect successfully
```

### Option B: Install Docker (Alternative)

**Windows Installation:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Run installer
3. Restart computer
4. Start Docker Desktop
5. Run PostgreSQL container:
   ```powershell
   docker run --name openasapp-postgres `
     -e POSTGRES_PASSWORD=postgres `
     -e POSTGRES_DB=openasapp_quotes `
     -p 5432:5432 `
     -d postgres:16-alpine

   # Verify container is running:
   docker ps
   ```

### Verification
```bash
# Test database connection
psql -U postgres -d openasapp_quotes -h localhost
# Or with Docker:
docker exec -it openasapp-postgres psql -U postgres -d openasapp_quotes

# Should connect successfully
```

✅ **Success Criteria:** Database is accessible on `localhost:5432`

---

## Fix #2: Export Quote Calculator ⏱️ 5 minutes

### Why This is Critical
API routes cannot import the calculator, making the entire API non-functional.

### The Problem
```typescript
// In API routes (route.ts):
import { quoteCalculator } from '@/lib/quote-engine/calculator';
// ERROR: 'quoteCalculator' is not exported
```

### The Fix

**File:** `src/lib/quote-engine/calculator.ts`

**Add to end of file (after QuoteCalculator class definition):**
```typescript
// Create default configuration
const defaultConfig: CalculatorConfig = {
  lookupTables: {
    costBasisFactors: COST_BASIS_FACTORS.map(([minValue, factor]) => ({
      minValue,
      factor,
    })),
    zipCodeFactors: ZIP_CODE_FACTORS.map(([zipCodePrefix, factor]) => ({
      zipCodePrefix,
      factor,
    })),
    sqFtFactors: SQFT_FACTORS.map(([minSqFt, factor]) => ({
      minSqFt,
      factor,
    })),
    acresFactors: ACRES_FACTORS.map(([minAcres, factor]) => ({
      minAcres,
      factor,
    })),
    propertyTypeFactors: Object.entries(PROPERTY_TYPE_FACTORS).map(([propertyType, factor]) => ({
      propertyType,
      factor,
    })),
    floorsFactors: Object.entries(FLOORS_FACTORS).map(([floors, factor]) => ({
      floors: parseInt(floors),
      factor,
    })),
    multiplePropertiesFactors: Object.entries(MULTIPLE_PROPERTIES_FACTORS).map(
      ([propertyCount, discountFactor]) => ({
        propertyCount: parseInt(propertyCount),
        discountFactor,
      })
    ),
  },
  paymentMultipliers: {
    upfront: 0.95,
    fiftyFifty: 1.1,
    monthly: 1.2,
  },
  rushFeeAmount: 500,
  depreciationConfig: {
    rates: {
      year1: 0.20,
      year2: 0.32,
      year3: 0.192,
      year4: 0.1152,
      year5: 0.1152,
      year6: 0.0576,
    },
    yearsToProject: 39,
    bonusDepreciationRate: 0.8,
  },
};

// Export singleton instance
export const quoteCalculator = new QuoteCalculator(defaultConfig);
```

### Verification
```bash
# Run TypeScript check
npx tsc --noEmit 2>&1 | grep "quoteCalculator"
# Should show NO errors for quoteCalculator
```

✅ **Success Criteria:** No TypeScript errors for `quoteCalculator` imports

---

## Fix #3: Create Jest Configuration ⏱️ 15 minutes

### Why This is Critical
Unit tests cannot run without proper Jest configuration for TypeScript.

### The Problem
```bash
npm test
# ERROR: SyntaxError: Unexpected token
# Babel cannot parse TypeScript type imports
```

### The Fix

**Create:** `jest.config.js` (in project root)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
    },
  },
};
```

**Create:** `jest.setup.js` (in project root)

```javascript
// Add custom jest matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
```

### Verification
```bash
# Run tests
npm test -- --testPathPattern="pricing-formulas.test.ts"

# Should show:
# PASS src/lib/quote-engine/pricing-formulas.test.ts
# Test Suites: 1 passed, 1 total
# Tests: 40+ passed, 40+ total
```

✅ **Success Criteria:** All unit tests pass

---

## Fix #4: Add Unique Constraints to Prisma Schema ⏱️ 15 minutes

### Why This is Important
Seed script will fail without unique constraints on lookup table keys.

### The Problem
```typescript
// In seed.ts:
await prisma.costBasisFactor.upsert({
  where: { minAmount: item.purchasePrice },  // ERROR: minAmount is not @unique
  // ...
});
```

### The Fix

**File:** `prisma/schema.prisma`

**Update each lookup table model:**

```prisma
model CostBasisFactor {
  id            String  @id @default(cuid())
  minAmount     Decimal @unique @db.Decimal(15, 2)  // <-- Add @unique
  maxAmount     Decimal? @db.Decimal(15, 2)
  factor        Decimal @db.Decimal(5, 4)
  description   String? @db.Text
  isActive      Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([minAmount])
  @@map("cost_basis_factors")
}

model ZipCodeFactor {
  id            String  @id @default(cuid())
  minZipCode    String  @unique  // <-- Add @unique
  maxZipCode    String?
  factor        Decimal @db.Decimal(5, 4)
  region        String?
  description   String? @db.Text
  isActive      Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([minZipCode])
  @@map("zip_code_factors")
}

model SqFtFactor {
  id            String  @id @default(cuid())
  minSqFt       Int     @unique  // <-- Add @unique
  maxSqFt       Int?
  factor        Decimal @db.Decimal(5, 4)
  description   String? @db.Text
  isActive      Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([minSqFt])
  @@map("sqft_factors")
}

model AcresFactor {
  id            String  @id @default(cuid())
  minAcres      Decimal @unique @db.Decimal(10, 4)  // <-- Add @unique
  maxAcres      Decimal? @db.Decimal(10, 4)
  factor        Decimal @db.Decimal(5, 4)
  description   String? @db.Text
  isActive      Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([minAcres])
  @@map("acres_factors")
}

model FloorsFactor {
  id            String  @id @default(cuid())
  numberOfFloors Int    @unique  // <-- Add @unique
  factor        Decimal @db.Decimal(5, 4)
  description   String? @db.Text
  isActive      Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([numberOfFloors])
  @@map("floors_factors")
}

model MultiplePropertiesFactor {
  id            String  @id @default(cuid())
  propertyCount Int     @unique  // <-- Add @unique
  factor        Decimal @db.Decimal(5, 4)
  description   String? @db.Text
  isActive      Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([propertyCount])
  @@map("multiple_properties_factors")
}
```

### Regenerate Prisma Client
```bash
npx prisma generate
```

### Verification
```bash
# Check TypeScript errors
npx tsc --noEmit 2>&1 | grep "seed.ts"
# Should show NO errors for seed.ts
```

✅ **Success Criteria:** Seed script has no TypeScript errors

---

## Fix #5: Run Database Setup ⏱️ 10 minutes

### Prerequisites
- Fix #1 (Database installed) must be complete
- Fix #4 (Schema updated) must be complete

### Commands to Run

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Create database tables
npx prisma migrate dev --name init
# When prompted for migration name, enter: "init"

# Expected output:
# ✔ Database migrations applied successfully

# 3. Seed database with lookup tables
npm run prisma:seed

# Expected output:
# 🌱 Starting database seed...
# ✓ Seeded 12 cost basis factors
# ✓ Seeded 12 zip code factors
# ✓ Seeded 12 sqft factors
# ✓ Seeded 12 acres factors
# ✓ Seeded 10 property type factors
# ✓ Seeded 12 floors factors
# ✓ Seeded 7 multiple properties factors
# ✓ Created admin user: admin@openasapp.com
# ✓ Created demo user: demo@openasapp.com
# ✓ Created sample quote
# ✅ Database seed completed successfully!

# 4. Verify data
npx prisma studio
# Opens http://localhost:5555
# Check that all tables have data
```

### Verification
```bash
# Check database tables
psql -U postgres -d openasapp_quotes -c "\dt"

# Should show:
# users
# quotes
# quote_line_items
# cost_basis_factors
# zip_code_factors
# sqft_factors
# acres_factors
# property_type_factors
# floors_factors
# multiple_properties_factors
# depreciation_rates
# system_config
```

✅ **Success Criteria:** All 12 tables created and populated with data

---

## Fix #6: Start Development Server ⏱️ 2 minutes

### Prerequisites
- All fixes #1-#5 must be complete

### Commands to Run

```bash
# Start the development server
npm run dev

# Expected output:
# - ready started server on 0.0.0.0:3000, url: http://localhost:3000
# - event compiled client and server successfully
```

### Verification
```bash
# Test in browser
# Open: http://localhost:3000

# Should see: Homepage loads successfully

# Test API endpoint
curl http://localhost:3000/api/quotes/factors

# Should return: JSON with all pricing factors
```

✅ **Success Criteria:** Server starts without errors, homepage loads

---

## Verification Checklist

After completing all fixes, verify:

- [ ] PostgreSQL is running
- [ ] Database `openasapp_quotes` exists
- [ ] Prisma Client is generated
- [ ] Migrations are applied
- [ ] Seed data is loaded
- [ ] `quoteCalculator` is exported
- [ ] Jest tests run successfully
- [ ] TypeScript compiles without critical errors
- [ ] Development server starts
- [ ] Homepage loads in browser
- [ ] API endpoint returns data

---

## If Something Goes Wrong

### Database Connection Errors
```bash
# Check PostgreSQL is running
# Windows:
Get-Service -Name postgresql*

# Start if stopped:
Start-Service postgresql-x64-16
```

### Port Already in Use
```powershell
# Windows: Find process on port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID [PID_NUMBER] /F
```

### Prisma Client Not Found
```bash
# Regenerate Prisma Client
npx prisma generate

# Then restart server
npm run dev
```

### Module Not Found Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## Estimated Timeline

| Fix | Time | Dependencies |
|-----|------|-------------|
| #1: Install PostgreSQL | 30-60 min | None |
| #2: Export calculator | 5 min | None |
| #3: Jest config | 15 min | None |
| #4: Schema updates | 15 min | None |
| #5: Database setup | 10 min | Fix #1, #4 |
| #6: Start server | 2 min | Fix #1-#5 |
| **TOTAL** | **77-107 minutes** | Sequential |

---

## Success Indicators

When all fixes are complete, you should be able to:

1. ✅ Run `npm run dev` without errors
2. ✅ Access http://localhost:3000 in browser
3. ✅ Sign up with a new account
4. ✅ Sign in with demo@openasapp.com / demo123
5. ✅ Create a new quote
6. ✅ View quote details with calculations
7. ✅ Run `npm test` and see all tests pass
8. ✅ Run `npx tsc --noEmit` with minimal errors

---

## Next Steps After Fixes

Once all immediate fixes are complete:

1. **Run Full Test Suite**
   - Execute IMMEDIATE_ACTION_PLAN.md
   - Test all user flows
   - Validate calculations against Excel

2. **Fix Remaining TypeScript Errors**
   - See TESTING_REPORT for full list
   - Focus on React Query type issues
   - Update component types

3. **Add Missing Features**
   - Rate limiting
   - Error boundaries
   - Email verification

4. **Prepare for Production**
   - Set up proper environment variables
   - Configure production database
   - Set up error monitoring

---

**Document Status:** READY TO EXECUTE
**Priority:** P0 - CRITICAL
**Blocking:** All testing and development

**Start with Fix #1** and work through sequentially.
