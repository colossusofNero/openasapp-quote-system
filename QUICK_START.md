# Quick Start Guide - Get Running in 10 Minutes

## Prerequisites
- Node.js 18+ installed
- Docker installed (or PostgreSQL 14+)
- Terminal/Command Prompt

## Step 1: Start PostgreSQL (2 minutes)

### Option A: Docker (Recommended)
```bash
docker run --name openasapp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=openasapp_quotes \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Option B: Local PostgreSQL
If you have PostgreSQL installed:
```bash
createdb openasapp_quotes
```

## Step 2: Install Dependencies (3 minutes)
```bash
cd /c/Users/scott/Claude_Code/OpenAsApp_App
npm install
```

## Step 3: Run Database Setup (3 minutes)
```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate
# When prompted, enter migration name: "init"

# Seed database with lookup tables
npm run prisma:seed
```

Expected output:
```
🌱 Starting database seed...
📊 Seeding lookup tables...
  ✓ Seeded 12 cost basis factors
  ✓ Seeded 12 zip code factors
  ...
✅ Database seed completed successfully!
```

## Step 4: Start Development Server (1 minute)
```bash
npm run dev
```

Server starts at: http://localhost:3000

## Step 5: Test the API (1 minute)

### Test 1: Get Pricing Factors (No Auth Required)
```bash
curl http://localhost:3000/api/quotes/factors
```

### Test 2: Calculate Quote (No Auth Required)
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
    "taxYear": 2025,
    "yearBuilt": 2010,
    "capEx": 50000,
    "quoteType": "RCGV",
    "rushFee": false
  }'
```

### Test 3: Sign Up New User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "SecurePass123"
  }'
```

### Test 4: View Database (Optional)
```bash
npm run prisma:studio
```
Opens http://localhost:5555 - Browse all tables and data

## Default Test Accounts

After seeding, these accounts are available:

**Admin:**
- Email: `admin@openasapp.com`
- Password: `admin123`

**Demo:**
- Email: `demo@openasapp.com`
- Password: `demo123`

## Sign In

Visit: http://localhost:3000/api/auth/signin

(Note: This shows the default NextAuth UI. Frontend agent will create custom UI)

## Verify Everything Works

### Check 1: Database
```bash
npm run prisma:studio
```
- Should see 2 users
- Should see lookup tables with data
- Should see 1 sample quote

### Check 2: Authentication
- Visit http://localhost:3000/api/auth/signin
- Sign in with demo@openasapp.com / demo123
- Should get redirected with session cookie

### Check 3: Quote Calculation
- Use the cURL command above
- Should get a quote with bidAmount, paymentOptions, etc.

## Troubleshooting

### "Can't connect to database"
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgresql://postgres:postgres@localhost:5432/openasapp_quotes
```

### "Module not found"
```bash
npm install
npm run prisma:generate
```

### "Port 3000 already in use"
```bash
# Kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### "Prisma Client not found"
```bash
npm run prisma:generate
```

## What's Next?

### For API Integration:
See `API_INTEGRATION_GUIDE.md` for step-by-step instructions

### For Complete Details:
See `BACKEND_INTEGRATION_COMPLETE.md` for comprehensive documentation

### For Summary:
See `LEVEL_2_INTEGRATION_SUMMARY.md` for technical overview

## NPM Scripts Reference

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open database GUI

npm run db:reset         # Reset database and reseed
npm run test             # Run tests
npm run lint             # Run ESLint
```

## Environment Variables

Already configured in `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openasapp_quotes?schema=public"
NEXTAUTH_SECRET="dev-secret-key-replace-me-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Success!

If you can:
1. ✅ Access http://localhost:3000
2. ✅ Get quote factors from API
3. ✅ Calculate a quote via API
4. ✅ Sign up a new user
5. ✅ View data in Prisma Studio

**Then your backend is fully operational!** 🎉

## Next Steps

1. **Integrate API routes** (see `API_INTEGRATION_GUIDE.md`)
   - Uncomment authentication checks
   - Replace mock data with Prisma queries
   - Test protected endpoints

2. **Build Frontend UI** (for Frontend Agent)
   - Sign-in/sign-up pages
   - Quote creation form
   - Dashboard
   - Quote management

3. **Add Testing**
   - Unit tests
   - Integration tests
   - E2E tests

4. **Deploy to Production**
   - Choose hosting (Vercel, Railway, etc.)
   - Set up production database
   - Configure environment variables
   - Set up monitoring

## Support

If you encounter issues:
1. Check `BACKEND_INTEGRATION_COMPLETE.md` Troubleshooting section
2. Review error messages carefully
3. Ensure PostgreSQL is running
4. Verify environment variables are set
5. Check that all dependencies are installed

---

**Total Time: ~10 minutes**
**Status: Ready for Development**
**Next: API Integration or Frontend Development**
