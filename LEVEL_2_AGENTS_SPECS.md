# Level 2: Domain Specialist Agents - Complete Specifications

## Overview
Six specialized agents reporting to the Chief Architect Agent, each responsible for a specific domain of the OpenAsApp project.

---

## 2.1 Backend Infrastructure Agent

### Identity
- **Name:** Backend Infrastructure Agent (BIA)
- **Reports To:** Chief Architect Agent
- **Manages:** 4 Level 3 Agents (API, Database, Auth, Integration)

### Core Responsibilities
1. Build serverless API on Vercel
2. Design and implement database schema
3. Implement authentication and authorization
4. Create integration layer for external services
5. Error handling and logging
6. API documentation

### Deliverables

#### Week 1-2: Foundation
- [ ] Next.js API routes structure
- [ ] Prisma schema and initial migration
- [ ] Authentication system (NextAuth.js)
- [ ] Environment configuration
- [ ] Error handling middleware
- [ ] Logging setup (Winston/Pino)

#### Week 3-4: Core APIs
- [ ] Quote CRUD endpoints
- [ ] Template management endpoints
- [ ] User management endpoints
- [ ] File upload endpoints
- [ ] Export endpoints (PDF/Excel)

#### Week 5-6: Integration & Polish
- [ ] Webhook handlers
- [ ] Rate limiting
- [ ] API versioning
- [ ] OpenAPI documentation
- [ ] Integration testing

### Technical Stack
```typescript
// Core Technologies
- Next.js 14 API Routes
- Prisma ORM
- Vercel Postgres
- NextAuth.js
- Zod for validation
- Winston for logging

// API Structure
/api
  /auth
    /[...nextauth].ts  // NextAuth handlers
  /quotes
    /index.ts          // GET, POST /api/quotes
    /[id].ts           // GET, PUT, DELETE /api/quotes/:id
    /export.ts         // POST /api/quotes/export
  /templates
    /index.ts          // Template CRUD
    /[id].ts
  /pdf
    /parse.ts          // POST /api/pdf/parse
    /extract.ts        // POST /api/pdf/extract
  /gpt
    /quote
      /create.ts       // GPT Action endpoints
      /list.ts
    /pdf
      /parse.ts
  /webhooks
    /payment.ts
    /notification.ts
```

### API Implementation Examples

#### Quote Creation Endpoint
```typescript
// /api/quotes/index.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { CreateQuoteSchema } from '@/lib/validations/quote';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validated = CreateQuoteSchema.parse(body);

    // Calculate totals
    const items = validated.items.map((item, index) => {
      const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
      return {
        ...item,
        lineTotal,
        sortOrder: index,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = subtotal * (validated.taxRate || 0) / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quote in database
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        userId: session.user.id,
        clientName: validated.clientName,
        clientEmail: validated.clientEmail,
        clientPhone: validated.clientPhone,
        clientAddress: validated.clientAddress,
        subtotal,
        taxRate: validated.taxRate || 0,
        taxAmount,
        totalAmount,
        notes: validated.notes,
        validUntil: validated.validUntil,
        templateId: validated.templateId,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'quote',
        resourceId: quote.id,
        details: { quoteNumber: quote.quoteNumber },
      },
    });

    return NextResponse.json(quote, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Quote creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateQuoteNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const lastQuote = await prisma.quote.findFirst({
    where: {
      quoteNumber: {
        startsWith: `Q${year}${month}`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let sequence = 1;
  if (lastQuote) {
    const lastSequence = parseInt(lastQuote.quoteNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `Q${year}${month}${String(sequence).padStart(4, '0')}`;
}
```

#### Authentication Setup
```typescript
// /api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials');
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

export default NextAuth(authOptions);
```

### Level 3 Agent Coordination

#### Daily Check-ins
- Review completed API endpoints
- Validate database migrations
- Check authentication flows
- Test integration points

#### Weekly Deliverables
- Completed API endpoints (documented)
- Database migrations
- Integration tests
- API documentation updates

