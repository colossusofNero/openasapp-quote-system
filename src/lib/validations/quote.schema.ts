import { z } from 'zod';

/**
 * Property Type Enum
 * Based on VLOOKUP Tables from Excel analysis
 */
export const PropertyTypeEnum = z.enum([
  'Industrial',
  'Medical',
  'Office',
  'Other',
  'Restaurant',
  'Retail',
  'Warehouse',
  'Multi-Family',
  'Residential/LTR',
  'Short-Term Rental',
]);

export type PropertyType = z.infer<typeof PropertyTypeEnum>;

/**
 * Quote Type Enum
 * Only RCGV and Pro are active (SMART is deprecated)
 */
export const QuoteTypeEnum = z.enum(['RCGV', 'Pro']);

export type QuoteType = z.infer<typeof QuoteTypeEnum>;

/**
 * Input validation schema
 * Maps to the "Input Sheet" from Excel structure
 */
export const QuoteInputSchema = z.object({
  // Basic Property Information
  purchasePrice: z.number().positive().min(1).max(100000000), // $1 to $100M
  zipCode: z.string().regex(/^\d{5}$/, 'Must be a valid 5-digit ZIP code'),
  sqFtBuilding: z.number().positive().min(1).max(1000000), // 1 to 1M sqft
  acresLand: z.number().nonnegative().min(0).max(1000), // 0 to 1000 acres
  propertyType: PropertyTypeEnum,
  numberOfFloors: z.number().int().positive().min(1).max(100),
  multipleProperties: z.number().int().positive().min(1).default(1),

  // Date Information
  dateOfPurchase: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  taxYear: z.number().int().min(2000).max(2100),
  yearBuilt: z.number().int().min(1800).max(2100),

  // Financial Details
  capEx: z.number().nonnegative().default(0), // Capital Expenditures
  accumulated1031Depreciation: z.number().nonnegative().default(0).optional(),

  // Client Information
  propertyOwnerName: z.string().min(1).max(255),
  propertyAddress: z.string().min(1).max(500),

  // Quote Type
  quoteType: QuoteTypeEnum.default('RCGV'),

  // Optional Fields
  rushFee: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export type QuoteInput = z.infer<typeof QuoteInputSchema>;

/**
 * Calculate-only schema (no saving required)
 * Subset of QuoteInputSchema without client information
 */
export const CalculateQuoteSchema = QuoteInputSchema.pick({
  purchasePrice: true,
  zipCode: true,
  sqFtBuilding: true,
  acresLand: true,
  propertyType: true,
  numberOfFloors: true,
  multipleProperties: true,
  dateOfPurchase: true,
  taxYear: true,
  yearBuilt: true,
  capEx: true,
  accumulated1031Depreciation: true,
  quoteType: true,
  rushFee: true,
});

export type CalculateQuoteInput = z.infer<typeof CalculateQuoteSchema>;

/**
 * Quote output schema
 * Represents the calculated quote result
 */
export const QuoteOutputSchema = z.object({
  // Calculation Results
  bidAmount: z.number(),
  landValue: z.number(),
  buildingValue: z.number(),

  // Payment Options
  paymentOptions: z.object({
    upfront: z.object({
      amount: z.number(),
      discount: z.number(), // Percentage
    }),
    fiftyFifty: z.object({
      firstPayment: z.number(),
      secondPayment: z.number(),
      total: z.number(),
    }),
    monthly: z.object({
      monthlyAmount: z.number(),
      numberOfMonths: z.number().int(),
      total: z.number(),
    }),
  }),

  // Applied Factors (for transparency)
  appliedFactors: z.object({
    costBasisFactor: z.number(),
    zipCodeFactor: z.number(),
    sqFtFactor: z.number(),
    acresFactor: z.number(),
    propertyTypeFactor: z.number(),
    floorsFactor: z.number(),
    multiplePropertiesFactor: z.number().optional(),
  }),

  // Depreciation Schedule (summary)
  depreciationSummary: z.object({
    method: z.enum(['39-year', '27.5-year']),
    year1: z.number(),
    year2: z.number(),
    year3: z.number(),
    year4: z.number(),
    year5: z.number(),
    year6: z.number(),
    totalTax: z.number(),
  }),

  // Metadata
  quoteType: QuoteTypeEnum,
  calculatedAt: z.string().datetime(),
});

export type QuoteOutput = z.infer<typeof QuoteOutputSchema>;

/**
 * Saved Quote Schema (with ID and timestamps)
 */
export const SavedQuoteSchema = z.object({
  id: z.string().uuid(),
  input: QuoteInputSchema,
  output: QuoteOutputSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userId: z.string().optional(), // For authentication
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).default('draft'),
});

export type SavedQuote = z.infer<typeof SavedQuoteSchema>;

/**
 * API Response wrapper
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      })
      .optional(),
    meta: z
      .object({
        timestamp: z.string().datetime(),
        version: z.string().default('1.0'),
      })
      .optional(),
  });

/**
 * Lookup Factors Schema
 * For GET /api/quotes/factors endpoint
 */
export const LookupFactorsSchema = z.object({
  costBasisFactors: z.array(
    z.object({
      minValue: z.number(),
      maxValue: z.number().nullable(),
      factor: z.number(),
    })
  ),
  zipCodeFactors: z.array(
    z.object({
      minZip: z.number(),
      maxZip: z.number(),
      factor: z.number(),
    })
  ),
  sqFtFactors: z.array(
    z.object({
      minSqFt: z.number(),
      maxSqFt: z.number().nullable(),
      factor: z.number(),
    })
  ),
  acresFactors: z.array(
    z.object({
      minAcres: z.number(),
      maxAcres: z.number().nullable(),
      factor: z.number(),
    })
  ),
  propertyTypeFactors: z.record(PropertyTypeEnum, z.number()),
  floorsFactors: z.array(
    z.object({
      floors: z.number(),
      factor: z.number(),
    })
  ),
  multiplePropertiesFactors: z.array(
    z.object({
      count: z.number(),
      factor: z.number(),
    })
  ),
});

export type LookupFactors = z.infer<typeof LookupFactorsSchema>;

/**
 * Query Parameters for listing quotes
 */
export const QuoteListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  quoteType: QuoteTypeEnum.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'bidAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(), // Search by client name or property address
});

export type QuoteListQuery = z.infer<typeof QuoteListQuerySchema>;
