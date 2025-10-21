# OpenAsApp Frontend Architecture

## Overview
Modern, scalable frontend built with Next.js 14 App Router, TypeScript, and React Query.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS 14 APP                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             App Router (src/app/)                     │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   (auth)    │  │ (dashboard)  │  │   API       │ │  │
│  │  │  - signin   │  │  - dashboard │  │  - quotes   │ │  │
│  │  │  - signup   │  │  - quotes    │  │  - auth     │ │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Components (src/components/)               │  │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────────────┐   │  │
│  │  │   UI     │  │ Layout  │  │     Quotes       │   │  │
│  │  │ - button │  │ - navbar│  │  - quote-form    │   │  │
│  │  │ - input  │  │ - footer│  │  - payment-opts  │   │  │
│  │  │ - card   │  └─────────┘  │  - dep-table     │   │  │
│  │  │ - table  │                │  - chart         │   │  │
│  │  └──────────┘                └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Libraries (src/lib/)                     │  │
│  │  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │  │
│  │  │     API      │  │   Utils    │  │ Validations │  │  │
│  │  │  - client    │  │  - format  │  │  - schemas  │  │  │
│  │  │  - hooks     │  │  - cn()    │  │  - zod      │  │  │
│  │  │  - types     │  └────────────┘  └─────────────┘  │  │
│  │  └──────────────┘                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           State Management                            │  │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │  │
│  │  │  React Query    │  │   React Hook Form       │   │  │
│  │  │  - Data caching │  │   - Form state          │   │  │
│  │  │  - Mutations    │  │   - Validation          │   │  │
│  │  │  - Optimistic   │  │   - Multi-step flow     │   │  │
│  │  └─────────────────┘  └─────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes                               │  │
│  │  - POST /api/auth/signup                             │  │
│  │  - POST /api/auth/signin                             │  │
│  │  - GET  /api/quotes                                  │  │
│  │  - POST /api/quotes                                  │  │
│  │  - GET  /api/quotes/:id                              │  │
│  │  - PATCH /api/quotes/:id                             │  │
│  │  - DELETE /api/quotes/:id                            │  │
│  │  - POST /api/quotes/calculate                        │  │
│  │  - GET  /api/quotes/factors                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Authentication Flow
```
User → Sign In Page → NextAuth → API → Database → Session
  ↓
Redirect to Dashboard → Protected by Middleware
```

### 2. Quote Creation Flow
```
User Input → React Hook Form → Validation (Zod)
  ↓
Multi-Step Form (Steps 1-4)
  ↓
Calculate Quote → POST /api/quotes/calculate → Backend Engine
  ↓
Preview Results
  ↓
Save Quote → POST /api/quotes → Database
  ↓
React Query Cache Update → Redirect to Detail Page
```

### 3. Quote List Flow
```
User → Quotes Page → useQuotes Hook → React Query
  ↓
GET /api/quotes?filters → Backend
  ↓
Cached Response → Table Display
  ↓
User Actions (Edit/Delete) → Mutations → Cache Invalidation
```

---

## Component Hierarchy