---

## 2.2 Frontend Application Agent

### Identity
- **Name:** Frontend Application Agent (FAA)
- **Reports To:** Chief Architect Agent
- **Manages:** 4 Level 3 Agents (UI Component, Form Builder, State, Styling)

### Core Responsibilities
1. Build Next.js frontend application
2. Create component library
3. Implement state management
4. Form handling and validation
5. Responsive design
6. Accessibility compliance

### Deliverables

#### Week 1-2: Foundation
- [ ] Next.js app structure
- [ ] Tailwind + shadcn/ui setup
- [ ] Component library foundation
- [ ] State management (Zustand)
- [ ] Layout components
- [ ] Theme configuration

#### Week 3-4: Core Features
- [ ] Quote creation form
- [ ] Quote list/table view
- [ ] Quote detail view
- [ ] Template management UI
- [ ] User dashboard
- [ ] Settings page

#### Week 5-6: Enhancement & Polish
- [ ] PDF upload and preview
- [ ] Export functionality UI
- [ ] Notifications/toasts
- [ ] Loading states
- [ ] Error boundaries
- [ ] Mobile responsiveness

### Component Structure
```
/components
  /ui                 // shadcn/ui base components
    /button.tsx
    /input.tsx
    /select.tsx
    /dialog.tsx
    /table.tsx
  /forms              // Form components
    /QuoteForm.tsx
    /TemplateForm.tsx
    /ItemForm.tsx
  /quote              // Quote-specific
    /QuoteCard.tsx
    /QuoteTable.tsx
    /QuoteDetail.tsx
    /QuoteExport.tsx
  /pdf                // PDF-related
    /PdfUpload.tsx
    /PdfPreview.tsx
    /ParsedDataView.tsx
  /layout             // Layout components
    /Header.tsx
    /Sidebar.tsx
    /Footer.tsx
  /providers          // Context providers
    /ThemeProvider.tsx
    /AuthProvider.tsx
```

### Key Component Examples

