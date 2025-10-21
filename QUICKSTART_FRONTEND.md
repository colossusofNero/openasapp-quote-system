# OpenAsApp Frontend - Quick Start Guide

## Prerequisites

Ensure you have:
- Node.js 18+ installed
- npm 9+ installed
- Backend API running (or mock API)

## Installation

1. **Install all dependencies:**
```bash
npm install
```

This installs:
- Next.js 14 + React 18
- TypeScript
- Tailwind CSS
- React Query
- React Hook Form
- Recharts
- And all other dependencies

## Environment Setup

Create `.env.local` file:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database (if using local)
DATABASE_URL=postgresql://user:password@localhost:5432/openasapp

# Optional: API URL if backend is on different port
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Running the Application

### Development Mode
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Project Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth pages (sign in, sign up)
│   │   ├── layout.tsx
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── quotes/
│   │       ├── page.tsx          # List all quotes
│   │       ├── new/page.tsx      # Create quote
│   │       └── [id]/
│   │           ├── page.tsx      # View quote
│   │           └── edit/page.tsx # Edit quote
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home (redirects)
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── layout/                   # Layout components
│   ├── quotes/                   # Quote-specific components
│   └── providers.tsx             # App providers
├── lib/
│   ├── api/                      # API client & hooks
│   │   ├── client.ts
│   │   ├── hooks.ts
│   │   └── types.ts
│   └── utils.ts                  # Utility functions
└── middleware.ts                 # Auth middleware
```

## Key Features

### 1. Authentication
- **Sign Up**: `/signup`
  - Email validation
  - Password strength indicator
  - Terms acceptance

- **Sign In**: `/signin`
  - Credentials authentication
  - Remember me option
  - Auto-redirect to dashboard

### 2. Dashboard
- **Home**: `/dashboard`
  - Statistics cards
  - Recent quotes
  - Quick actions

- **Quotes List**: `/quotes`
  - Search by name/address
  - Filter by status
  - Sort by date/amount
  - Pagination ready

### 3. Quote Management
- **Create**: `/quotes/new`
  - Multi-step form (4 steps)
  - Real-time validation
  - Calculation preview

- **View**: `/quotes/[id]`
  - Full quote details
  - Payment options
  - Charts & tables
  - Export ready

- **Edit**: `/quotes/[id]/edit`
  - Pre-filled form
  - Same validation

## API Integration

All API calls go through:
- **Client**: `src/lib/api/client.ts`
- **Hooks**: `src/lib/api/hooks.ts`

### Available Hooks

```tsx
import {
  useQuotes,        // List quotes
  useQuote,         // Get single quote
  useCreateQuote,   // Create quote
  useUpdateQuote,   // Update quote
  useDeleteQuote,   // Delete quote
  useCalculateQuote // Calculate preview
} from "@/lib/api/hooks";

// Example usage
const { data, isLoading } = useQuotes({ status: 'draft' });
const createMutation = useCreateQuote();
```

## Styling

### Tailwind Classes
All components use Tailwind CSS utility classes.

### Custom Colors
```tsx
// Primary colors
bg-primary text-primary-foreground

// Status colors
bg-success    // Green
bg-warning    // Yellow
bg-destructive // Red

// UI elements
bg-card border-border
text-muted-foreground
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="
  px-4 py-2        // Base mobile
  md:px-6 md:py-4  // Tablet
  lg:px-8 lg:py-6  // Desktop
">
```

## Components Usage

### Button
```tsx
import { Button } from "@/components/ui/button";

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button size="lg">Large</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Form
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>
```

## Common Tasks

### Add a New Page
1. Create file: `src/app/(dashboard)/newpage/page.tsx`
2. Add to navbar: `src/components/layout/navbar.tsx`

### Add a New Component
1. Create file: `src/components/ui/newcomponent.tsx`
2. Export component
3. Import where needed

### Call an API
```tsx
import { useQuotes } from "@/lib/api/hooks";

function MyComponent() {
  const { data, isLoading, error } = useQuotes();

  if (isLoading) return <Spinner />;
  if (error) return <Alert>Error</Alert>;

  return <div>{/* Use data */}</div>;
}
```

### Add Validation
1. Update schema: `src/lib/validations/quote.schema.ts`
2. Use in form with `react-hook-form`

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### TypeScript Errors
```bash
# Regenerate types
npm run prisma:generate

# Check for errors
npm run type-check
```

### Styles Not Applying
```bash
# Clear .next cache
rm -rf .next

# Restart dev server
npm run dev
```

### API Not Working
1. Check `.env.local` file exists
2. Verify API URL is correct
3. Check browser console for errors
4. Verify backend is running

## Testing User Flows

### 1. Authentication Flow
```
1. Go to /signup
2. Fill form and submit
3. Should redirect to /signin
4. Sign in with credentials
5. Should redirect to /dashboard
```

### 2. Create Quote Flow
```
1. Click "Create New Quote"
2. Fill Step 1 (property details)
3. Click "Next" → Step 2
4. Fill Step 2 (additional info)
5. Click "Next" → Step 3
6. Fill Step 3 (client info)
7. Click "Calculate & Review"
8. Verify calculation shows
9. Click "Save Quote"
10. Should redirect to quote detail
```

### 3. Filter Quotes Flow
```
1. Go to /quotes
2. Enter search term
3. Select status filter
4. Change sort order
5. Verify results update
```

## Next Steps

After getting the frontend running:

1. **Connect to Backend API**
   - Ensure all endpoints return expected data structure
   - Test each CRUD operation

2. **Add Missing Features**
   - PDF export
   - Email sending
   - Quote duplication

3. **Testing**
   - Write unit tests for components
   - Add E2E tests with Playwright
   - Test on different devices

4. **Deployment**
   - Build production version
   - Deploy to Vercel/Netlify
   - Set environment variables

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form](https://react-hook-form.com/get-started)
- [Recharts](https://recharts.org/en-US/guide)

## Support

For issues or questions:
1. Check component documentation: `src/components/README.md`
2. Review API integration: `src/lib/api/`
3. Check frontend summary: `FRONTEND_SUMMARY.md`

---

**Happy Coding!** 🚀
