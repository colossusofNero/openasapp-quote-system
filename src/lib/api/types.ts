import { QuoteInput, QuoteOutput } from "@/lib/validations/quote.schema";

/**
 * API Response Types
 */

export interface Quote {
  id: string;
  input: QuoteInput;
  output: QuoteOutput;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface QuotesListResponse {
  quotes: Quote[];
  total: number;
  page: number;
  limit: number;
  stats?: {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
  };
}

export interface QuoteDetailResponse extends Quote {}

export interface CalculateQuoteResponse {
  bidAmount: number;
  landValue: number;
  buildingValue: number;
  paymentOptions: {
    upfront: { amount: number; discount: number };
    fiftyFifty: { firstPayment: number; secondPayment: number; total: number };
    monthly: { monthlyAmount: number; numberOfMonths: number; total: number };
  };
  appliedFactors: {
    costBasisFactor: number;
    zipCodeFactor: number;
    sqFtFactor: number;
    acresFactor: number;
    propertyTypeFactor: number;
    floorsFactor: number;
    multiplePropertiesFactor?: number;
  };
  depreciationSummary: {
    method: string;
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year6: number;
    totalTax: number;
  };
}
