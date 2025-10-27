"use client";

// Prevent static generation for dashboard routes
export const dynamic = 'force-dynamic';

import { QuoteForm } from "@/components/quotes/quote-form";

export default function NewQuotePage() {
  return (
    <div className="min-h-screen bg-rcg-bg py-8">
      <div className="container mx-auto px-4">
        <QuoteForm />
      </div>
    </div>
  );
}
