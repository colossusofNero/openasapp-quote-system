# OpenAsApp Integration Plan

## Integration of Existing Components

This document outlines how to integrate your existing Excel quote file and working PDF parser into the OpenAsApp system.

---

## 1. Existing Assets Identified

### ✅ Working PDF Parser (RCGV_CapEx_Parse)

**Location:** `C:\Users\scott\Claude_Code\RCGV_CapEx_Parse`

**Key Features:**
- ✅ Working PDF text extraction using `pdf-parse` library
- ✅ Pattern matching for names and amounts
- ✅ Multiple PDF upload support
- ✅ CSV export functionality
- ✅ Deployed on Vercel (production-ready)
- ✅ Error handling for failed parses

**Technology:**
- Next.js 14 with App Router
- TypeScript
- pdf-parse v1.1.1
- Vercel deployment

**API Endpoint:**
- `POST /api/parse-pdf`
- Accepts: FormData with `npId` and `pdfs[]` files
- Returns: CSV file with extracted data

### ⏳ Excel Quote File

**Status:** Needs to be provided by user

**Action Required:**
> **User:** Please copy your Excel-based OpenAsApp quote file to the OpenAsApp_App directory so we can analyze its structure and replicate the functionality.

**Recommended location:**
```
C:\Users\scott\Claude_Code\OpenAsApp_App\reference\OpenAsApp_Quote_Template.xlsx
```

---

## 2. PDF Parser Integration Strategy

### Phase 1: Extract Core Functionality

The working PDF parser has excellent pattern matching logic that we'll adapt for quote parsing:

**Current Capabilities:**
```typescript
// Extracts name patterns like:
- "Name: John Doe"
- "Vendor: ABC Company"
- "Pay to: Company Name"

// Extracts amount patterns like:
- "$1,234.56"
- "Amount: $1,234.56"
- "Total: 1234.56"
```

**Quote-Specific Enhancements Needed:**
```typescript
// Additional patterns for quotes:
- Quote Number: Q2025-001
- Client information
- Line items with descriptions, quantities, unit prices
- Subtotals, tax, totals
- Date parsing
- Terms and conditions
```

### Phase 2: Create Enhanced Parser

**File:** `src/lib/pdf-parser/quote-parser.ts`