#### Quote Form
```typescript
// components/forms/QuoteForm.tsx
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateQuoteSchema } from '@/lib/validations/quote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateQuote } from '@/hooks/useQuotes';

export function QuoteForm() {
  const createQuote = useCreateQuote();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateQuoteSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, discount: 0 }],
      taxRate: 0,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const taxRate = watch('taxRate') || 0;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100);
    return sum + lineTotal;
  }, 0);

  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const onSubmit = async (data) => {
    try {
      await createQuote.mutateAsync(data);
      // Show success toast
      // Redirect to quote detail
    } catch (error) {
      // Show error toast
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Client Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Client Information</h2>

        <div>
          <Label htmlFor="clientName">Client Name *</Label>
          <Input
            id="clientName"
            {...register('clientName')}
            placeholder="Enter client name"
          />
          {errors.clientName && (
            <p className="text-sm text-red-500 mt-1">{errors.clientName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            {...register('clientEmail')}
            placeholder="client@example.com"
          />
          {errors.clientEmail && (
            <p className="text-sm text-red-500 mt-1">{errors.clientEmail.message}</p>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Line Items</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: '', quantity: 1, unitPrice: 0, discount: 0 })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Item {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor={`items.${index}.description`}>Description</Label>
                <Input
                  {...register(`items.${index}.description`)}
                  placeholder="Item description"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor={`items.${index}.unitPrice`}>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor={`items.${index}.discount`}>Discount %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.discount`, { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="text-right text-sm">
                Line Total: ${(
                  (items[index]?.quantity || 0) *
                  (items[index]?.unitPrice || 0) *
                  (1 - (items[index]?.discount || 0) / 100)
                ).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        <div>
          <Label htmlFor="taxRate">Tax Rate %</Label>
          <Input
            type="number"
            step="0.01"
            {...register('taxRate', { valueAsNumber: true })}
            className="w-32"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span>Tax:</span>
          <span className="font-medium">${taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          {...register('notes')}
          className="w-full min-h-[100px] rounded-md border p-3"
          placeholder="Additional notes..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Save as Draft
        </Button>
        <Button type="submit" disabled={createQuote.isLoading}>
          {createQuote.isLoading ? 'Creating...' : 'Create Quote'}
        </Button>
      </div>
    </form>
  );
}
```

### State Management Setup
```typescript
// store/useQuoteStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuoteStore {
  // State
  currentQuote: Quote | null;
  quotes: Quote[];
  filters: QuoteFilters;

  // Actions
  setCurrentQuote: (quote: Quote | null) => void;
  setQuotes: (quotes: Quote[]) => void;
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  setFilters: (filters: Partial<QuoteFilters>) => void;
  resetFilters: () => void;
}

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set) => ({
      currentQuote: null,
      quotes: [],
      filters: {
        status: [],
        dateFrom: null,
        dateTo: null,
        search: '',
      },

      setCurrentQuote: (quote) => set({ currentQuote: quote }),

      setQuotes: (quotes) => set({ quotes }),

      addQuote: (quote) =>
        set((state) => ({ quotes: [quote, ...state.quotes] })),

      updateQuote: (id, updates) =>
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? { ...q, ...updates } : q
          ),
          currentQuote:
            state.currentQuote?.id === id
              ? { ...state.currentQuote, ...updates }
              : state.currentQuote,
        })),

      deleteQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
          currentQuote: state.currentQuote?.id === id ? null : state.currentQuote,
        })),

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),

      resetFilters: () =>
        set({
          filters: {
            status: [],
            dateFrom: null,
            dateTo: null,
            search: '',
          },
        }),
    }),
    {
      name: 'quote-storage',
      partialize: (state) => ({ quotes: state.quotes }), // Only persist quotes
    }
  )
);
```

---

## 2.3 Quote Engine Agent

### Identity
- **Name:** Quote Engine Agent (QEA)
- **Reports To:** Chief Architect Agent
- **Manages:** 4 Level 3 Agents (Calculation, Template, Export, Validation)

### Core Responsibilities
1. Replicate Excel formula logic
2. Quote calculation engine
3. Template management system
4. Export generation (PDF, Excel)
5. Business rules validation
6. Version control for quotes

### Deliverables

#### Week 1-2: Calculation Engine
- [ ] Formula parser
- [ ] Basic calculations (sum, tax, discount)
- [ ] Advanced formulas (conditional, lookup)
- [ ] Currency handling
- [ ] Rounding rules

#### Week 3-4: Template System
- [ ] Template data model
- [ ] Template CRUD operations
- [ ] Variable substitution
- [ ] Conditional logic
- [ ] Default templates

#### Week 5-6: Export & Validation
- [ ] PDF generation
- [ ] Excel export
- [ ] Email templates
- [ ] Business rule validation
- [ ] Data integrity checks

### Calculation Engine Implementation
```typescript
// lib/quote-engine/calculator.ts

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  taxable?: boolean;
}

export interface QuoteCalculation {
  items: Array<QuoteItem & { lineTotal: number }>;
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

export class QuoteCalculator {
  private taxRate: number;

  constructor(taxRate: number = 0) {
    this.taxRate = taxRate;
  }

  /**
   * Calculate line total for a single item
   */
  calculateLineTotal(item: QuoteItem): number {
    const beforeDiscount = item.quantity * item.unitPrice;
    const discountAmount = beforeDiscount * (item.discount / 100);
    const lineTotal = beforeDiscount - discountAmount;

    return this.round(lineTotal);
  }

  /**
   * Calculate full quote with all items
   */
  calculate(items: QuoteItem[]): QuoteCalculation {
    const itemsWithTotals = items.map(item => ({
      ...item,
      lineTotal: this.calculateLineTotal(item),
    }));

    const subtotal = this.round(
      itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0)
    );

