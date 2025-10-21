# Level 3: Task-Specific Agents - Complete Specifications

## Overview
24 specialized task-specific agents organized under 6 Level 2 domain specialists. These agents handle specific implementation tasks.

---

## Under Backend Infrastructure Agent (2.1)

### 3.1.1 API Development Agent

**Responsibilities:**
- Design RESTful endpoints
- Implement CRUD operations
- Request/response validation
- Error handling
- API versioning

**Specific Tasks:**
- [ ] Quote API endpoints (GET, POST, PUT, DELETE)
- [ ] Template API endpoints
- [ ] User management endpoints
- [ ] File upload endpoints
- [ ] Search and filter endpoints
- [ ] Pagination implementation
- [ ] Rate limiting per endpoint
- [ ] API response caching

**Deliverables:**
```typescript
/api/quotes/index.ts
/api/quotes/[id].ts
/api/quotes/search.ts
/api/templates/index.ts
/api/templates/[id].ts
/api/users/me.ts
/api/upload.ts
```

---

### 3.1.2 Database Agent

**Responsibilities:**
- Schema design
- Migration scripts
- Query optimization
- Indexing strategy
- Data seeding

**Specific Tasks:**
- [ ] Prisma schema definition
- [ ] Initial migration
- [ ] Seed data creation
- [ ] Query optimization
- [ ] Index creation
- [ ] Relationship definitions
- [ ] Constraint enforcement
- [ ] Backup strategy

**Deliverables:**
```prisma
// Complete schema.prisma
// Migration files in /prisma/migrations
// Seed script in /prisma/seed.ts
```

