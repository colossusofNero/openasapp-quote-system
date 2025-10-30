import { z } from "zod";

import {
  PROPERTY_TYPES,
  QuoteFormValues,
  RUSH_OPTIONS,
  TAX_DEADLINES,
  normaliseFormValues,
} from "@/lib/quoteMath";

const today = new Date();
const currentYear = today.getFullYear();

const currencyField = (
  min: number,
  max: number,
  minMessage: string,
  maxMessage: string,
) =>
  z
    .coerce.number({ invalid_type_error: "Enter a numeric value" })
    .min(min, minMessage)
    .max(max, maxMessage);

const percentageField = (min: number, max: number) =>
  z
    .coerce.number({ invalid_type_error: "Enter a percentage" })
    .min(min, `Minimum ${min}%`)
    .max(max, `Maximum ${max}%`);

const baseSchema = z
  .object({
    prospectName: z
      .string({ required_error: "Client name is required" })
      .trim()
      .min(3, "Client name must be at least 3 characters")
      .max(120, "Client name must be under 120 characters"),
    propertyAddress: z
      .string({ required_error: "Property address is required" })
      .trim()
      .min(5, "Property address must be at least 5 characters")
      .max(200, "Property address must be under 200 characters"),
    zipCode: z
      .string({ required_error: "ZIP code is required" })
      .trim()
      .regex(/^\d{5}$/u, "Enter a valid 5-digit ZIP code"),
    taxYear: z
      .coerce.number({ invalid_type_error: "Enter the tax year" })
      .int("Tax year must be a whole number")
      .min(2000, "Minimum tax year is 2000")
      .max(2100, "Maximum tax year is 2100"),
    taxDeadline: z.enum(TAX_DEADLINES, { errorMap: () => ({ message: "Select a tax deadline" }) }),
    purchasePrice: currencyField(
      50_000,
      50_000_000,
      "Minimum purchase price is $50,000",
      "Maximum purchase price is $50,000,000",
    ),
    hasCapitalImprovements: z.boolean(),
    capitalImprovementsAmount: currencyField(
      0,
      10_000_000,
      "CapEx cannot be negative",
      "CapEx cannot exceed $10,000,000",
    ),
    landValuePercent: percentageField(0, 80),
    is1031Exchange: z.boolean(),
    accumulated1031Depreciation: currencyField(
      0,
      10_000_000,
      "Accumulated depreciation cannot be negative",
      "Accumulated depreciation cannot exceed $10,000,000",
    ),
    sqftBuilding: z
      .coerce.number({ invalid_type_error: "Enter the building square footage" })
      .int("Square footage must be a whole number")
      .min(100, "Minimum 100 sqft")
      .max(1_000_000, "Maximum 1,000,000 sqft"),
    acresLand: z
      .coerce.number({ invalid_type_error: "Enter the land acreage" })
      .min(0.01, "Minimum 0.01 acres")
      .max(100, "Maximum 100 acres"),
    propertyType: z.enum(PROPERTY_TYPES, { errorMap: () => ({ message: "Select a property type" }) }),
    numberOfFloors: z
      .coerce.number({ invalid_type_error: "Enter the number of floors" })
      .int("Floors must be a whole number")
      .min(1, "At least 1 floor")
      .max(40, "Maximum 40 floors"),
    multipleProperties: z
      .coerce.number({ invalid_type_error: "Enter the number of properties" })
      .int("Property count must be a whole number")
      .min(1, "At least 1 property")
      .max(50, "Maximum 50 properties"),
    needRush: z.enum(RUSH_OPTIONS, { errorMap: () => ({ message: "Select a delivery speed" }) }),
    yearBuilt: z
      .coerce.number({ invalid_type_error: "Enter the year built" })
      .int("Year built must be a whole number")
      .min(1900, "Minimum year built is 1900")
      .max(currentYear, `Year built cannot be after ${currentYear}`),
    priceOverride: z.boolean(),
    overrideAmount: currencyField(
      1_000,
      1_000_000,
      "Override must be at least $1,000",
      "Override cannot exceed $1,000,000",
    ).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasCapitalImprovements && data.capitalImprovementsAmount > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set capital improvements to zero when selecting No",
        path: ["capitalImprovementsAmount"],
      });
    }

    if (data.hasCapitalImprovements && data.capitalImprovementsAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the completed capital improvements amount",
        path: ["capitalImprovementsAmount"],
      });
    }

    if (!data.is1031Exchange && data.accumulated1031Depreciation > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set accumulated depreciation to zero when 1031 exchange is No",
        path: ["accumulated1031Depreciation"],
      });
    }

    if (data.is1031Exchange && data.accumulated1031Depreciation <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the accumulated depreciation amount",
        path: ["accumulated1031Depreciation"],
      });
    }

    if (!data.priceOverride && typeof data.overrideAmount === "number" && data.overrideAmount > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Clear the override amount when Price Override is No",
        path: ["overrideAmount"],
      });
    }

    if (data.priceOverride && (!data.overrideAmount || data.overrideAmount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the override amount",
        path: ["overrideAmount"],
      });
    }
  });

export const quoteSchema = baseSchema.transform((values) =>
  normaliseFormValues({
    prospectName: values.prospectName,
    propertyAddress: values.propertyAddress,
    zipCode: values.zipCode,
    taxYear: values.taxYear,
    taxDeadline: values.taxDeadline,
    purchasePrice: values.purchasePrice,
    hasCapitalImprovements: values.hasCapitalImprovements,
    capitalImprovementsAmount: values.hasCapitalImprovements ? values.capitalImprovementsAmount : 0,
    landValuePercent: values.landValuePercent,
    is1031Exchange: values.is1031Exchange,
    accumulated1031Depreciation: values.is1031Exchange ? values.accumulated1031Depreciation : 0,
    sqftBuilding: values.sqftBuilding,
    acresLand: values.acresLand,
    propertyType: values.propertyType,
    numberOfFloors: values.numberOfFloors,
    multipleProperties: values.multipleProperties,
    needRush: values.needRush,
    yearBuilt: values.yearBuilt,
    priceOverride: values.priceOverride,
    overrideAmount: values.priceOverride ? values.overrideAmount : undefined,
  } as QuoteFormValues),
);

export type QuoteSchema = z.infer<typeof quoteSchema>;

export const defaultQuoteValues: QuoteFormValues = {
  prospectName: "",
  propertyAddress: "",
  zipCode: "",
  taxYear: new Date().getFullYear(),
  taxDeadline: "October",
  purchasePrice: 0,
  hasCapitalImprovements: false,
  capitalImprovementsAmount: 0,
  landValuePercent: 10,
  is1031Exchange: false,
  accumulated1031Depreciation: 0,
  sqftBuilding: 0,
  acresLand: 0.5,
  propertyType: "Multi-Family",
  numberOfFloors: 1,
  multipleProperties: 1,
  needRush: "no_rush",
  yearBuilt: currentYear,
  priceOverride: false,
  overrideAmount: undefined,
};