    const discountTotal = this.round(
      items.reduce((sum, item) => {
        const beforeDiscount = item.quantity * item.unitPrice;
        const discountAmount = beforeDiscount * (item.discount / 100);
        return sum + discountAmount;
      }, 0)
    );

    // Calculate tax only on taxable items
    const taxableAmount = this.round(
      itemsWithTotals
        .filter(item => item.taxable !== false)
        .reduce((sum, item) => sum + item.lineTotal, 0)
    );

    const taxAmount = this.round(taxableAmount * (this.taxRate / 100));

    const total = this.round(subtotal + taxAmount);

    return {
      items: itemsWithTotals,
      subtotal,
      discountTotal,
      taxableAmount,
      taxAmount,
      total,
    };
  }

  /**
   * Round to 2 decimal places
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  }

  /**
   * Apply bulk discount
   */
  applyBulkDiscount(items: QuoteItem[], threshold: number, discount: number): QuoteItem[] {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    if (total >= threshold) {
      return items.map(item => ({
        ...item,
        discount: Math.max(item.discount, discount),
      }));
    }

    return items;
  }
}

// Formula evaluator for custom calculations
export class FormulaEvaluator {
  /**
   * Evaluate a formula string with context
   * Example: "=QUANTITY * UNIT_PRICE * (1 - DISCOUNT/100)"
   */
  evaluate(formula: string, context: Record<string, number>): number {
    try {
      // Remove '=' prefix if present
      let expr = formula.trim().startsWith('=') ? formula.slice(1) : formula;

      // Replace context variables
      Object.keys(context).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expr = expr.replace(regex, String(context[key]));
      });

      // Support common Excel-like functions
      expr = this.replaceExcelFunctions(expr);

      // Safely evaluate (in production, use a proper expression parser)
      // For now, using Function constructor (be very careful with user input!)
      const result = new Function('return ' + expr)();

      return typeof result === 'number' ? result : 0;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return 0;
    }
  }

  private replaceExcelFunctions(expr: string): string {
    // SUM([a, b, c])
    expr = expr.replace(/SUM\(\[([^\]]+)\]\)/g, (_, args) => {
      return `[${args}].reduce((a, b) => a + b, 0)`;
    });

    // IF(condition, trueValue, falseValue)
    expr = expr.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/g, (_, cond, trueVal, falseVal) => {
      return `(${cond} ? ${trueVal} : ${falseVal})`;
    });

    // ROUND(value, decimals)
    expr = expr.replace(/ROUND\(([^,]+),(\d+)\)/g, (_, value, decimals) => {
      return `Math.round(${value} * Math.pow(10, ${decimals})) / Math.pow(10, ${decimals})`;
    });

    return expr;
  }
}
```

### PDF Export Implementation
```typescript
// lib/quote-engine/pdf-generator.ts
import PDFDocument from 'pdfkit';
import { Quote } from '@prisma/client';

export class PdfGenerator {
  async generateQuotePdf(quote: Quote): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc
          .fontSize(20)
          .text('QUOTE', { align: 'center' })
          .moveDown();

        // Quote info
        doc
          .fontSize(10)
          .text(`Quote Number: ${quote.quoteNumber}`, { align: 'right' })
          .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
          .moveDown();

        // Client info
        doc
          .fontSize(12)
          .text('Bill To:', { underline: true })
          .fontSize(10)
          .text(quote.clientName)
          .text(quote.clientEmail || '')
          .moveDown();

        // Line items table
        const tableTop = doc.y;
        const tableHeaders = ['Description', 'Qty', 'Price', 'Discount', 'Total'];
        const colWidths = [250, 50, 70, 70, 70];
        let xPos = 50;