```
App
├── Layout (Root)
│   ├── Providers (React Query, Toast)
│   └── Children
│
├── (auth)
│   ├── Layout (Auth Layout)
│   ├── Sign In Page
│   │   ├── Card
│   │   ├── Input Fields
│   │   ├── Button
│   │   └── Error Alert
│   └── Sign Up Page
│       ├── Card
│       ├── Input Fields
│       ├── Password Strength
│       └── Button
│
└── (dashboard)
    ├── Layout (Dashboard Layout)
    │   ├── Navbar
    │   │   ├── Logo
    │   │   ├── Nav Links
    │   │   └── User Menu
    │   ├── Main Content
    │   └── Footer
    │
    ├── Dashboard Home
    │   ├── Stats Cards (4x)
    │   ├── Recent Quotes Card
    │   │   └── Quote List Items
    │   └── Quick Actions Card
    │
    ├── Quotes List Page
    │   ├── Filters Card
    │   │   ├── Search Input
    │   │   ├── Status Select
    │   │   └── Sort Select
    │   └── Quotes Table Card
    │       └── Table
    │           ├── Table Header
    │           ├── Table Body
    │           │   └── Table Rows
    │           │       └── Action Buttons
    │           └── Empty State
    │
    ├── Create Quote Page
    │   ├── Page Header
    │   └── Quote Form
    │       ├── Progress Steps
    │       ├── Step 1: Property Details
    │       │   └── Input Fields (9)
    │       ├── Step 2: Additional Info
    │       │   └── Input Fields (4)
    │       ├── Step 3: Client Info
    │       │   └── Input Fields (3)
    │       └── Step 4: Review
    │           ├── Calculation Display
    │           └── Save Button
    │
    ├── Quote Detail Page
    │   ├── Header
    │   │   ├── Client Name + Status Badge
    │   │   └── Action Buttons
    │   ├── Property Summary Card
    │   ├── Quote Details Card
    │   ├── Payment Options (3 Cards)
    │   │   ├── Upfront
    │   │   ├── 50/50
    │   │   └── Monthly
    │   ├── Comparison Chart
    │   │   └── Bar Chart (Recharts)
    │   └── Depreciation Table
    │       └── Table Component
    │
    └── Edit Quote Page
        └── Quote Form (pre-filled)
```

---

## State Management Strategy

### React Query (Server State)
```typescript
// Global cache for all server data
QueryClient
├── quotes
│   ├── ["quotes"] → All quotes list
│   ├── ["quotes", { status: "draft" }] → Filtered quotes
│   └── ["quotes", "123"] → Single quote
└── factors
    └── ["factors"] → Lookup tables

// Automatic:
- Caching (60 seconds default)
- Background refetching
- Cache invalidation after mutations
- Optimistic updates
```

### React Hook Form (Form State)
```typescript
// Per-form state management
useForm({
  defaultValues: {...},
  resolver: zodResolver(schema),
  mode: "onBlur"
})

// Features:
- Field-level validation
- Error messages
- Dirty state tracking
- Form submission handling
```

### React Context (Global UI State)
```typescript
// Currently minimal, using:
- NextAuth SessionProvider (auth state)
- React Query (no need for Redux)
```

---

## Routing Strategy

### Next.js 14 App Router

```
app/
├── page.tsx                    → / (redirects to /dashboard)
│
├── (auth)/                     → Auth group (shared layout)
│   ├── layout.tsx             → Auth layout
│   ├── signin/page.tsx        → /signin
│   └── signup/page.tsx        → /signup
│
└── (dashboard)/                → Protected group
    ├── layout.tsx             → Dashboard layout (requires auth)
    ├── dashboard/page.tsx     → /dashboard
    └── quotes/
        ├── page.tsx           → /quotes
        ├── new/page.tsx       → /quotes/new
        └── [id]/
            ├── page.tsx       → /quotes/123
            └── edit/page.tsx  → /quotes/123/edit
```

### Middleware Protection
```typescript
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/quotes/:path*"]
};
```

---

## API Integration Pattern

### 1. Define Types
```typescript
// src/lib/api/types.ts
interface Quote { ... }
interface QuotesListResponse { ... }
```

### 2. Create API Client
```typescript
// src/lib/api/client.ts
class ApiClient {
  async getQuotes(query) {
    return fetch("/api/quotes?...");
  }
}
```

### 3. Create React Query Hooks
```typescript
// src/lib/api/hooks.ts
export function useQuotes(query) {
  return useQuery({
    queryKey: ["quotes", query],
    queryFn: () => apiClient.getQuotes(query)
  });
}
```

### 4. Use in Components
```typescript
// src/app/(dashboard)/quotes/page.tsx
const { data, isLoading } = useQuotes({ status: "draft" });
```

---

## Styling Architecture

### Tailwind CSS Configuration
```
tailwind.config.js
├── Content paths (where to look for classes)
├── Theme extension
│   ├── Colors (CSS variables)
│   ├── Border radius
│   └── Animations
└── Plugins
    └── tailwindcss-animate
```