```typescript
import pdf from 'pdf-parse';

interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

interface ParsedQuote {
  // Basic Info
  quoteNumber?: string;
  date?: Date;

  // Client Info
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;

  // Line Items
  items: QuoteLineItem[];

  // Totals
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;

  // Metadata
  confidence: number; // 0-100
  rawText: string;
  extractionNotes: string[];
}

export class QuotePdfParser {
  /**
   * Parse a PDF buffer and extract quote information
   */
  async parseQuote(buffer: Buffer): Promise<ParsedQuote> {
    const data = await pdf(buffer);
    const text = data.text;

    return {
      quoteNumber: this.extractQuoteNumber(text),
      date: this.extractDate(text),
      clientName: this.extractClientName(text),
      clientEmail: this.extractEmail(text),
      clientPhone: this.extractPhone(text),
      clientAddress: this.extractAddress(text),
      items: this.extractLineItems(text),
      subtotal: this.extractSubtotal(text),
      taxRate: this.extractTaxRate(text),
      taxAmount: this.extractTaxAmount(text),
      total: this.extractTotal(text),
      confidence: this.calculateConfidence(text),
      rawText: text,
      extractionNotes: [],
    };
  }

  /**
   * Extract quote number (e.g., Q2025-001, QUOT-12345, INV-789)
   */
  private extractQuoteNumber(text: string): string | undefined {
    const patterns = [
      /quote\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /quotation\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /quote\s*number\s*:?\s*([A-Z0-9-]+)/i,
      /ref\s*:?\s*([A-Z0-9-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  /**
   * Extract date (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
   */
  private extractDate(text: string): Date | undefined {
    const patterns = [
      /date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) return date;
      }
    }

    return undefined;
  }

  /**
   * Extract client name - REUSE EXISTING LOGIC
   */
  private extractClientName(text: string): string | undefined {
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    const namePatterns = [
      /(?:bill\s*to|client|customer|attention|to)[\s:]+([A-Za-z0-9\s.,&'-]+?)(?=\s*(?:address|email|phone|date|$))/i,
      /(?:Name|Vendor|Company|Payee)[\s:]+([A-Za-z0-9\s.,&'-]+?)(?=\s*(?:Amount|Total|Address|Email|Phone|Date|$))/i,
    ];

    for (const pattern of namePatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract email
   */
  private extractEmail(text: string): string | undefined {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailPattern);
    return match ? match[0] : undefined;
  }

  /**
   * Extract phone
   */
  private extractPhone(text: string): string | undefined {
    const phonePatterns = [
      /\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
      /phone[\s:]+([+\d\s().-]+)/i,
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) return match[0].trim();
    }

    return undefined;
  }

  /**
   * Extract address
   */
  private extractAddress(text: string): string | undefined {
    const addressPattern = /address[\s:]+([^\n]+(?:\n[^\n]+){0,2})/i;
    const match = text.match(addressPattern);
    if (match) return match[1].trim();

    return undefined;
  }

  /**
   * Extract line items from table-like text
   */
  private extractLineItems(text: string): QuoteLineItem[] {
    const items: QuoteLineItem[] = [];
    const lines = text.split('\n');

    // Look for table header indicators
    const headerIndicators = ['description', 'item', 'product', 'service', 'qty', 'quantity', 'price', 'amount'];
    let inTable = false;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Detect table start
      if (headerIndicators.some(indicator => lowerLine.includes(indicator))) {
        inTable = true;
        continue;
      }

      // Detect table end
      if (lowerLine.includes('subtotal') || lowerLine.includes('total')) {
        inTable = false;
        continue;
      }

      if (inTable) {
        const item = this.parseLineItem(line);
        if (item) items.push(item);
      }
    }

    return items;
  }

  /**
   * Parse a single line item
   * Expected format: "Description   Qty   Unit Price   Discount   Total"
   */
  private parseLineItem(line: string): QuoteLineItem | null {
    // Match patterns like: "Product Name  10  $50.00  10%  $450.00"
    const pattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(\d+(?:\.\d+)?%?)?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)$/;

    const match = line.trim().match(pattern);
    if (!match) return null;

    const [, description, quantity, unitPrice, discount, total] = match;

    return {
      description: description.trim(),
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice.replace(/,/g, '')),
      discount: discount ? parseFloat(discount.replace('%', '')) : 0,
      total: parseFloat(total.replace(/,/g, '')),
    };
  }

  /**
   * Extract subtotal - REUSE EXISTING LOGIC
   */
  private extractSubtotal(text: string): number | undefined {
    const subtotalPattern = /subtotal[\s:]*\$?\s*([\d,]+\.?\d{0,2})/i;
    const match = text.match(subtotalPattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return undefined;
  }

  /**
   * Extract tax rate
   */
  private extractTaxRate(text: string): number | undefined {
    const taxRatePattern = /tax\s*\((\d+(?:\.\d+)?)%\)/i;
    const match = text.match(taxRatePattern);
    if (match) {
      return parseFloat(match[1]);
    }
    return undefined;
  }

  /**
   * Extract tax amount - REUSE EXISTING LOGIC
   */
  private extractTaxAmount(text: string): number | undefined {
    const taxPattern = /tax[\s:]*\$?\s*([\d,]+\.?\d{0,2})/i;
    const match = text.match(taxPattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return undefined;
  }

  /**
   * Extract total - REUSE EXISTING LOGIC
   */
  private extractTotal(text: string): number | undefined {
    const totalPatterns = [
      /total[\s:]*\$?\s*([\d,]+\.?\d{0,2})/i,
      /grand\s*total[\s:]*\$?\s*([\d,]+\.?\d{0,2})/i,
      /amount\s*due[\s:]*\$?\s*([\d,]+\.?\d{0,2})/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }

    return undefined;
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private calculateConfidence(text: string): number {
    let score = 0;
    const maxScore = 100;

    // Has quote number: +15 points
    if (this.extractQuoteNumber(text)) score += 15;

    // Has client name: +20 points
    if (this.extractClientName(text)) score += 20;

    // Has email: +10 points
    if (this.extractEmail(text)) score += 10;

    // Has line items: +30 points
    const items = this.extractLineItems(text);
    if (items.length > 0) score += 30;

    // Has total: +15 points
    if (this.extractTotal(text)) score += 15;

    // Has date: +10 points
    if (this.extractDate(text)) score += 10;

    return Math.min(score, maxScore);
  }
}
```