**Migration Example:**
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@openasapp.com' },
    update: {},
    create: {
      email: 'admin@openasapp.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log({ admin });

  // Create sample templates
  const webDevTemplate = await prisma.template.create({
    data: {
      userId: admin.id,
      name: 'Web Development Services',
      description: 'Standard web development quote template',
      items: [
        {
          description: 'Frontend Development',
          quantity: 40,
          unitPrice: 150,
          discount: 0,
        },
        {
          description: 'Backend API Development',
          quantity: 30,
          unitPrice: 150,
          discount: 0,
        },
        {
          description: 'Database Setup',
          quantity: 10,
          unitPrice: 150,
          discount: 0,
        },
      ],
      taxRate: 8.5,
      notes: 'Payment due within 30 days. 50% upfront.',
      isDefault: true,
    },
  });

  console.log({ webDevTemplate });

  // Create sample quotes
  for (let i = 1; i <= 5; i++) {
    await prisma.quote.create({
      data: {
        quoteNumber: `Q20251000${i}`,
        userId: admin.id,
        clientName: `Client ${i}`,
        clientEmail: `client${i}@example.com`,
        status: i === 1 ? 'SENT' : 'DRAFT',
        subtotal: 1000 * i,
        taxRate: 8.5,
        taxAmount: 85 * i,
        totalAmount: 1085 * i,
        items: {
          create: [
            {
              description: `Service ${i}`,
              quantity: 10,
              unitPrice: 100,
              discount: 0,
              lineTotal: 1000,
              sortOrder: 0,
            },
          ],
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

### 3.1.3 Authentication Agent

**Responsibilities:**
- JWT implementation
- OAuth 2.0 setup
- Session management
- Role-based access control
- API key management

**Specific Tasks:**
- [ ] NextAuth.js configuration
- [ ] JWT token generation/validation
- [ ] OAuth 2.0 for GPT Actions
- [ ] Password hashing (bcrypt)
- [ ] API key generation
- [ ] Permission middleware
- [ ] Session persistence
- [ ] Token refresh logic

**Deliverables:**
```typescript
// Middleware for protected routes
export function withAuth(handler) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = session.user;
    return handler(req, res);
  };
}

// Middleware for role-based access
export function withRole(...roles: string[]) {
  return function (handler) {
    return async (req, res) => {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !roles.includes(session.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.user = session.user;
      return handler(req, res);
    };
  };
}

// API Key validation
export async function validateApiKey(key: string) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key, isActive: true },
    include: { user: true },
  });

  if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
    return null;
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return apiKey.user;
}
```

---

### 3.1.4 Integration Agent

**Responsibilities:**
- Third-party API connections
- Webhook handling
- Data synchronization
- Error recovery
- Retry mechanisms

**Specific Tasks:**
- [ ] Email service integration (Resend/SendGrid)
- [ ] File storage integration (Vercel Blob)
- [ ] Analytics integration
- [ ] Webhook receivers
- [ ] Webhook dispatchers
- [ ] Error logging integration
- [ ] Retry logic with exponential backoff

**Deliverables:**
```typescript
// Email service
export class EmailService {
  async sendQuoteEmail(quote: Quote, to: string) {
    const pdf = await generateQuotePdf(quote);

    await resend.emails.send({
      from: 'quotes@openasapp.com',
      to,
      subject: `Quote ${quote.quoteNumber} from OpenAsApp`,
      html: `
        <h1>Your Quote is Ready</h1>
        <p>Please find attached quote ${quote.quoteNumber}.</p>
        <p>Total: $${quote.totalAmount.toFixed(2)}</p>
      `,
      attachments: [
        {
          filename: `quote-${quote.quoteNumber}.pdf`,
          content: pdf,
        },
      ],
    });
  }
}

// Webhook handler
export async function handleWebhook(req: NextRequest) {
  const signature = req.headers.get('x-webhook-signature');
  const payload = await req.json();

  // Verify signature
  if (!verifyWebhookSignature(payload, signature)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  // Process webhook
  switch (payload.type) {
    case 'quote.accepted':
      await handleQuoteAccepted(payload.data);
      break;
    case 'payment.received':
      await handlePaymentReceived(payload.data);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Under Frontend Application Agent (2.2)

### 3.2.1 UI Component Agent

**Responsibilities:**
- Reusable component library
- Component documentation
- Theming system
- Icon library
- Storybook setup

**Specific Tasks:**
- [ ] Setup shadcn/ui components
- [ ] Create custom components
- [ ] Theme configuration
- [ ] Icon system setup
- [ ] Component documentation
- [ ] Accessibility testing
- [ ] Component unit tests

**Deliverables:**
```typescript
// Custom components
/components/ui/
  button.tsx
  input.tsx
  select.tsx
  dialog.tsx
  table.tsx
  card.tsx
  badge.tsx
  toast.tsx

/components/custom/
  DataTable.tsx
  SearchInput.tsx
  DateRangePicker.tsx
  CurrencyInput.tsx
  PercentageInput.tsx
```

---

### 3.2.2 Form Builder Agent

**Responsibilities:**
- Dynamic form generation
- Field validation
- Multi-step forms
- Auto-save functionality
- Form state management

**Specific Tasks:**
- [ ] Quote form with dynamic items
- [ ] Template form
- [ ] Settings form
- [ ] Login/register forms
- [ ] PDF upload form
- [ ] Real-time validation
- [ ] Auto-save implementation
- [ ] Form error handling

**Deliverables:**
```typescript
// Validation schemas
// lib/validations/quote.ts
import { z } from 'zod';

export const QuoteItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Price cannot be negative'),
  discount: z.number().min(0).max(100, 'Discount must be 0-100%'),
});

export const CreateQuoteSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  items: z.array(QuoteItemSchema).min(1, 'At least one item required'),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  templateId: z.string().optional(),
});

export const UpdateQuoteSchema = CreateQuoteSchema.partial();

export const TemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  items: z.array(QuoteItemSchema),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  isDefault: z.boolean().default(false),
});
```

---

### 3.2.3 State Management Agent

**Responsibilities:**
- Global state setup
- Action creators
- Selectors
- Persistence
- Middleware

**Specific Tasks:**
- [ ] Zustand store configuration
- [ ] Quote state management
- [ ] User state management
- [ ] UI state (modals, toasts)
- [ ] Form state
- [ ] Local storage persistence
- [ ] Optimistic updates

**Deliverables:**
```typescript
// stores/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// stores/useQuoteStore.ts - Already provided in Level 2 docs
```

---

### 3.2.4 Styling Agent

**Responsibilities:**
- Tailwind configuration
- Design tokens
- Responsive breakpoints
- Dark mode support
- Animation library

**Specific Tasks:**
- [ ] Tailwind CSS configuration
- [ ] Color palette setup
- [ ] Typography system
- [ ] Spacing scale
- [ ] Breakpoint definitions
- [ ] Dark mode implementation
- [ ] Animation utilities
- [ ] Custom CSS utilities

**Deliverables:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## Under Quote Engine Agent (2.3)

### 3.3.1 Calculation Engine Agent

**Responsibilities:**
- Formula parser
- Mathematical operations
- Tax/discount calculations
- Currency handling
- Rounding rules

**Specific Tasks:**
- [ ] Implement QuoteCalculator class
- [ ] Formula evaluator
- [ ] Tax calculation logic
- [ ] Discount application
- [ ] Multi-currency support
- [ ] Rounding strategies
- [ ] Bulk discount rules
- [ ] Calculation unit tests

**Deliverables:**
(Already provided in Level 2 specs - QuoteCalculator class)

---

### 3.3.2 Template System Agent

**Responsibilities:**
- Template storage
- Variable substitution
- Conditional logic
- Template versioning
- Custom template creation

**Specific Tasks:**
- [ ] Template data model
- [ ] Template CRUD API
- [ ] Variable replacement engine
- [ ] Conditional rendering
- [ ] Template preview
- [ ] Default templates
- [ ] Template categories
- [ ] Template duplication

**Deliverables:**
```typescript
// lib/template-engine/renderer.ts
export class TemplateRenderer {
  render(template: Template, variables: Record<string, any>) {
    const items = template.items.map((item) => ({
      description: this.replaceVariables(item.description, variables),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
    }));

    return {
      ...template,
      items,
      notes: this.replaceVariables(template.notes || '', variables),
    };
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }
}

