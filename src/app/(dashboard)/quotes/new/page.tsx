"use client";

import { QuoteForm } from "@/components/quotes/quote-form";

export default function NewQuotePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create New Quote</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the property details to generate a cost segregation quote
        </p>
      </div>

      <QuoteForm />
    </div>
  );
}