### CSS Variables (Design Tokens)
```css
/* globals.css */
:root {
  --primary: hsl(221.2, 83.2%, 53.3%);
  --secondary: hsl(210, 40%, 96.1%);
  --destructive: hsl(0, 84.2%, 60.2%);
  --border: hsl(214.3, 31.8%, 91.4%);
  /* ... more tokens */
}
```

### Component Variants (CVA)
```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", destructive: "..." },
      size: { default: "...", lg: "..." }
    }
  }
);
```

---

## Performance Optimizations

### 1. Next.js Features
- **Server Components**: Default for static content
- **Client Components**: Only where interactivity needed
- **Code Splitting**: Automatic by route
- **Image Optimization**: Ready for `<Image>` component

### 2. React Query Caching
```typescript
QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // Cache for 1 minute
      refetchOnWindowFocus: false   // Don't refetch on focus
    }
  }
})
```

### 3. Component Optimization
```typescript
// Memoization where needed
const MemoizedComponent = React.memo(Component);

// Expensive calculations
const calculated = useMemo(() => expensiveCalc(data), [data]);
```

---

## Error Handling Strategy

### 1. API Level
```typescript
// src/lib/api/client.ts
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error(data.error.message);
  return data;
} catch (error) {
  console.error("API Error:", error);
  throw error;
}
```

### 2. React Query Level
```typescript
// src/lib/api/hooks.ts
useMutation({
  mutationFn: createQuote,
  onSuccess: () => toast.success("Quote created!"),
  onError: (error) => toast.error(error.message)
});
```

### 3. Component Level
```typescript
// Page component
if (isLoading) return <Spinner />;
if (error) return <Alert variant="destructive">{error.message}</Alert>;
return <ActualContent />;
```

### 4. Global Level (TODO)
```typescript
// Error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

## Security Measures

### 1. Authentication
- NextAuth middleware protects routes
- Session-based authentication
- Secure cookie storage

### 2. Input Validation
- Zod schemas on client and server
- SQL injection prevention (Prisma)
- XSS protection (React escaping)

### 3. CSRF Protection
- NextAuth built-in CSRF tokens
- Same-origin policy

### 4. Environment Variables
- Sensitive data in `.env.local`
- Not committed to version control
- Separate for dev/staging/prod

---

## Testing Strategy (TODO)

### 1. Unit Tests
```
__tests__/
├── components/
│   ├── ui/
│   │   └── button.test.tsx
│   └── quotes/
│       └── quote-form.test.tsx
└── lib/
    └── utils.test.ts
```

### 2. Integration Tests
```
__tests__/integration/
├── auth-flow.test.tsx
├── create-quote.test.tsx
└── quote-list.test.tsx
```

### 3. E2E Tests
```
e2e/
├── auth.spec.ts
├── quotes-crud.spec.ts
└── filtering.spec.ts
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│         Vercel / Netlify                 │
│  ┌────────────────────────────────────┐  │
│  │     Next.js App (Frontend)         │  │
│  │  - Static pages (SSG)              │  │
│  │  - Dynamic pages (SSR)             │  │
│  │  - API routes                      │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│         PostgreSQL Database              │
│         (Supabase / Neon / RDS)          │
└───────────────────────────────────────────┘
```

---

## Future Enhancements

### Phase 1 (High Priority)
- [ ] Error boundaries
- [ ] 404 page
- [ ] Loading pages
- [ ] PDF export
- [ ] Email integration

### Phase 2 (Medium Priority)
- [ ] Pagination
- [ ] Search debouncing
- [ ] Form autosave
- [ ] Dark mode toggle
- [ ] Print styles

### Phase 3 (Low Priority)
- [ ] User profile page
- [ ] Quote history
- [ ] Bulk actions
- [ ] Export to Excel
- [ ] Analytics dashboard

---

## Conclusion

This architecture provides:
- ✅ Scalability (component-based)
- ✅ Maintainability (clear structure)
- ✅ Performance (caching, code splitting)
- ✅ Type Safety (full TypeScript)
- ✅ Developer Experience (modern tooling)
- ✅ User Experience (responsive, fast)

---

**Generated: 2025-10-20**
**Version: 1.0**
