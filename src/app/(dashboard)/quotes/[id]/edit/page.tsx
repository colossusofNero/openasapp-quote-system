"use client";

import { useParams } from "next/navigation";
import { useQuote } from "@/lib/api/hooks";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditQuotePage() {
  const params = useParams();
  const quoteId = params.id as string;

  const { data: quoteResponse, isLoading } = useQuote(quoteId);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Quote</h1>
        <p className="text-muted-foreground mt-1">
          Update the quote details for {quote.input.propertyOwnerName}
        </p>
      </div>

      <QuoteForm initialData={quote.input} quoteId={quoteId} />
    </div>
  );
}