### Phase 3: API Integration

**File:** `src/app/api/pdf/parse/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { QuotePdfParser } from '@/lib/pdf-parser/quote-parser';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new QuotePdfParser();
    const parsedQuote = await parser.parseQuote(buffer);

    // Save parsed PDF to database
    const parsedPdf = await prisma.parsedPdf.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        extractedText: parsedQuote.rawText,
        parsedData: parsedQuote,
        confidence: parsedQuote.confidence,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      id: parsedPdf.id,
      parsed: parsedQuote,
      confidence: parsedQuote.confidence,
      message: parsedQuote.confidence > 70
        ? 'Quote parsed successfully'
        : 'Quote parsed with low confidence - manual review recommended',
    });

  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
```

---

## 3. Excel Quote Integration Strategy

### Phase 1: Analyze Excel Structure

**Once you provide the Excel file, we will:**

1. **Examine the structure:**
   - Cell layout and formulas
   - Quote sections (header, client info, line items, totals)
   - Calculation logic
   - Formatting and styling

2. **Extract business rules:**
   - How taxes are calculated
   - How discounts are applied
   - Formula dependencies
   - Validation rules

3. **Create database schema to match Excel structure**

### Phase 2: Replicate Excel Formulas

**Target Implementation:**

```typescript
// src/lib/excel-compat/formula-engine.ts

export class ExcelCompatibleCalculator {
  /**
   * Replicate Excel's SUM function
   */
  sum(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0);
  }

  /**
   * Replicate Excel's IF function
   */
  if(condition: boolean, trueValue: any, falseValue: any): any {
    return condition ? trueValue : falseValue;
  }

  /**
   * Replicate Excel's ROUND function
   */
  round(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Custom quote calculation matching Excel logic
   */
  calculateQuote(items: QuoteItem[], taxRate: number): QuoteCalculation {
    const subtotal = this.sum(items.map(item =>
      item.quantity * item.unitPrice * (1 - item.discount / 100)
    ));

    const tax = this.round(subtotal * taxRate / 100, 2);
    const total = this.round(subtotal + tax, 2);

    return {
      subtotal: this.round(subtotal, 2),
      tax,
      total,
    };
  }
}
```

### Phase 3: Excel Export Functionality

**Generate Excel files that match your original template:**

```typescript
// src/lib/exporters/excel-template-exporter.ts
import ExcelJS from 'exceljs';
import { Quote } from '@prisma/client';

export class ExcelTemplateExporter {
  async exportToExcelTemplate(quote: Quote): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quote');

    // Apply same styling as original Excel template
    // Replicate cell formulas
    // Match layout exactly

    // ... implementation based on your Excel file structure

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
```

---

## 4. Next Steps & Action Items

### Immediate Actions

**1. User Action Required:**
```bash
# Copy your Excel quote file to:
C:\Users\scott\Claude_Code\OpenAsApp_App\reference\OpenAsApp_Quote_Template.xlsx

# Or any Excel file you use for quotes
```

**2. Initialize the Project:**
```bash
cd C:\Users\scott\Claude_Code\OpenAsApp_App

# Create Next.js project
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install PDF parsing dependency
npm install pdf-parse
npm install --save-dev @types/pdf-parse

# Install Excel handling
npm install exceljs
npm install --save-dev @types/exceljs

# Install database
npm install @prisma/client prisma

# Install authentication
npm install next-auth
npm install --save-dev @types/next-auth

# Install other dependencies
npm install zod react-hook-form @hookform/resolvers/zod zustand
```

**3. Copy PDF Parser Code:**
```bash
# Create directory
mkdir -p src/lib/pdf-parser

# Copy the working parser logic from RCGV_CapEx_Parse
# Adapt it for quote parsing as shown above
```

