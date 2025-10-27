"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuote, useDeleteQuote } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuoteDetailSkeleton, DepreciationComparisonSkeleton } from "@/components/ui/skeleton";
import { QuoteHeader } from "@/components/quotes/quote-header";
import { PricingDisplay } from "@/components/quotes/pricing-display";
import { PaymentOptions } from "@/components/quotes/payment-options";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { Download } from "lucide-react";
import { generateQuotePDF } from "@/lib/pdf/quote-pdf";
import toast from "react-hot-toast";

// Lazy load heavy components for better performance
// These components contain large tables and complex calculations
const DepreciationComparison = dynamic(
  () => import("@/components/quotes/depreciation-comparison").then(mod => ({
    default: mod.DepreciationComparison
  })),
  {
    loading: () => <DepreciationComparisonSkeleton />,
    ssr: true, // Enable SSR for SEO
  }
);

const ComparisonChart = dynamic(
  () => import("@/components/quotes/comparison-chart").then(mod => ({
    default: mod.ComparisonChart
  })),
  {
    loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false, // Charts can be client-side only
  }
);

const DepreciationTable = dynamic(
  () => import("@/components/quotes/depreciation-table").then(mod => ({
    default: mod.DepreciationTable
  })),
  {
    loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg" />,
    ssr: true,
  }
);

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const { data: quoteResponse, isLoading } = useQuote(quoteId);
  const deleteQuote = useDeleteQuote();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this quote?")) {
      deleteQuote.mutate(quoteId, {
        onSuccess: () => {
          router.push("/quotes");
        },
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!quoteResponse?.data) return;

    setIsGeneratingPDF(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      generateQuotePDF(quoteResponse.data);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return <QuoteDetailSkeleton />;
  }

  if (!quoteResponse?.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Quote not found</AlertDescription>
      </Alert>
    );
  }

  const quote = quoteResponse.data;

  // Generate depreciation schedule from summary data if full schedule isn't available
  const generateDepreciationSchedule = () => {
    if (!quote.output.depreciationSummary) return null;

    const summary = quote.output.depreciationSummary;
    const buildingValue = quote.output.buildingValue;

    // Generate year-by-year data based on the summary
    // This is a simplified version - actual calculation would come from the quote engine
    return [
      {
        year: 1,
        costSegEstimate: summary.year1,
        standardDepreciation: buildingValue / 39, // Standard straight-line
        traditionalCostSeg: summary.year1 * 0.7, // Traditional cost seg estimate
        bonusDepreciation: summary.year1,
        cumulativeSavings: summary.year1 - (buildingValue / 39),
      },
      {
        year: 2,
        costSegEstimate: summary.year2,
        standardDepreciation: buildingValue / 39,
        traditionalCostSeg: summary.year2 * 0.8,
        bonusDepreciation: summary.year2,
        cumulativeSavings: summary.year1 + summary.year2 - (2 * buildingValue / 39),
      },
      {
        year: 3,
        costSegEstimate: summary.year3,
        standardDepreciation: buildingValue / 39,
        traditionalCostSeg: summary.year3 * 0.85,
        bonusDepreciation: summary.year3,
        cumulativeSavings: summary.year1 + summary.year2 + summary.year3 - (3 * buildingValue / 39),
      },
      {
        year: 4,
        costSegEstimate: summary.year4,
        standardDepreciation: buildingValue / 39,
        traditionalCostSeg: summary.year4 * 0.9,
        bonusDepreciation: summary.year4,
        cumulativeSavings: summary.year1 + summary.year2 + summary.year3 + summary.year4 - (4 * buildingValue / 39),
      },
      {
        year: 5,
        costSegEstimate: summary.year5,
        standardDepreciation: buildingValue / 39,
        traditionalCostSeg: summary.year5 * 0.9,
        bonusDepreciation: summary.year5,
        cumulativeSavings: summary.year1 + summary.year2 + summary.year3 + summary.year4 + summary.year5 - (5 * buildingValue / 39),
      },
      {
        year: 6,
        costSegEstimate: summary.year6,
        standardDepreciation: buildingValue / 39,
        traditionalCostSeg: summary.year6 * 0.95,
        bonusDepreciation: summary.year6,
        cumulativeSavings: summary.year1 + summary.year2 + summary.year3 + summary.year4 + summary.year5 + summary.year6 - (6 * buildingValue / 39),
      },
    ];
  };

  const depreciationSchedule = generateDepreciationSchedule();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "success";
      case "sent":
        return "warning";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Buttons - Top Right */}
      <div className="flex justify-end gap-2">
        <Link href="/quotes/new">
          <Button variant="outline">Create New Quote</Button>
        </Link>
        <Link href={`/quotes/${quoteId}/edit`}>
          <Button variant="outline">Edit Quote</Button>
        </Link>
        <Button variant="outline" onClick={handleDelete}>
          Delete
        </Button>
        <Button
          className="bg-rcg-blue hover:bg-rcg-blue/90"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* RCG Quote Header */}
      <QuoteHeader
        clientName={quote.input.propertyOwnerName}
        propertyAddress={quote.input.propertyAddress}
        quoteDate={quote.createdAt}
        purchasePrice={quote.input.purchasePrice}
        buildingSqFt={quote.input.sqFtBuilding}
        landAcres={quote.input.acresLand}
        yearBuilt={quote.input.yearBuilt}
      />

      {/* Pricing Display with Payment Options */}
      <PricingDisplay
        paymentOptions={quote.output.paymentOptions}
        firstYearBonusDepreciation={
          quote.output.depreciationSummary?.year1 || 0
        }
      />

      {/* Depreciation Comparison Table */}
      {depreciationSchedule && (
        <DepreciationComparison
          depreciationSchedule={depreciationSchedule}
          startYear={new Date().getFullYear()}
        />
      )}

      {/* Admin Section - Only visible in dashboard, not in PDF */}
      <div className="pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-rcg-navy mb-4">
          Internal Details
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quote Calculations */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Calculations</CardTitle>
              <CardDescription>Internal pricing details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Building Value:</span>
                  <span className="font-semibold">{formatCurrency(quote.output.buildingValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Land Value:</span>
                  <span className="font-semibold">{formatCurrency(quote.output.landValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Final Bid Amount:</span>
                  <span className="font-semibold text-rcg-blue">{formatCurrency(quote.output.bidAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applied Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Applied Factors</CardTitle>
              <CardDescription>Pricing multipliers used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost Basis Factor:</span>
                  <span className="font-medium">{quote.output.appliedFactors.costBasisFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ZIP Code Factor:</span>
                  <span className="font-medium">{quote.output.appliedFactors.zipCodeFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sq Ft Factor:</span>
                  <span className="font-medium">{quote.output.appliedFactors.sqFtFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Type Factor:</span>
                  <span className="font-medium">{quote.output.appliedFactors.propertyTypeFactor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote Metadata */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Quote Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <Badge variant={getStatusVariant(quote.status)}>
                  {quote.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Quote Type</p>
                <p className="font-medium">{quote.input.quoteType}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{formatDateShort(quote.createdAt)}</p>
              </div>
            </div>
            {quote.input.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-muted-foreground text-sm mb-2">Notes:</p>
                <p className="text-sm">{quote.input.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
