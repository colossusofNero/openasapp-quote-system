import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface PricingDisplayProps {
  paymentOptions: {
    upfront: { amount: number; discount: number };
    fiftyFifty: { firstPayment: number; secondPayment: number; total: number };
    monthly: { monthlyAmount: number; numberOfMonths: number; total: number };
  };
  firstYearBonusDepreciation: number;
}

export function PricingDisplay({
  paymentOptions,
  firstYearBonusDepreciation,
}: PricingDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-rcg-navy font-poppins">
          Engagement Fee
        </h2>
      </div>

      {/* Payment Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pay Upfront - Highlighted */}
        <div className="bg-white border-2 border-rcg-blue rounded-lg p-6 relative hover:shadow-lg transition-shadow">
          {/* Best Value Badge */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-rcg-success text-white px-3 py-1 text-xs font-semibold uppercase">
              Best Value
            </Badge>
          </div>

          <div className="space-y-4 mt-2">
            <div>
              <h3 className="text-lg font-semibold text-rcg-navy mb-1">
                Pay Upfront
              </h3>
              <p className="text-sm text-rcg-text-gray">One-time payment</p>
            </div>

            <div>
              <div className="text-4xl font-bold text-rcg-blue font-tabular-nums">
                {formatCurrency(paymentOptions.upfront.amount)}
              </div>
              <p className="text-lg font-semibold text-rcg-success mt-2">
                Save {paymentOptions.upfront.discount}%
              </p>
            </div>
          </div>
        </div>

        {/* Pay 50/50 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-rcg-navy mb-1">
                Pay 50/50
              </h3>
              <p className="text-sm text-rcg-text-gray">2 payments</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-rcg-text-gray uppercase font-medium mb-1">
                  First Payment
                </p>
                <p className="text-2xl font-bold text-rcg-navy font-tabular-nums">
                  {formatCurrency(paymentOptions.fiftyFifty.firstPayment)}
                </p>
              </div>
              <div>
                <p className="text-xs text-rcg-text-gray uppercase font-medium mb-1">
                  Second Payment
                </p>
                <p className="text-2xl font-bold text-rcg-navy font-tabular-nums">
                  {formatCurrency(paymentOptions.fiftyFifty.secondPayment)}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-rcg-text-gray uppercase font-medium mb-1">
                  Total
                </p>
                <p className="text-lg font-semibold text-rcg-navy font-tabular-nums">
                  {formatCurrency(paymentOptions.fiftyFifty.total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pay Over Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-rcg-navy mb-1">
                Pay Over Time
              </h3>
              <p className="text-sm text-rcg-text-gray">
                Up to {paymentOptions.monthly.numberOfMonths} months
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-rcg-text-gray uppercase font-medium mb-1">
                  Per Month
                </p>
                <p className="text-2xl font-bold text-rcg-navy font-tabular-nums">
                  {formatCurrency(paymentOptions.monthly.monthlyAmount)}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-rcg-text-gray uppercase font-medium mb-1">
                  Total ({paymentOptions.monthly.numberOfMonths} months)
                </p>
                <p className="text-lg font-semibold text-rcg-navy font-tabular-nums">
                  {formatCurrency(paymentOptions.monthly.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First Year Bonus Depreciation Highlight */}
      <div className="bg-rcg-light-blue border border-rcg-blue/20 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-rcg-text-gray uppercase tracking-wide mb-1">
              First Year Bonus Depreciation
            </p>
            <p className="text-3xl font-bold text-rcg-blue font-tabular-nums">
              {formatCurrency(firstYearBonusDepreciation)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-rcg-text-gray">
              Estimated tax benefit in Year 1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
