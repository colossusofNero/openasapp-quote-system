import { ReactNode } from "react";

import { QuoteComputation, QuoteFormValues } from "@/lib/quoteMath";
import { formatMoney, formatNumber } from "@/lib/utils";

interface QuoteSummaryProps {
  values: QuoteFormValues;
  results: QuoteComputation;
}

export function QuoteSummary({ values, results }: QuoteSummaryProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="bg-gradient-to-br from-rcg-navy via-rcg-blue to-sky-500 px-8 py-10 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Quote Summary</p>
            <h1 className="mt-2 text-3xl font-semibold">
              {values.prospectName ? values.prospectName : "Valued Client"}
            </h1>
            <p className="mt-1 text-sm text-white/75">{values.propertyAddress}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-wide text-white/70">
              <SummaryChip label={`Tax Year ${values.taxYear}`} />
              <SummaryChip label={`Deadline ${values.taxDeadline}`} />
              <SummaryChip label={values.propertyType} />
              <SummaryChip
                label={`${formatNumber(values.multipleProperties)} property${values.multipleProperties === 1 ? "" : "ies"}`}
              />
            </div>
          </div>
          <div className="rounded-3xl bg-white/15 px-8 py-6 text-right shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Final Bid</p>
            <p className="mt-2 text-4xl font-bold text-white">{formatMoney(results.finalBid)}</p>
            {results.rushFee > 0 && (
              <p className="mt-1 text-xs text-white/75">Includes rush fee of {formatMoney(results.rushFee)}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightMetric
            label="Base Cost Seg Bid"
            value={formatMoney(results.baseCostSegBid)}
            supporting="Before multi-property & overrides"
          />
          <HighlightMetric
            label="50/50 Pay Plan"
            value={formatMoney(results.fiftyFiftyPlanTotal)}
            supporting={`${formatMoney(results.fiftyFiftyInstallment)} × 2`}
          />
          <HighlightMetric
            label="Monthly Plan"
            value={formatMoney(results.monthlyTotal)}
            supporting={`${formatMoney(results.monthlyInstallment)} / month`}
          />
        </div>
      </div>

      <div className="grid gap-8 p-8 lg:grid-cols-[1.25fr,1fr]">
        <div className="space-y-8">
          <SummarySection title="Pricing Methods">
            <div className="space-y-3">
              <PricingRow label="Base Cost Seg Bid" value={results.baseCostSegBid} />
              <PricingRow label="Natural Log Quote" value={results.natLogQuote} />
              <PricingRow label="Multiple Properties Quote" value={results.multiplePropertiesQuote} />
              <PricingRow label="Cost Method Floor" value={results.costMethodQuote} highlight />
            </div>
          </SummarySection>

          <SummarySection title="Payment Options & Bonus">
            <div className="grid gap-4 md:grid-cols-2">
              <PaymentCard
                label="50/50 Plan"
                value={results.fiftyFiftyPlanTotal}
                supporting={`${formatMoney(results.fiftyFiftyInstallment)} per installment`}
              />
              <PaymentCard
                label="Monthly Plan"
                value={results.monthlyTotal}
                supporting={`${formatMoney(results.monthlyInstallment)} per month`}
              />
              <PaymentCard
                label="Bonus Depreciation"
                value={results.bonusDepreciation}
                tone="accent"
                supporting="Estimated 80% capture"
              />
            </div>
          </SummarySection>
        </div>

        <SummarySection title="Property Snapshot">
          <div className="grid gap-4 sm:grid-cols-2">
            <Snapshot label="Purchase Price" value={formatMoney(values.purchasePrice)} />
            <Snapshot label="Land Value" value={`${formatMoney(results.landValue)} (${values.landValuePercent.toFixed(2)}%)`} />
            <Snapshot label="Building Value" value={formatMoney(results.buildingValue)} />
            <Snapshot label="SqFt Building" value={`${formatNumber(values.sqftBuilding)} sqft`} />
            <Snapshot label="Acres" value={values.acresLand.toFixed(2)} />
            <Snapshot label="Year Built" value={values.yearBuilt.toString()} />
            <Snapshot label="Floors" value={values.numberOfFloors.toString()} />
            <Snapshot label="Multiple Properties" value={values.multipleProperties.toString()} />
          </div>
        </SummarySection>
      </div>
    </article>
  );
}

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold tracking-wide">
      {label}
    </span>
  );
}

function HighlightMetric({
  label,
  value,
  supporting,
}: {
  label: string;
  value: string;
  supporting?: string;
}) {
  return (
    <div className="rounded-3xl bg-white/15 px-5 py-4 text-white shadow-inner backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      {supporting && <p className="text-xs text-white/75">{supporting}</p>}
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function PricingRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-5 py-3 text-sm transition ${
        highlight
          ? "border-rcg-blue/40 bg-rcg-light-blue/60 text-rcg-navy"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{formatMoney(value)}</span>
    </div>
  );
}

function PaymentCard({
  label,
  value,
  supporting,
  tone = "default",
}: {
  label: string;
  value: number;
  supporting?: string;
  tone?: "default" | "accent";
}) {
  const classes =
    tone === "accent"
      ? "border-rcg-blue/40 bg-rcg-light-blue/60 text-rcg-navy"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm ${classes}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{formatMoney(value)}</p>
      {supporting && <p className="mt-1 text-xs text-slate-500">{supporting}</p>}
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
