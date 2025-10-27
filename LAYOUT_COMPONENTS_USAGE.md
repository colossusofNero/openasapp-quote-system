# RCG Valuation Layout Components - Usage Guide

## Overview
This document provides examples of how to use the newly created layout and structure components for the RCG Valuation design transformation.

## Components Created

### 1. InfoCard Component
Location: `src/components/ui/info-card.tsx`

A reusable card component for displaying key metrics with optional help text tooltips.

**Features:**
- Large formatted value display (currency or number)
- Label with optional info icon tooltip
- Optional icon display
- White background with hover shadow effect
- Uses tabular-nums for consistent number alignment
- Smooth transitions and hover states

**Usage Example:**
```tsx
import { InfoCard, formatCurrency } from "@/components/ui/info-card";
import { DollarSign, TrendingUp } from "lucide-react";

// Basic usage
<InfoCard
  label="Total Value"
  value={formatCurrency(250000)}
  helpText="This is the total estimated property value"
/>

// With icon
<InfoCard
  label="Tax Savings"
  value={formatCurrency(45000)}
  helpText="Estimated first-year tax savings from cost segregation"
  icon={<TrendingUp className="w-6 h-6" />}
/>

// With number
<InfoCard
  label="Properties Analyzed"
  value={1234}
  helpText="Total number of properties in our database"
/>

// Grid layout example
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <InfoCard label="Total Quotes" value={stats.total} />
  <InfoCard label="Active Projects" value={stats.active} />
  <InfoCard label="Completed" value={stats.completed} />
  <InfoCard label="Revenue" value={formatCurrency(stats.revenue)} />
</div>
```

**Helper Functions:**
- `formatCurrency(value: number)`: Formats as USD currency
- `formatPercentage(value: number, decimals?: number)`: Formats as percentage

---

### 2. SectionHeader Component
Location: `src/components/ui/section-header.tsx`

A header component for page sections with optional description and action button.

**Features:**
- Title using Poppins font
- Optional description text
- Optional action button/element on right
- Border bottom separator
- Proper spacing (mb-6, pb-4)

**Usage Example:**
```tsx
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";

// Basic usage
<SectionHeader
  title="Recent Quotes"
  description="Your latest quote activity"
/>

// With action button
<SectionHeader
  title="Property Details"
  description="Information about the property being analyzed"
  action={
    <Button variant="outline">Edit Details</Button>
  }
/>

// With custom action
<SectionHeader
  title="Financial Summary"
  description="Key metrics and calculations"
  action={
    <div className="flex gap-2">
      <Button variant="ghost" size="sm">Export</Button>
      <Button size="sm">Share Report</Button>
    </div>
  }
/>
```

---

### 3. Tooltip Component
Location: `src/components/ui/tooltip.tsx`

A lightweight tooltip component for displaying help text on hover/focus.

**Features:**
- Pure CSS implementation (no dependencies)
- Supports 4 positions: top, right, bottom, left
- Smooth fade-in animation
- Keyboard accessible
- Automatic positioning
- Dark navy background matching RCG brand

**Usage Example:**
```tsx
import { Tooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

// Basic usage
<Tooltip content="This is helpful information" side="top">
  <button className="text-rcg-text-gray hover:text-rcg-blue">
    <Info className="w-4 h-4" />
  </button>
</Tooltip>

// Different positions
<Tooltip content="Appears on the right" side="right">
  <span>Hover me</span>
</Tooltip>

// In a form label
<div className="flex items-center gap-2">
  <label>Property Value</label>
  <Tooltip content="Enter the total purchase price of the property">
    <Info className="w-4 h-4 text-gray-400" />
  </Tooltip>
</div>
```

---

### 4. Updated Card Components
Location: `src/components/ui/card.tsx`

Enhanced the existing Card components with RCG styling.

**Updates:**
- Rounded corners changed from `rounded-lg` to `rounded-xl`
- White background with gray borders
- Hover shadow effect with blue border highlight
- CardTitle uses Poppins font and RCG navy color
- CardDescription uses RCG text gray color

