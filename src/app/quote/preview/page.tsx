"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { QuoteSummary } from "@/components/QuoteSummary";
import { QuoteComputation, QuoteFormValues, calculateQuote } from "@/lib/quoteMath";
import { QuoteSchema, quoteSchema } from "@/lib/quoteSchema";
import { formatMoney, formatNumber } from "@/lib/utils";

const SUBMISSION_EMAIL = "quotes@rcgv.com";

function createSubmissionLink(values: QuoteFormValues, results: QuoteComputation): string {
  const subject = `Quote Request – ${values.propertyAddress}`;
  const lines = [
    "I'd like RCG Valuation to follow up on this quote.",
    "",
    `Prospect: ${values.prospectName}`,
    `Property: ${values.propertyAddress}`,
    `Tax Year / Deadline: ${values.taxYear} • ${values.taxDeadline}`,
    `Property Type: ${values.propertyType}`,
    `Final Bid: ${formatMoney(results.finalBid)}`,
    `Rush Selected: ${values.needRush === "rush" ? "Yes" : "No"}`,
    "",
    "Key Inputs:",
    `Purchase Price: ${formatMoney(values.purchasePrice)}`,
    `Capital Improvements: ${formatMoney(values.capitalImprovementsAmount)}`,
    `Land Value %: ${values.landValuePercent.toFixed(2)}%`,
    `SqFt Building: ${formatNumber(values.sqftBuilding)}`,
    `Acres: ${values.acresLand.toFixed(2)}`,
    `Floors: ${values.numberOfFloors}`,
    `Multiple Properties: ${values.multipleProperties}`,
    `1031 Exchange: ${values.is1031Exchange ? `Yes – ${formatMoney(values.accumulated1031Depreciation)}` : "No"}`,
  ];

  const body = encodeURIComponent(lines.join("\n"));
  const encodedSubject = encodeURIComponent(subject);
  return `mailto:${SUBMISSION_EMAIL}?subject=${encodedSubject}&body=${body}`;
}

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

  const submissionHref = createSubmissionLink(values, results);

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

        <section className="mt-10 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl text-sm text-slate-600">
              <h2 className="text-base font-semibold text-slate-900">Share this quote with RCG Valuation</h2>
              <p className="mt-2 text-sm text-slate-500">
                This interface gives you a fast, accurate quote preview. We don&apos;t store quotes in the browser—use the button
                below to email the details to RCG if you&apos;d like the team to follow up.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={submissionHref}
                className="inline-flex items-center justify-center rounded-full bg-rcg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rcg-navy/90"
              >
                Email this quote to RCG
              </a>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.sessionStorage.removeItem("quoteFormData");
                  }
                  router.push("/quote");
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Start a new quote
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
