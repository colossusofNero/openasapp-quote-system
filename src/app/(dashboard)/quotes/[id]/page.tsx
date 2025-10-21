"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuote, useDeleteQuote } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentOptions } from "@/components/quotes/payment-options";
import { DepreciationTable } from "@/components/quotes/depreciation-table";
import { ComparisonChart } from "@/components/quotes/comparison-chart";
import { formatCurrency, formatDateShort } from "@/lib/utils";

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const { data: quoteResponse, isLoading } = useQuote(quoteId);
  const deleteQuote = useDeleteQuote();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this quote?")) {
      deleteQuote.mutate(quoteId, {
        onSuccess: () => {
          router.push("/quotes");
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!quoteResponse?.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Quote not found</AlertDescription>
      </Alert>
    );
  }

  const quote = quoteResponse.data;

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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{quote.input.propertyOwnerName}</h1>
            <Badge variant={getStatusVariant(quote.status)}>
              {quote.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{quote.input.propertyAddress}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Created {formatDateShort(quote.createdAt)} • Quote Type: {quote.input.quoteType}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/quotes/${quoteId}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}>
            Delete
          </Button>
          <Button>Send to Client</Button>
        </div>
      </div>

      {/* Property Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Property Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Purchase Price</p>
              <p className="text-lg font-semibold">
                {formatCurrency(quote.input.purchasePrice)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Building Size</p>
              <p className="text-lg font-semibold">
                {quote.input.sqFtBuilding.toLocaleString()} sq ft
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Land Size</p>
              <p className="text-lg font-semibold">
                {quote.input.acresLand} acres
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Property Type</p>
              <p className="text-lg font-semibold">{quote.input.propertyType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Year Built</p>
              <p className="text-lg font-semibold">{quote.input.yearBuilt}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Number of Floors</p>
              <p className="text-lg font-semibold">{quote.input.numberOfFloors}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
          <CardDescription>Calculated pricing and values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Final Bid Amount</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(quote.output.bidAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Building Value</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(quote.output.buildingValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Land Value</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(quote.output.landValue)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Applied Factors</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Basis Factor:</span>
                    <span>{quote.output.appliedFactors.costBasisFactor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ZIP Code Factor:</span>
                    <span>{quote.output.appliedFactors.zipCodeFactor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sq Ft Factor:</span>
                    <span>{quote.output.appliedFactors.sqFtFactor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Type Factor:</span>
                    <span>{quote.output.appliedFactors.propertyTypeFactor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Payment Options</h2>
        <PaymentOptions paymentOptions={quote.output.paymentOptions} />
      </div>

      {/* Comparison Chart */}
      <ComparisonChart
        data={{
          buildingValue: quote.output.buildingValue,
          landValue: quote.output.landValue,
          bidAmount: quote.output.bidAmount,
        }}
      />

      {/* Depreciation Table */}
      <DepreciationTable depreciationSummary={quote.output.depreciationSummary} />

      {/* Notes */}
      {quote.input.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{quote.input.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