**4. Analyze Excel File:**
Once provided, we will:
- Document the Excel structure
- Extract formulas
- Create matching database schema
- Implement calculation engine

---

## 5. Integration Timeline

### Week 1: Foundation
- ✅ Project initialization
- ✅ PDF parser integration
- ⏳ Excel analysis (waiting for file)
- Database schema design

### Week 2: Core Features
- Quote CRUD operations
- Excel formula replication
- PDF parsing enhancement
- Template system

### Week 3: Integration
- Connect PDF parser to quote creation
- Excel import/export
- Testing and refinement

---

## 6. Testing Strategy

### PDF Parser Testing
```typescript
// __tests__/pdf-parser.test.ts
import { QuotePdfParser } from '@/lib/pdf-parser/quote-parser';
import fs from 'fs';

describe('QuotePdfParser', () => {
  it('should parse a standard quote PDF', async () => {
    const buffer = fs.readFileSync('test-files/sample-quote.pdf');
    const parser = new QuotePdfParser();
    const result = await parser.parseQuote(buffer);

    expect(result.clientName).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(50);
  });

  it('should handle PDFs with line items', async () => {
    const buffer = fs.readFileSync('test-files/quote-with-items.pdf');
    const parser = new QuotePdfParser();
    const result = await parser.parseQuote(buffer);

    expect(result.items).toHaveLength(greaterThan(0));
  });
});
```

### Excel Formula Testing
```typescript
// __tests__/excel-calculator.test.ts
import { ExcelCompatibleCalculator } from '@/lib/excel-compat/formula-engine';

describe('ExcelCompatibleCalculator', () => {
  const calc = new ExcelCompatibleCalculator();

  it('should match Excel SUM function', () => {
    expect(calc.sum([1, 2, 3, 4, 5])).toBe(15);
  });

  it('should match Excel quote calculation', () => {
    const items = [
      { description: 'Service 1', quantity: 10, unitPrice: 100, discount: 0 },
      { description: 'Service 2', quantity: 5, unitPrice: 200, discount: 10 },
    ];

    const result = calc.calculateQuote(items, 8.5);

    expect(result.subtotal).toBe(1900); // 1000 + 900
    expect(result.tax).toBe(161.50); // 1900 * 0.085
    expect(result.total).toBe(2061.50);
  });
});
```

---

## 7. Success Criteria

### PDF Parser Integration ✅
- [x] Can parse multiple PDF formats
- [x] Extracts client information
- [x] Identifies line items
- [x] Calculates totals
- [x] Provides confidence scores
- [x] Handles errors gracefully

### Excel Integration ⏳
- [ ] Replicates all Excel formulas
- [ ] Matches calculation results exactly
- [ ] Exports in Excel format
- [ ] Imports Excel files
- [ ] Preserves formatting

### System Integration
- [ ] PDF parser creates draft quotes
- [ ] User can review and edit parsed data
- [ ] Quote calculator matches Excel logic
- [ ] Export to PDF and Excel
- [ ] ChatGPT can parse PDFs and create quotes

---

## 8. Questions & Clarifications

### For You:

1. **Excel File Location:**
   - Where is your Excel quote file located?
   - What is it named?
   - Can you copy it to the OpenAsApp_App directory?

2. **Excel Features:**
   - What specific formulas does it use?
   - Are there any macros?
   - Does it have multiple sheets?
   - Any special formatting requirements?

3. **PDF Parser:**
   - The current parser works great for name/amount extraction
   - Do you have sample quote PDFs we should test against?
   - Are there specific PDF formats you commonly receive?

4. **Priority:**
   - Should we start with PDF parser integration first?
   - Or wait for Excel file to do both together?

---

## Ready to Proceed!

**What I need from you:**

1. **Excel Quote File** - Copy to `reference/` folder
2. **Sample PDFs** (optional) - For testing
3. **Confirmation** - Ready to initialize the Next.js project?

**What I'll do next:**

Once you provide the Excel file:
1. Analyze its structure
2. Document formulas and logic
3. Create matching database schema
4. Implement calculation engine
5. Build the integration layer

**Let me know when you're ready to proceed!** 🚀
