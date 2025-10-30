import { QuoteComputation, QuoteFormValues } from "@/lib/quoteMath";
import { formatMoney, formatNumber } from "@/lib/utils";

interface QuoteDocumentProps {
  values: QuoteFormValues;
  results: QuoteComputation;
}

export function QuoteDocument({ values, results }: QuoteDocumentProps) {
  const today = new Date().toLocaleDateString();

  return (
    <article className="max-w-[800px] rounded-3xl bg-white p-10 text-slate-900 shadow-xl">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">RCG Valuation</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Cost Segregation Quote</h1>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Prepared for {values.prospectName || "Valued Client"} on {today}.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-6 py-4 text-right text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Final bid</p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(results.finalBid)}</p>
          {results.rushFee > 0 && (
            <p className="mt-1 text-xs text-white/80">Includes rush fee of {formatMoney(results.rushFee)}</p>
          )}
        </div>
      </header>

      <section className="grid gap-4 border-b border-slate-200 py-6 text-sm text-slate-600 sm:grid-cols-2">
        <InfoBlock label="Prospect" value={values.prospectName || "—"} />
        <InfoBlock label="Property" value={values.propertyAddress || "—"} />
        <InfoBlock label="Tax year" value={`${values.taxYear} • ${values.taxDeadline}`} />
        <InfoBlock label="Property type" value={values.propertyType} />
        <InfoBlock label="SqFt building" value={`${formatNumber(values.sqftBuilding)} sqft`} />
        <InfoBlock label="Land acres" value={`${values.acresLand.toFixed(2)} acres`} />
        <InfoBlock label="Year built" value={values.yearBuilt.toString()} />
        <InfoBlock label="Floors" value={values.numberOfFloors.toString()} />
        <InfoBlock label="Properties" value={values.multipleProperties.toString()} />
        <InfoBlock label="Rush" value={values.needRush === "rush" ? "Yes" : "No"} />
      </section>

      <section className="space-y-4 border-b border-slate-200 py-6">
        <h2 className="text-base font-semibold text-slate-900">Pricing breakdown</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Line item</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <Row label="Base cost seg bid" value={results.baseCostSegBid} />
              <Row label="Natural log quote" value={results.natLogQuote} />
              <Row label="Multiple properties quote" value={results.multiplePropertiesQuote} />
              <Row label="Cost method floor" value={results.costMethodQuote} highlight />
              {results.rushFee > 0 && <Row label="Rush fee" value={results.rushFee} subtle />}
              {values.priceOverride && values.overrideAmount && (
                <Row label="Manual override" value={values.overrideAmount} subtle />
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white">
                <td className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.3em]">Total</td>
                <td className="px-4 py-4 text-right text-lg font-bold">{formatMoney(results.finalBid)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="space-y-4 py-6">
        <h2 className="text-base font-semibold text-slate-900">Payment options</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <PaymentCard
            label="50/50 Plan"
            total={results.fiftyFiftyPlanTotal}
            supporting={`${formatMoney(results.fiftyFiftyInstallment)} per installment`}
          />
          <PaymentCard
            label="Monthly Plan"
            total={results.monthlyTotal}
            supporting={`${formatMoney(results.monthlyInstallment)} per month`}
          />
          <PaymentCard
            label="Bonus Depreciation"
            total={results.bonusDepreciation}
            supporting="Estimated 80% capture"
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Notes</p>
        <p className="mt-2 leading-relaxed">
          This estimate reflects the information provided on {today}. Final fees may adjust after engagement kickoff and review of
          supporting documentation.
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">© {new Date().getFullYear()} RCG Valuation</p>
      </section>
    </article>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  subtle,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  subtle?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-emerald-50" : subtle ? "bg-slate-50/70" : undefined}>
      <td className="px-4 py-3 text-slate-600">{label}</td>
      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatMoney(value)}</td>
    </tr>
  );
}

function PaymentCard({ label, total, supporting }: { label: string; total: number; supporting: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{formatMoney(total)}</p>
      <p className="mt-1 text-sm text-slate-500">{supporting}</p>
    </div>
  );
}