// Usage example
const renderer = new TemplateRenderer();
const quote = renderer.render(template, {
  CLIENT_NAME: 'Acme Corp',
  PROJECT_NAME: 'Website Redesign',
  HOURS: 40,
});
```

---

### 3.3.3 Export Generator Agent

**Responsibilities:**
- PDF generation
- Excel export
- CSV export
- Email formatting
- Print optimization

**Specific Tasks:**
- [ ] PDF generation with PDFKit
- [ ] Excel generation with ExcelJS
- [ ] CSV export
- [ ] Email HTML templates
- [ ] Print-friendly CSS
- [ ] Logo/branding inclusion
- [ ] Custom styling options
- [ ] Batch export

**Deliverables:**
```typescript
// lib/exporters/excel-exporter.ts
import ExcelJS from 'exceljs';
import { Quote } from '@prisma/client';

export class ExcelExporter {
  async exportQuote(quote: Quote): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quote');

    // Set column widths
    worksheet.columns = [
      { width: 40 },
      { width: 10 },
      { width: 15 },
      { width: 10 },
      { width: 15 },
    ];

    // Title
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'QUOTE';
    worksheet.getCell('A1').font = { size: 18, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Quote info
    worksheet.getCell('A3').value = 'Quote Number:';
    worksheet.getCell('B3').value = quote.quoteNumber;
    worksheet.getCell('A4').value = 'Date:';
    worksheet.getCell('B4').value = new Date().toLocaleDateString();

    // Client info
    worksheet.getCell('A6').value = 'Bill To:';
    worksheet.getCell('A6').font = { bold: true };
    worksheet.getCell('A7').value = quote.clientName;
    worksheet.getCell('A8').value = quote.clientEmail || '';

    // Table headers
    const headerRow = worksheet.getRow(10);
    headerRow.values = ['Description', 'Qty', 'Unit Price', 'Discount', 'Total'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Line items
    let currentRow = 11;
    quote.items.forEach((item) => {
      const row = worksheet.getRow(currentRow);
      row.values = [
        item.description,
        item.quantity,
        item.unitPrice,
        `${item.discount}%`,
        item.lineTotal,
      ];
      currentRow++;
    });

    // Totals
    currentRow += 1;
    worksheet.getCell(`D${currentRow}`).value = 'Subtotal:';
    worksheet.getCell(`E${currentRow}`).value = quote.subtotal;

    currentRow++;
    worksheet.getCell(`D${currentRow}`).value = `Tax (${quote.taxRate}%):`;
    worksheet.getCell(`E${currentRow}`).value = quote.taxAmount;

    currentRow++;
    worksheet.getCell(`D${currentRow}`).value = 'Total:';
    worksheet.getCell(`E${currentRow}`).value = quote.totalAmount;
    worksheet.getCell(`D${currentRow}`).font = { bold: true };
    worksheet.getCell(`E${currentRow}`).font = { bold: true };

    // Format currency cells
    for (let i = 11; i < currentRow; i++) {
      worksheet.getCell(`C${i}`).numFmt = '$#,##0.00';
      worksheet.getCell(`E${i}`).numFmt = '$#,##0.00';
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
```

---

### 3.3.4 Validation Agent

**Responsibilities:**
- Business rule validation
- Data integrity checks
- Constraint enforcement
- Error messaging
- Warning system

**Specific Tasks:**
- [ ] Quote validation rules
- [ ] Template validation
- [ ] Price validation
- [ ] Discount limits
- [ ] Date validation
- [ ] Duplicate detection
- [ ] Constraint checking
- [ ] Validation error messages

**Deliverables:**
```typescript
// lib/validators/quote-validator.ts
export class QuoteValidator {
  validateQuote(quote: CreateQuoteInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate client info
    if (!quote.clientName || quote.clientName.trim().length === 0) {
      errors.push('Client name is required');
    }

    if (quote.clientEmail && !this.isValidEmail(quote.clientEmail)) {
      errors.push('Invalid email format');
    }

    // Validate items
    if (!quote.items || quote.items.length === 0) {
      errors.push('At least one line item is required');
    }

    quote.items.forEach((item, index) => {
      if (!item.description || item.description.trim().length === 0) {
        errors.push(`Item ${index + 1}: Description is required`);
      }

      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be positive`);
      }

      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`);
      }

      if (item.discount < 0 || item.discount > 100) {
        errors.push(`Item ${index + 1}: Discount must be between 0-100%`);
      }

      if (item.discount > 50) {
        warnings.push(`Item ${index + 1}: Large discount (${item.discount}%)`);
      }
    });

    // Validate tax rate
    if (quote.taxRate < 0 || quote.taxRate > 100) {
      errors.push('Tax rate must be between 0-100%');
    }

    // Validate expiration date
    if (quote.validUntil) {
      const expirationDate = new Date(quote.validUntil);
      if (expirationDate < new Date()) {
        warnings.push('Quote expiration date is in the past');
      }
    }

    // Business rules
    const total = this.calculateTotal(quote);
    if (total > 100000) {
      warnings.push('Large quote amount - consider review');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private calculateTotal(quote: CreateQuoteInput): number {
    const subtotal = quote.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice * (1 - item.discount / 100);
    }, 0);

    return subtotal * (1 + quote.taxRate / 100);
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## Under PDF Parser Agent (2.4)

### 3.4.1 PDF Extraction Agent

**Responsibilities:**
- Text extraction
- Table detection
- Image extraction
- Metadata parsing
- Multi-page handling

**Specific Tasks:**
- [ ] Implement pdf-parse integration
- [ ] Table structure detection
- [ ] Image extraction
- [ ] Metadata extraction
- [ ] Page-by-page processing
- [ ] Text layout analysis
- [ ] Font and styling info
- [ ] Coordinate mapping

**Deliverables:**
(Already provided in Level 2 specs - PdfParser class)

---

### 3.4.2 Data Mapping Agent

**Responsibilities:**
- Pattern recognition
- Field mapping
- Data transformation
- Schema matching
- Confidence scoring

**Specific Tasks:**
- [ ] Quote pattern recognition
- [ ] Client info extraction
- [ ] Line item parsing
- [ ] Price extraction
- [ ] Date parsing
- [ ] Currency detection
- [ ] Field mapping rules
- [ ] Confidence calculation

**Deliverables:**
```typescript
// lib/pdf-parser/mappers/quote-mapper.ts
export class QuoteMapper {
  mapToQuote(parsedData: ParsedPdfData): Partial<CreateQuoteInput> {
    return {
      clientName: parsedData.extracted.clientName,
      clientEmail: parsedData.extracted.clientEmail,
      items: parsedData.extracted.items.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: this.calculateDiscount(item),
        sortOrder: index,
      })),
      taxRate: this.extractTaxRate(parsedData),
      notes: this.extractNotes(parsedData),
    };
  }

  private calculateDiscount(item: any): number {
    if (item.discount) return item.discount;

    // Calculate from total if available
    if (item.total && item.quantity && item.unitPrice) {
      const expectedTotal = item.quantity * item.unitPrice;
      const discountAmount = expectedTotal - item.total;
      return (discountAmount / expectedTotal) * 100;
    }

    return 0;
  }

  private extractTaxRate(parsedData: ParsedPdfData): number {
    const { subtotal, tax, total } = parsedData.extracted;

    if (subtotal && tax) {
      return (tax / subtotal) * 100;
    }

    return 0;
  }

  private extractNotes(parsedData: ParsedPdfData): string | undefined {
    // Look for notes section in text
    const text = parsedData.text.toLowerCase();
    const notesIndex = text.indexOf('notes:');

    if (notesIndex !== -1) {
      // Extract text after "notes:" until next section or end
      const afterNotes = parsedData.text.substring(notesIndex + 6);
      const endIndex = afterNotes.search(/\n\n|\n[A-Z]/);

      if (endIndex !== -1) {
        return afterNotes.substring(0, endIndex).trim();
      }

      return afterNotes.trim();
    }

    return undefined;
  }
}
```

---

### 3.4.3 OCR Agent

**Responsibilities:**
- Image preprocessing
- Text recognition
- Scanned document handling
- Handwriting recognition
- Quality assessment

**Specific Tasks:**
- [ ] Tesseract.js integration
- [ ] Image preprocessing
- [ ] OCR quality detection
- [ ] Multi-language support
- [ ] Confidence thresholds
- [ ] Post-processing cleanup
- [ ] Fallback strategies

**Deliverables:**
```typescript
// lib/pdf-parser/ocr-processor.ts
import Tesseract from 'tesseract.js';

export class OcrProcessor {
  async processImage(imageBuffer: Buffer): Promise<OcrResult> {
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: (m) => console.log(m),
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      blocks: result.data.blocks,
    };
  }

  async detectIfScanned(pdfBuffer: Buffer): Promise<boolean> {
    // Heuristic: If text extraction yields very little,
    // but PDF has images, it's likely scanned
    const textData = await pdf(pdfBuffer);
    const textLength = textData.text.trim().length;

    // If less than 100 characters extracted, likely scanned
    return textLength < 100 && textData.numpages > 0;
  }

  async processScannedPdf(pdfBuffer: Buffer): Promise<string> {
    // Convert PDF pages to images, then OCR each
    // This requires pdf-to-image conversion library
    // Placeholder for implementation

    return 'OCR text from scanned PDF';
  }
}

interface OcrResult {
  text: string;
  confidence: number;
  blocks: any[];
}
```

---

### 3.4.4 Validation Agent

**Responsibilities:**
- Extracted data validation
- Format verification
- Completeness checks
- Error reporting
- Manual review flagging

**Specific Tasks:**
- [ ] Data completeness validation
- [ ] Format verification
- [ ] Confidence thresholds
- [ ] Error detection
- [ ] Manual review triggers
- [ ] Validation reports
- [ ] Suggested corrections

**Deliverables:**
```typescript
// lib/pdf-parser/validators/extraction-validator.ts
export class ExtractionValidator {
  validate(parsedData: ParsedPdfData): ExtractionValidation {
    const issues: string[] = [];
    const warnings: string[] = [];
    let needsManualReview = false;

    // Check confidence score
    if (parsedData.confidence < 70) {
      needsManualReview = true;
      warnings.push('Low confidence score in extraction');
    }

    // Validate client info
    if (!parsedData.extracted.clientName) {
      issues.push('Client name not found');
      needsManualReview = true;
    }

    if (!parsedData.extracted.clientEmail) {
      warnings.push('Client email not found');
    }

    // Validate items
    if (!parsedData.extracted.items || parsedData.extracted.items.length === 0) {
      issues.push('No line items found');
      needsManualReview = true;
    }

    parsedData.extracted.items.forEach((item, index) => {
      if (!item.description || item.description.trim().length === 0) {
        issues.push(`Item ${index + 1}: Missing description`);
      }

      if (!item.quantity || item.quantity <= 0) {
        issues.push(`Item ${index + 1}: Invalid quantity`);
      }

      if (!item.unitPrice || item.unitPrice <= 0) {
        issues.push(`Item ${index + 1}: Invalid price`);
      }
    });

    // Validate totals
    if (parsedData.extracted.total) {
      const calculatedTotal = this.calculateTotal(parsedData.extracted);
      const difference = Math.abs(calculatedTotal - parsedData.extracted.total);

      if (difference > 0.01) {
        warnings.push(`Total mismatch: Extracted $${parsedData.extracted.total}, Calculated $${calculatedTotal}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      needsManualReview,
      confidence: parsedData.confidence,
    };
  }

  private calculateTotal(extracted: any): number {
    const subtotal = extracted.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const tax = extracted.tax || 0;
    return subtotal + tax;
  }
}

interface ExtractionValidation {
  valid: boolean;
  issues: string[];
  warnings: string[];
  needsManualReview: boolean;
  confidence: number;
}
```

---

## Under ChatGPT Integration Agent (2.5)

### 3.5.1 GPT Schema Agent

**Responsibilities:**
- OpenAPI schema creation
- Action definitions
- Parameter schemas
- Response formats
- Error schemas

**Specific Tasks:**
- [ ] Complete OpenAPI 3.1.0 schema
- [ ] Action endpoint definitions
- [ ] Request/response schemas
- [ ] Error response formats
- [ ] Schema validation
- [ ] Documentation strings
- [ ] Example payloads

**Deliverables:**
(Already provided in Level 2 specs - gpt-action-schema.yaml)

---

### 3.5.2 Conversation Design Agent

**Responsibilities:**
- Prompt engineering
- Conversation flows
- Context management
- Multi-turn interactions
- Fallback handling

**Specific Tasks:**
- [ ] GPT instructions
- [ ] Conversation starters
- [ ] Example dialogues
- [ ] Error handling prompts
- [ ] Clarification questions
- [ ] Context preservation
- [ ] User intent detection

**Deliverables:**
```markdown
# GPT Instructions

You are OpenAsApp Quote Assistant, a professional tool for creating quotes and parsing PDF documents.

## Core Capabilities
1. **Create Quotes**: Help users create professional quotes with line items, calculations, and client information
2. **Parse PDFs**: Extract quote information from PDF documents
3. **List Quotes**: Show recent quotes and their details
4. **Export**: Generate PDF and Excel exports of quotes

## Guidelines
- Always confirm key details before creating a quote
- Provide clear summaries of created quotes
- Offer to email quotes to clients
- Flag any parsing issues for manual review
- Use professional, friendly tone
- Ask clarifying questions when information is ambiguous

## Conversation Starters
1. "Create a new quote for a client"
2. "Parse a quote from a PDF"
3. "Show my recent quotes"
4. "Help me understand my quote analytics"

## Example Interactions

### Creating a Quote
User: "I need to create a quote for Acme Corp for web development work"