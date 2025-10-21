# OpenAsApp Components Documentation

This directory contains all reusable React components for the OpenAsApp Quote Management System.

## Directory Structure

```
src/components/
├── ui/                    # Base UI components (shadcn-inspired)
│   ├── button.tsx        # Button component with variants
│   ├── input.tsx         # Input field component
│   ├── label.tsx         # Form label component
│   ├── card.tsx          # Card container components
│   ├── badge.tsx         # Badge/tag component
│   ├── select.tsx        # Dropdown select component
│   ├── table.tsx         # Table components
│   ├── alert.tsx         # Alert/notification component
│   └── spinner.tsx       # Loading spinner component
├── layout/               # Layout components
│   ├── navbar.tsx        # Top navigation bar
│   └── footer.tsx        # Footer component
├── quotes/               # Quote-specific components
│   ├── quote-form.tsx    # Multi-step quote creation form
│   ├── payment-options.tsx       # Payment plans display
│   ├── depreciation-table.tsx    # Year-by-year depreciation
│   └── comparison-chart.tsx      # Visual property breakdown
└── providers.tsx         # App-wide providers (React Query, Toast)
```

## UI Components

### Button
Multi-variant button component with loading states.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes:** `default`, `sm`, `lg`, `icon`

### Input
Standard input field with consistent styling.

```tsx
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Enter text..." />
<Input type="email" required />
<Input type="number" step="0.01" />
```

### Card
Container component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

### Badge
Small status indicator or label.

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
```

### Table
Accessible table components.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Alert
Informational alert/notification component.

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

<Alert variant="default">
  <AlertTitle>Info</AlertTitle>
  <AlertDescription>This is an informational message.</AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertDescription>Error occurred!</AlertDescription>
</Alert>
```

### Spinner
Loading indicator.

```tsx
import { Spinner } from "@/components/ui/spinner";

<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
```

## Layout Components

### Navbar
Top navigation bar with authentication state.

```tsx
import { Navbar } from "@/components/layout/navbar";

// Used in dashboard layout - handles navigation and sign out
<Navbar />
```

**Features:**
- Dynamic navigation links
- User session display
- Sign out functionality
- Active link highlighting

### Footer
Simple footer component.

```tsx
import { Footer } from "@/components/layout/footer";

<Footer />
```

## Quote Components

### QuoteForm
Multi-step form for creating/editing quotes.

```tsx
import { QuoteForm } from "@/components/quotes/quote-form";

// Create new quote
<QuoteForm />

// Edit existing quote
<QuoteForm initialData={quoteData} quoteId="123" />
```

**Steps:**
1. Property Details (purchase price, location, size, type)
2. Additional Info (CapEx, multiple properties, rush fee)
3. Client Info (owner name, address, notes)
4. Review & Calculate (preview before saving)

**Features:**
- Real-time validation with Zod
- Step-by-step navigation
- Calculation preview
- Error handling

### PaymentOptions
Displays three payment plan options.

```tsx
import { PaymentOptions } from "@/components/quotes/payment-options";

<PaymentOptions paymentOptions={{
  upfront: { amount: 9500, discount: 5 },
  fiftyFifty: { firstPayment: 5500, secondPayment: 5500, total: 11000 },
  monthly: { monthlyAmount: 1000, numberOfMonths: 12, total: 12000 }
}} />
```

### DepreciationTable
Year-by-year depreciation schedule.

```tsx
import { DepreciationTable } from "@/components/quotes/depreciation-table";

<DepreciationTable depreciationSummary={{
  method: "39-year",
  year1: 50000,
  year2: 80000,
  // ... other years
  totalTax: 200000
}} />
```

### ComparisonChart
Visual breakdown using Recharts.

```tsx
import { ComparisonChart } from "@/components/quotes/comparison-chart";

<ComparisonChart data={{
  buildingValue: 800000,
  landValue: 200000,
  bidAmount: 10000
}} />
```

## Utility Functions

Located in `src/lib/utils.ts`:

```tsx
import { formatCurrency, formatDate, formatDateShort, formatNumber, formatPercentage } from "@/lib/utils";

formatCurrency(10000) // "$10,000"
formatDate(new Date()) // "January 15, 2024"
formatDateShort(new Date()) // "Jan 15, 2024"
formatNumber(1234567) // "1,234,567"
formatPercentage(0.05, 1) // "5.0%"
```

## Styling

All components use Tailwind CSS with a custom design system defined in `tailwind.config.js` and `globals.css`.

### CSS Variables
Custom colors are defined using HSL values:
- `--primary`: Primary brand color
- `--secondary`: Secondary color
- `--destructive`: Error/danger color
- `--muted`: Muted text/background
- `--accent`: Accent color

### Dark Mode
Dark mode is supported through the `dark` class on the root element.

## Best Practices

1. **Component Composition**: Build complex UIs from simple, reusable components
2. **Type Safety**: All components are fully typed with TypeScript
3. **Accessibility**: Components follow WCAG guidelines
4. **Responsive**: Mobile-first responsive design
5. **Performance**: Use React.memo and useCallback where appropriate

## Examples

See the page implementations in `src/app/(dashboard)/` for real-world usage examples:
- Dashboard page: Statistics and recent quotes
- Quotes list: Table with filtering and sorting
- Quote detail: Full quote display with charts
- Quote creation: Multi-step form flow
