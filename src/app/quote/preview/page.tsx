"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { QuoteSummary } from "@/components/QuoteSummary";
import { QuoteComputation, QuoteFormValues, calculateQuote } from "@/lib/quoteMath";
import { QuoteSchema, quoteSchema } from "@/lib/quoteSchema";

export default function QuotePreviewPage() {
  const router = useRouter();
  const [values, setValues] = useState<QuoteFormValues | null>(null);
  const [results, setResults] = useState<QuoteComputation | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("quoteFormData");
    if (!stored) {
      return;
    }

    try {
      const parsedRaw = JSON.parse(stored) as QuoteSchema;
      const parsed = quoteSchema.parse(parsedRaw);
      setValues(parsed);
      setResults(calculateQuote(parsed));
    } catch (error) {
      console.error("Failed to parse stored quote data", error);
      window.sessionStorage.removeItem("quoteFormData");
    }
  }, []);

  if (!values || !results) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">No quote data found</h1>
          <p className="text-sm text-slate-500">
            Start from the quote form to generate pricing, then return to this page for the summary view.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Go Back
            </button>
            <Link
              href="/quote"
              className="rounded-full bg-rcg-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rcg-blue/90"
            >
              Open Quote Form
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/quote")}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Edit Inputs
          </button>
          <div className="text-right text-sm text-slate-500">
            Generated {new Date().toLocaleString()}
          </div>
        </div>
        <QuoteSummary values={values} results={results} />
      </div>
    </main>
  );
}
