import { QuoteComputation, QuoteFormValues } from "@/lib/quoteMath";
import { formatMoney, formatNumber } from "@/lib/utils";

interface QuoteSummaryProps {
  values: QuoteFormValues;
  results: QuoteComputation;
}

export function QuoteSummary({ values, results }: QuoteSummaryProps) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <section className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rcg-text-gray">Quote Summary</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{values.prospectName || "Valued Client"}</h1>
            <p className="mt-1 text-sm text-slate-500">{values.propertyAddress}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide text-slate-500">
              <span>Tax Year {values.taxYear}</span>
              <span>Deadline {values.taxDeadline}</span>
              <span>{values.propertyType}</span>
              <span>{formatNumber(values.multipleProperties)} property{values.multipleProperties === 1 ? "" : "ies"}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-rcg-light-blue px-6 py-4 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-rcg-blue">Final Bid</p>
            <p className="mt-1 text-3xl font-bold text-rcg-navy">{formatMoney(results.finalBid)}</p>
            {results.rushFee > 0 && (
              <p className="text-xs text-rcg-text-gray">Includes rush fee of {formatMoney(results.rushFee)}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pricing Methods</h2>
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <SummaryRow label="Base Cost Seg Bid" value={results.baseCostSegBid} />
              <SummaryRow label="Natural Log Quote" value={results.natLogQuote} />
              <SummaryRow label="Multiple Properties Quote" value={results.multiplePropertiesQuote} />
              <SummaryRow label="Cost Method Floor" value={results.costMethodQuote} highlight />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Payment Options</h2>
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <SummaryRow label="50/50 Pay Plan (total)" value={results.fiftyFiftyPlanTotal} />
              <SummaryRow label="50/50 Installment" value={results.fiftyFiftyInstallment} subtle />
              <SummaryRow label="Monthly Plan (total)" value={results.monthlyTotal} />
              <SummaryRow label="Monthly Installment" value={results.monthlyInstallment} subtle />
              <SummaryRow label="Bonus Depreciation" value={results.bonusDepreciation} emphasis />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Property Snapshot</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Snapshot label="Purchase Price" value={formatMoney(values.purchasePrice)} />
          <Snapshot
            label="Land Value"
            value={`${formatMoney(results.landValue)} (${values.landValuePercent.toFixed(2)}%)`}
          />
          <Snapshot label="Building Value" value={formatMoney(results.buildingValue)} />
          <Snapshot label="Square Footage" value={`${formatNumber(values.sqftBuilding)} sqft`} />
          <Snapshot label="Acres" value={values.acresLand.toFixed(2)} />
          <Snapshot label="Year Built" value={values.yearBuilt.toString()} />
          <Snapshot label="Property Type" value={values.propertyType} />
          <Snapshot label="Floors" value={values.numberOfFloors.toString()} />
          <Snapshot label="Multiple Properties" value={values.multipleProperties.toString()} />
        </div>
      </section>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: number;
  highlight?: boolean;
  subtle?: boolean;
  emphasis?: boolean;
}

function SummaryRow({ label, value, highlight = false, subtle = false, emphasis = false }: SummaryRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
        highlight
          ? "bg-rcg-light-blue text-rcg-navy"
          : subtle
          ? "bg-transparent text-slate-500"
          : "bg-white text-slate-600"
      } ${emphasis ? "font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span className={`font-semibold ${subtle ? "text-slate-600" : "text-slate-900"}`}>{formatMoney(value)}</span>
    </div>
  );
}

interface SnapshotProps {
  label: string;
  value: string;
}

function Snapshot({ label, value }: SnapshotProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