        // Table headers
        doc.fontSize(10).font('Helvetica-Bold');
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'left' });
          xPos += colWidths[i];
        });

        // Table rows
        doc.font('Helvetica');
        let yPos = tableTop + 20;
        quote.items.forEach((item) => {
          xPos = 50;
          doc.text(item.description, xPos, yPos, { width: colWidths[0] });
          xPos += colWidths[0];
          doc.text(String(item.quantity), xPos, yPos, { width: colWidths[1] });
          xPos += colWidths[1];
          doc.text(`$${item.unitPrice.toFixed(2)}`, xPos, yPos, { width: colWidths[2] });
          xPos += colWidths[2];
          doc.text(`${item.discount}%`, xPos, yPos, { width: colWidths[3] });
          xPos += colWidths[3];
          doc.text(`$${item.lineTotal.toFixed(2)}`, xPos, yPos, { width: colWidths[4] });

          yPos += 25;
        });

        // Totals
        yPos += 20;
        const totalsX = 420;
        doc.font('Helvetica-Bold');
        doc.text('Subtotal:', totalsX - 80, yPos);
        doc.text(`$${quote.subtotal.toFixed(2)}`, totalsX, yPos);

        yPos += 20;
        doc.text(`Tax (${quote.taxRate}%):`, totalsX - 80, yPos);
        doc.text(`$${quote.taxAmount.toFixed(2)}`, totalsX, yPos);

        yPos += 20;
        doc.fontSize(12);
        doc.text('Total:', totalsX - 80, yPos);
        doc.text(`$${quote.totalAmount.toFixed(2)}`, totalsX, yPos);

        // Notes
        if (quote.notes) {
          doc.moveDown(2);
          doc.fontSize(10).font('Helvetica');
          doc.text('Notes:', { underline: true });
          doc.text(quote.notes);
        }

        // Footer
        doc
          .fontSize(8)
          .text(
            'Thank you for your business!',
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
```

---

## 2.4 PDF Parser Agent

### Identity
- **Name:** PDF Parser Agent (PPA)
- **Reports To:** Chief Architect Agent
- **Manages:** 4 Level 3 Agents (Extraction, Mapping, OCR, Validation)

### Core Responsibilities
1. Integrate existing PDF parser
2. Extract text from PDFs
3. Parse structured data
4. Entity recognition
5. Quote data extraction
6. OCR for scanned docs

### Deliverables

#### Week 1-2: Core Parsing
- [ ] PDF text extraction
- [ ] Table detection
- [ ] Metadata parsing
- [ ] Multi-page handling
- [ ] Error handling

#### Week 3-4: Data Extraction
- [ ] Pattern recognition for quotes
- [ ] Field mapping
- [ ] Entity extraction
- [ ] Confidence scoring
- [ ] Validation rules

#### Week 5-6: Enhancement
- [ ] OCR integration
- [ ] Handwriting support
- [ ] Multi-format support
- [ ] Batch processing
- [ ] Performance optimization

### PDF Parser Implementation
```typescript
// lib/pdf-parser/parser.ts
import pdf from 'pdf-parse';

export interface ParsedPdfData {
  text: string;
  metadata: {
    author?: string;
    title?: string;
    pages: number;
    createdAt?: Date;
  };
  extracted: {
    clientName?: string;
    clientEmail?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal?: number;
    tax?: number;
    total?: number;
  };
  confidence: number; // 0-100
}

export class PdfParser {
  async parse(buffer: Buffer): Promise<ParsedPdfData> {
    // Extract raw text from PDF
    const data = await pdf(buffer);

    // Extract metadata
    const metadata = {
      author: data.info?.Author,
      title: data.info?.Title,
      pages: data.numpages,
      createdAt: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
    };

    // Extract structured data
    const extracted = this.extractQuoteData(data.text);

    // Calculate confidence score
    const confidence = this.calculateConfidence(extracted);

    return {
      text: data.text,
      metadata,
      extracted,
      confidence,
    };
  }

  private extractQuoteData(text: string): ParsedPdfData['extracted'] {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // Extract client name (usually near top)
    const clientName = this.extractClientName(lines);

    // Extract email
    const clientEmail = this.extractEmail(text);

    // Extract line items (description, qty, price, total)
    const items = this.extractLineItems(lines);

    // Extract totals
    const totals = this.extractTotals(lines);

    return {
      clientName,
      clientEmail,
      items,
      ...totals,
    };
  }

  private extractClientName(lines: string[]): string | undefined {
    // Look for patterns like "Bill To:", "Client:", "Customer:"
    const clientIndicators = ['bill to', 'client', 'customer', 'attention'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (clientIndicators.some(indicator => line.includes(indicator))) {
        // Name is likely on the next line
        return lines[i + 1];
      }
    }

    return undefined;
  }

  private extractEmail(text: string): string | undefined {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : undefined;
  }

  private extractLineItems(lines: string[]): Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> {
    const items: any[] = [];

    // Look for table-like patterns
    // Example: "Product Description    2    $50.00    $100.00"
    const itemPattern = /^(.+?)\s+(\d+\.?\d*)\s+\$?(\d+\.?\d+)\s+\$?(\d+\.?\d+)$/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        items.push({
          description: match[1].trim(),
          quantity: parseFloat(match[2]),
          unitPrice: parseFloat(match[3]),
          total: parseFloat(match[4]),
        });
      }
    }

    return items;
  }

  private extractTotals(lines: string[]): {
    subtotal?: number;
    tax?: number;
    total?: number;
  } {
    const totals: any = {};

    const subtotalPattern = /subtotal:?\s*\$?(\d+\.?\d+)/i;
    const taxPattern = /tax:?\s*\$?(\d+\.?\d+)/i;
    const totalPattern = /^total:?\s*\$?(\d+\.?\d+)/i;

    for (const line of lines) {
      const subtotalMatch = line.match(subtotalPattern);
      if (subtotalMatch) {
        totals.subtotal = parseFloat(subtotalMatch[1]);
      }

      const taxMatch = line.match(taxPattern);
      if (taxMatch) {
        totals.tax = parseFloat(taxMatch[1]);
      }

      const totalMatch = line.match(totalPattern);
      if (totalMatch) {
        totals.total = parseFloat(totalMatch[1]);
      }
    }

    return totals;
  }

  private calculateConfidence(extracted: ParsedPdfData['extracted']): number {
    let score = 0;
    let maxScore = 0;

    // Client name (20 points)
    maxScore += 20;
    if (extracted.clientName) score += 20;

    // Items (40 points)
    maxScore += 40;
    if (extracted.items.length > 0) {
      score += Math.min(40, extracted.items.length * 10);
    }

    // Totals (40 points)
    maxScore += 40;
    if (extracted.subtotal) score += 15;
    if (extracted.tax) score += 10;
    if (extracted.total) score += 15;

    return Math.round((score / maxScore) * 100);
  }
}
```

---

## 2.5 ChatGPT Integration Agent

### Identity
- **Name:** ChatGPT Integration Agent (CIA)
- **Reports To:** Chief Architect Agent
- **Manages:** 4 Level 3 Agents (Schema, Conversation, Testing, Documentation)

### Core Responsibilities
1. OpenAI API integration
2. GPT Action schema creation
3. OAuth 2.0 setup for GPT Actions
4. Conversation flow design
5. OpenAI submission preparation
6. Testing and validation

### Deliverables

#### Week 9-10: GPT Integration
- [ ] GPT Action schema (OpenAPI 3.1.0)
- [ ] OAuth 2.0 implementation
- [ ] GPT-specific API endpoints
- [ ] Conversation prompts
- [ ] Error handling for GPT
- [ ] Testing scenarios

#### Week 10: Submission
- [ ] Privacy policy
- [ ] Terms of service
- [ ] User documentation
- [ ] Example conversations
- [ ] Screenshots/demo
- [ ] OpenAI submission

### GPT Action Schema
```yaml
# gpt-action-schema.yaml
openapi: 3.1.0
info:
  title: OpenAsApp GPT Integration
  description: Create professional quotes and parse PDF documents through ChatGPT
  version: 1.0.0