**Usage Example:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Property Analysis</CardTitle>
    <CardDescription>
      Detailed breakdown of cost segregation opportunities
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your content here...</p>
  </CardContent>
</Card>

// Card with hover effect (automatic)
<Card className="cursor-pointer">
  {/* Hover effect is built-in */}
</Card>
```

---

### 5. Updated Dashboard Layout
Location: `src/app/(dashboard)/layout.tsx`

Enhanced the dashboard layout with RCG styling.

**Updates:**
- Gradient background: `from-gray-50 to-gray-100`
- Added `space-y-6` container for consistent spacing
- Max-width container (max-w-7xl) for content
- Proper responsive padding

**Structure:**
```tsx
// Layout structure
<div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
  <Navbar />
  <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="space-y-6">
      {children}
    </div>
  </main>
  <Footer />
</div>
```

---

## Complete Page Example

Here's a complete example combining all components:

```tsx
"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { InfoCard, formatCurrency, formatPercentage } from "@/components/ui/info-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Building, Calculator } from "lucide-react";

export default function AnalysisPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="Property Analysis Dashboard"
        description="Comprehensive cost segregation analysis and tax savings projections"
        action={<Button>Generate Report</Button>}
      />

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Property Value"
          value={formatCurrency(1250000)}
          helpText="Total purchase price of the property"
          icon={<Building className="w-6 h-6" />}
        />
        <InfoCard
          label="Estimated Savings"
          value={formatCurrency(245000)}
          helpText="First-year tax savings from cost segregation"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <InfoCard
          label="ROI"
          value={formatPercentage(325, 0)}
          helpText="Return on investment from cost segregation study"
          icon={<Calculator className="w-6 h-6" />}
        />
        <InfoCard
          label="Depreciable Assets"
          value={formatCurrency(850000)}
          helpText="Total value of assets eligible for accelerated depreciation"
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      {/* Detailed Section */}
      <SectionHeader
        title="Breakdown by Asset Class"
        description="Distribution of property components across depreciation schedules"
      />

      <Card>
        <CardHeader>
          <CardTitle>Asset Classification</CardTitle>
          <CardDescription>
            IRS-compliant categorization of building components
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Your detailed content here */}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## RCG Brand Colors Reference

All components use these colors from the Tailwind config:

```css
rcg-navy: #1E2949        /* Primary dark blue for headings */
rcg-blue: #4A90E2        /* Accent blue for highlights */
rcg-light-blue: #E8F3FF  /* Light blue backgrounds */
rcg-success: #10B981     /* Success/positive states */
rcg-text-gray: #6B7280   /* Body text and labels */
rcg-bg: #F9FAFB          /* Page backgrounds */
```

---

## Typography Classes

Available font families:
- `font-sans` - Inter (default body text)
- `font-poppins` - Poppins (headings and titles)
- `font-tabular-nums` - Tabular numbers for alignment

---

## Best Practices

1. **Spacing**: Use the `space-y-6` or `space-y-8` classes for vertical spacing between sections
2. **Cards**: Use the InfoCard for metrics, regular Card for content sections
3. **Headers**: Use SectionHeader to separate major page sections
4. **Tooltips**: Add helpful context with info icons, especially for technical terms
5. **Grid Layouts**: Use responsive grids for InfoCards (2 cols on tablet, 4 on desktop)
6. **Colors**: Stick to RCG brand colors for consistency
7. **Hover States**: Let the built-in hover effects work naturally
8. **Typography**: Use Poppins for headings, Inter for body text

---

## Responsive Design

All components are mobile-responsive:
- InfoCard: Stacks vertically on mobile
- SectionHeader: Action buttons move below title on small screens
- Grid layouts: Use `grid gap-4 md:grid-cols-2 lg:grid-cols-4` pattern

---

## Next Steps for Agent 3

These layout components are ready for Agent 3 to integrate into specific pages:
1. Quote creation wizard
2. Property analysis results
3. Client dashboard
4. Admin interfaces

The consistent spacing, colors, and patterns established here should be carried through to all pages.
