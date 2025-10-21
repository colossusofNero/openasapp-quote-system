# Getting Started with OpenAsApp Development

## Project Quick Start Guide

This guide will help you set up the OpenAsApp project from scratch using the three-level agent hierarchy.

---

## Prerequisites

### Required Software
- Node.js 20+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- VS Code or preferred IDE
- GitHub account
- Vercel account ([Sign up](https://vercel.com/))

### Required Knowledge
- TypeScript/JavaScript
- React/Next.js basics
- RESTful API concepts
- Basic database knowledge
- Git workflow

---

## Phase 1: Initial Setup (Day 1)

### Step 1: Initialize Next.js Project

```bash
# Create new Next.js project with TypeScript
npx create-next-app@latest openasapp --typescript --tailwind --app --src-dir --import-alias "@/*"

cd openasapp

# Install core dependencies
npm install @prisma/client prisma
npm install next-auth
npm install zod react-hook-form @hookform/resolvers/zod
npm install zustand
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Install dev dependencies
npm install --save-dev @types/node @types/react @types/react-dom
npm install --save-dev eslint-config-prettier prettier
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### Step 2: Initialize Git Repository

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit: Next.js with TypeScript and Tailwind"

# Create GitHub repository (via GitHub CLI or web interface)
gh repo create openasapp --public --source=. --remote=origin --push
# OR create manually at github.com and push:
# git remote add origin https://github.com/YOUR_USERNAME/openasapp.git
# git push -u origin main
```

### Step 3: Setup Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# This will create .vercel directory with project settings
```

### Step 4: Setup Database (Vercel Postgres)

```bash
# Go to Vercel dashboard and create Postgres database
# OR use Vercel CLI:
vercel env pull .env.local

# This pulls your environment variables including DATABASE_URL
```

### Step 5: Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file with DATABASE_URL
```

Edit `prisma/schema.prisma` with the complete schema from `LEVEL_1_CHIEF_ARCHITECT_SPEC.md`

```bash
# Generate Prisma client
npx prisma generate

# Run first migration
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

### Step 6: Setup shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add base components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dropdown-menu
```

---

## Phase 2: Project Structure Setup (Day 1-2)

### Create Directory Structure

```bash
# Create all necessary directories
mkdir -p src/{api,lib,components,app,types}
mkdir -p src/lib/{auth,database,validations,quote-engine,pdf-parser,exporters}
mkdir -p src/components/{ui,forms,quote,pdf,layout,providers}
mkdir -p src/app/{api,dashboard,quotes,templates,settings}
mkdir -p src/app/api/{auth,quotes,templates,pdf,gpt,upload,webhooks}
mkdir -p src/stores
mkdir -p prisma/migrations
mkdir -p public/{images,fonts}
mkdir -p __tests__/{unit,integration,e2e}
```

### Create Core Configuration Files

#### `src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### `.env.local`
```env
# Database
DATABASE_URL="postgres://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OpenAI (for GPT integration)
OPENAI_API_KEY="sk-..."
OPENAI_CLIENT_ID="your-client-id"
OPENAI_CLIENT_SECRET="your-client-secret"

# File Storage
BLOB_READ_WRITE_TOKEN="vercel-blob-token"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="quotes@openasapp.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### `package.json` (add scripts)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "type-check": "tsc --noEmit"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## Phase 3: Level 2 Agent Coordination (Week 1)

### Agent Activation Order

#### Day 1-2: Backend Infrastructure Agent
**Tasks:**
1. Setup authentication (NextAuth.js)
2. Create base API structure
3. Implement middleware
4. Setup error handling

**Checklist:**
- [ ] `/api/auth/[...nextauth]/route.ts` configured
- [ ] Middleware for authentication created
- [ ] Error handling utilities
- [ ] API response helpers
- [ ] Basic user endpoints

**Verify:**
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@openasapp.com","password":"admin123"}'
```

#### Day 3-4: Frontend Application Agent
**Tasks:**
1. Setup app router structure
2. Create layout components
3. Build dashboard page
4. Setup state management

**Checklist:**
- [ ] `app/layout.tsx` with providers
- [ ] Dashboard layout created
- [ ] Navigation component
- [ ] Theme provider
- [ ] Zustand stores initialized

**Verify:**
- Visit http://localhost:3000
- Navigation works
- Authentication flow functional

#### Day 5-6: Quote Engine Agent
**Tasks:**
1. Implement QuoteCalculator
2. Create quote API endpoints
3. Build basic quote form

**Checklist:**
- [ ] `lib/quote-engine/calculator.ts`
- [ ] `app/api/quotes/route.ts`
- [ ] Quote form component
- [ ] Calculation tests passing

**Verify:**
```bash
# Create a quote via API
curl -X POST http://localhost:3000/api/quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "items": [{
      "description": "Service",
      "quantity": 1,
      "unitPrice": 100,
      "discount": 0
    }],
    "taxRate": 10
  }'
```

#### Day 7: PDF Parser Agent (Initial)
**Tasks:**
1. Setup pdf-parse library
2. Create basic parser
3. Test with sample PDFs

**Checklist:**
- [ ] `lib/pdf-parser/parser.ts`
- [ ] PDF upload endpoint
- [ ] Basic extraction working

---

## Phase 4: Integration (Week 2)

### Cross-Component Integration

#### Frontend ↔ Backend
1. **Quote Creation Flow**
   - Form submission
   - API call
   - Response handling
   - Success/error states
   - Redirect to detail page

2. **Quote List View**
   - Fetch quotes
   - Display in table
   - Pagination
   - Sorting/filtering

3. **Quote Detail View**
   - Fetch single quote
   - Display all information
   - Edit functionality
   - Delete confirmation

#### Testing Integration Points

```typescript
// __tests__/integration/quote-flow.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteForm } from '@/components/forms/QuoteForm';

describe('Quote Creation Flow', () => {
  it('creates quote successfully', async () => {
    const user = userEvent.setup();

    render(<QuoteForm />);

    // Fill form
    await user.type(screen.getByLabelText('Client Name'), 'Acme Corp');
    await user.type(screen.getByLabelText('Description'), 'Web Development');
    await user.type(screen.getByLabelText('Quantity'), '40');
    await user.type(screen.getByLabelText('Unit Price'), '150');

    // Submit
    await user.click(screen.getByText('Create Quote'));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/Quote created/i)).toBeInTheDocument();
    });
  });
});
```

---

## Phase 5: ChatGPT Integration (Week 3)

### Setup GPT Actions

#### Step 1: Create GPT Action Endpoints

```bash
# Create GPT-specific API routes
mkdir -p src/app/api/gpt/{quote,pdf}
touch src/app/api/gpt/quote/create/route.ts
touch src/app/api/gpt/quote/list/route.ts
touch src/app/api/gpt/pdf/parse/route.ts
```

#### Step 2: Implement OAuth 2.0

```bash
mkdir -p src/app/api/oauth
touch src/app/api/oauth/authorize/route.ts
touch src/app/api/oauth/token/route.ts
```

Implement OAuth flow from `LEVEL_2_AGENTS_SPECS.md`

#### Step 3: Create OpenAPI Schema

```bash
# Create schema file
touch openapi-gpt-actions.yaml
```

Copy schema from `LEVEL_2_AGENTS_SPECS.md` and customize

#### Step 4: Create Privacy Policy & Terms

```bash
mkdir -p src/app/(legal)/{privacy,terms}
touch src/app/(legal)/privacy/page.tsx
touch src/app/(legal)/terms/page.tsx
```

#### Step 5: Test GPT Actions Locally

```bash
# Use ngrok to expose local server
npx ngrok http 3000

# Use the ngrok URL in GPT Action schema for testing
```

#### Step 6: Submit to OpenAI

1. Go to https://chat.openai.com/gpts/editor
2. Create new GPT
3. Add GPT Actions schema
4. Configure OAuth
5. Test thoroughly
6. Submit for review

---

## Phase 6: Deployment (Week 4)

### Production Deployment Checklist

#### Pre-Deployment
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Seed data prepared
- [ ] Error monitoring configured

#### Vercel Deployment

```bash
# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add OPENAI_API_KEY production
# ... add all environment variables
```

#### Post-Deployment
- [ ] Verify app is accessible
- [ ] Test authentication
- [ ] Test quote creation
- [ ] Test PDF parsing
- [ ] Verify database connection
- [ ] Check error monitoring
- [ ] Test email sending

#### Setup Custom Domain (Optional)

```bash
# Add domain in Vercel dashboard
vercel domains add openasapp.com

# Configure DNS records as shown in Vercel
```

---

## Daily Development Workflow

### Morning Routine
1. Pull latest changes: `git pull origin main`
2. Check for dependency updates: `npm outdated`
3. Run database migrations: `npx prisma migrate dev`
4. Start dev server: `npm run dev`
5. Review daily tasks in project board

### Development Cycle
1. Create feature branch: `git checkout -b feature/quote-export`
2. Make changes
3. Run tests: `npm test`
4. Check types: `npm run type-check`
5. Format code: `npm run format`
6. Commit changes: `git commit -m "feat: add quote export"`
7. Push branch: `git push origin feature/quote-export`
8. Create pull request
9. Wait for review and CI checks
10. Merge to main

### Evening Routine
1. Update daily standup notes
2. Push all changes
3. Update task board
4. Document any blockers

---

## Common Commands Reference

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm run format       # Format code
```

### Database
```bash
npx prisma studio           # Open database GUI
npx prisma generate         # Generate Prisma client
npx prisma migrate dev      # Run migrations
npx prisma migrate reset    # Reset database
npx prisma db seed          # Seed database
npx prisma db push          # Push schema without migration
```

### Testing
```bash
npm test                    # Run tests in watch mode
npm run test:ci             # Run tests once with coverage
```

### Git
```bash
git status                  # Check status
git add .                   # Stage all changes
git commit -m "message"     # Commit changes
git push                    # Push to remote
git pull                    # Pull from remote
git checkout -b branch-name # Create new branch
```

### Vercel
```bash
vercel                      # Deploy to preview
vercel --prod               # Deploy to production
vercel env ls               # List environment variables
vercel logs                 # View logs
vercel domains              # Manage domains
```

---

## Troubleshooting

### Issue: Prisma Client not generated
```bash
npx prisma generate
```

### Issue: Database connection failed
1. Check DATABASE_URL in .env.local
2. Verify database is running
3. Check network connectivity
4. Verify credentials

### Issue: NextAuth session not persisting
1. Check NEXTAUTH_SECRET is set
2. Verify NEXTAUTH_URL matches your domain
3. Clear cookies and try again
4. Check for CORS issues

### Issue: API route not found
1. Verify file is in correct location: `app/api/...`
2. Check route naming: `route.ts` not `index.ts`
3. Restart dev server
4. Clear `.next` cache: `rm -rf .next`

### Issue: TypeScript errors
```bash
# Regenerate types
npx prisma generate
npm run type-check
```

### Issue: Build fails on Vercel
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Check for missing dependencies

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Vercel Docs](https://vercel.com/docs)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [ngrok](https://ngrok.com/) - Local tunneling for testing

### Community
- [Next.js Discord](https://discord.gg/nextjs)
- [Prisma Discord](https://discord.gg/prisma)
- Stack Overflow tags: nextjs, prisma, tailwindcss

---

## Next Steps

After completing the getting started guide:

1. **Review the agent specifications:**
   - Read `LEVEL_1_CHIEF_ARCHITECT_SPEC.md`
   - Review `LEVEL_2_AGENTS_SPECS.md`
   - Study `LEVEL_3_AGENTS_SPECS.md`

2. **Set up project management:**
   - Create GitHub Project board
   - Add tasks from specifications
   - Assign agent responsibilities

3. **Begin development:**
   - Start with Backend Infrastructure Agent tasks
   - Follow the weekly plan in `PROJECT_ROADMAP.md`
   - Coordinate with other agents as needed

4. **Regular check-ins:**
   - Daily standups (async)
   - Weekly demos
   - Sprint retrospectives

---

**Happy Coding! 🚀**

For questions or issues, refer to the agent specifications or create a GitHub issue.