servers:
  - url: https://openasapp.vercel.app
    description: Production API

paths:
  /api/gpt/quote/create:
    post:
      operationId: createQuote
      summary: Create a new quote
      description: |
        Creates a professional quote with line items, client information, and automatic calculations.
        Returns the created quote with a shareable link and export options.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - clientName
                - items
              properties:
                clientName:
                  type: string
                  description: The client or company name
                  example: "Acme Corporation"
                clientEmail:
                  type: string
                  format: email
                  description: Client's email address
                  example: "contact@acme.com"
                clientPhone:
                  type: string
                  description: Client's phone number
                  example: "+1-555-0123"
                items:
                  type: array
                  description: Line items for the quote
                  minItems: 1
                  items:
                    type: object
                    required:
                      - description
                      - quantity
                      - unitPrice
                    properties:
                      description:
                        type: string
                        description: Description of the product or service
                        example: "Web Development Services"
                      quantity:
                        type: number
                        description: Quantity of items
                        minimum: 0.01
                        example: 40
                      unitPrice:
                        type: number
                        description: Price per unit
                        minimum: 0
                        example: 150
                      discount:
                        type: number
                        description: Discount percentage (0-100)
                        minimum: 0
                        maximum: 100
                        default: 0
                        example: 10
                taxRate:
                  type: number
                  description: Tax rate percentage (0-100)
                  minimum: 0
                  maximum: 100
                  default: 0
                  example: 8.5
                notes:
                  type: string
                  description: Additional notes or terms
                  example: "Payment due within 30 days"
                validUntil:
                  type: string
                  format: date
                  description: Quote expiration date
                  example: "2025-11-20"
      responses:
        '200':
          description: Quote created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    example: "quote_123abc"
                  quoteNumber:
                    type: string
                    example: "Q202510-0001"
                  clientName:
                    type: string
                  subtotal:
                    type: number
                    example: 5400
                  taxAmount:
                    type: number
                    example: 459
                  totalAmount:
                    type: number
                    example: 5859
                  pdfUrl:
                    type: string
                    format: uri
                    example: "https://openasapp.vercel.app/quotes/quote_123abc.pdf"
                  shareUrl:
                    type: string
                    format: uri
                    example: "https://openasapp.vercel.app/quotes/quote_123abc"
                  message:
                    type: string
                    example: "Quote Q202510-0001 created successfully! Total: $5,859.00"
        '400':
          description: Invalid request
        '401':
          description: Unauthorized

  /api/gpt/quote/list:
    get:
      operationId: listQuotes
      summary: List recent quotes
      description: Get a list of the user's recent quotes
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 10
          description: Number of quotes to return
        - name: status
          in: query
          schema:
            type: string
            enum: [DRAFT, SENT, ACCEPTED, REJECTED]
          description: Filter by quote status
      responses:
        '200':
          description: List of quotes
          content:
            application/json:
              schema:
                type: object
                properties:
                  quotes:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        quoteNumber:
                          type: string
                        clientName:
                          type: string
                        totalAmount:
                          type: number
                        status:
                          type: string
                        createdAt:
                          type: string
                          format: date-time

  /api/gpt/pdf/parse:
    post:
      operationId: parsePdfDocument
      summary: Parse a PDF document
      description: |
        Extract quote information from a PDF file. Supports standard quote/invoice PDFs.
        Returns extracted client info, line items, and totals with confidence score.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - pdfUrl
              properties:
                pdfUrl:
                  type: string
                  format: uri
                  description: Public URL of the PDF file to parse
                  example: "https://example.com/quote.pdf"
                createQuote:
                  type: boolean
                  description: Automatically create a quote from parsed data
                  default: false
      responses:
        '200':
          description: PDF parsed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  clientName:
                    type: string
                  clientEmail:
                    type: string
                  items:
                    type: array
                    items:
                      type: object
                  subtotal:
                    type: number
                  tax:
                    type: number
                  total:
                    type: number
                  confidence:
                    type: number
                    description: Confidence score (0-100)
                  message:
                    type: string
                  quoteId:
                    type: string
                    description: ID of created quote (if createQuote was true)

