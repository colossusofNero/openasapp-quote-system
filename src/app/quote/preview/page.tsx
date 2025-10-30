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
        <div className="max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">No quote data found</h1>
          <p className="text-sm text-slate-500">
            Start from the quote form to generate pricing, then return to this page for the summary view.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Go Back
            </button>
            <Link
              href="/quote"
              className="rounded-full bg-rcg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rcg-navy/90"
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
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Quote Preview</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review the calculated totals before handing the quote to RCG Valuation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/quote")}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Edit Inputs
            </button>
            <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
              Generated {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        <QuoteSummary values={values} results={results} />

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-base font-semibold text-slate-900">Share this quote with RCG Valuation</h2>
              <p className="text-sm text-slate-500">
                We keep this workflow stateless so you can run quick quotes. Use the hand-off button to email the results to RCG and let the team follow up.
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