components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://openasapp.vercel.app/oauth/authorize
          tokenUrl: https://openasapp.vercel.app/oauth/token
          scopes:
            quotes:read: Read access to quotes
            quotes:write: Create and modify quotes
            pdf:parse: Parse PDF documents

security:
  - OAuth2:
      - quotes:read
      - quotes:write
      - pdf:parse
```

### OAuth 2.0 Implementation
```typescript
// app/api/oauth/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateAuthCode } from '@/lib/oauth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope');

  // Validate OAuth client
  if (clientId !== process.env.OPENAI_CLIENT_ID) {
    return new NextResponse('Invalid client_id', { status: 400 });
  }

  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Generate authorization code
  const authCode = await generateAuthCode(session.user.id, scope);

  // Redirect back to OpenAI with auth code
  const callback = new URL(redirectUri!);
  callback.searchParams.set('code', authCode);
  if (state) callback.searchParams.set('state', state);

  return NextResponse.redirect(callback);
}

// app/api/oauth/token/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { grant_type, code, client_id, client_secret } = body;

  // Validate client credentials
  if (
    client_id !== process.env.OPENAI_CLIENT_ID ||
    client_secret !== process.env.OPENAI_CLIENT_SECRET
  ) {
    return NextResponse.json(
      { error: 'invalid_client' },
      { status: 401 }
    );
  }

  if (grant_type === 'authorization_code') {
    // Exchange auth code for access token
    const userId = await validateAuthCode(code);

    if (!userId) {
      return NextResponse.json(
        { error: 'invalid_grant' },
        { status: 400 }
      );
    }

    const accessToken = await generateAccessToken(userId);
    const refreshToken = await generateRefreshToken(userId);

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
    });
  }

  return NextResponse.json(
    { error: 'unsupported_grant_type' },
    { status: 400 }
  );
}
```

---

## 2.6 DevOps & Deployment Agent

### Identity
- **Name:** DevOps & Deployment Agent (DDA)
- **Reports To:** Chief Architect Agent
- **Manages:** 4 Level 3 Agents (Vercel Config, CI/CD, Monitoring, Performance)

### Core Responsibilities
1. Vercel configuration and deployment
2. CI/CD pipeline setup
3. Environment management
4. Monitoring and logging
5. Performance optimization
6. Backup and recovery

### Deliverables

#### Week 1-2: Infrastructure
- [ ] Vercel project setup
- [ ] Environment variables configuration
- [ ] Database provisioning (Vercel Postgres)
- [ ] File storage setup (Vercel Blob)
- [ ] Domain configuration

#### Week 3-4: CI/CD
- [ ] GitHub Actions workflows
- [ ] Automated testing pipeline
- [ ] Deployment automation
- [ ] Preview deployments
- [ ] Production deployment strategy

#### Week 5-6: Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Alert configuration

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_URL": "@nextauth_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "OPENAI_API_KEY": "@openai_api_key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://openasapp.vercel.app"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/v1/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next

  deploy-preview:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g vercel
      - run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g vercel
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Cross-Agent Communication

### Daily Standup Format
Each Level 2 agent provides:
1. **Completed yesterday:** List of finished tasks
2. **Working on today:** Current priorities
3. **Blockers:** Any impediments
4. **Help needed:** Requests for other agents

### Integration Points
- **BIA ↔ FAA:** API contracts, response schemas
- **BIA ↔ QEA:** Quote calculation endpoints
- **BIA ↔ PPA:** PDF upload and parsing endpoints
- **BIA ↔ CIA:** GPT Action endpoints
- **FAA ↔ QEA:** Quote UI components
- **FAA ↔ PPA:** PDF upload UI
- **All → DDA:** Deployment requirements

### Weekly Sync Agenda
1. Demo completed features (15 min)
2. Review integration points (15 min)
3. Discuss blockers (15 min)
4. Plan next sprint (10 min)
5. Q&A (5 min)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-20
**Managed By:** Chief Architect Agent
