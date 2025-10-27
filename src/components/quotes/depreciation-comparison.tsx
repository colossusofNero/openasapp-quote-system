import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface YearByYearData {
  year: number;
  costSegEstimate: number;
  standardDepreciation: number;
  traditionalCostSeg: number;
  bonusDepreciation: number;
  cumulativeSavings: number;
}

interface DepreciationComparisonProps {
  depreciationSchedule: YearByYearData[];
  startYear?: number;
}

// Memoized table row to prevent re-renders when parent updates
const DepreciationRow = React.memo(function DepreciationRow({
  yearData,
  displayYear,
  isFirstYear,
}: {
  yearData: YearByYearData;
  displayYear: number;
  isFirstYear: boolean;
}) {
  return (
    <TableRow
      className={`
        ${isFirstYear ? "bg-rcg-light-blue" : "hover:bg-gray-50"}
      `}
    >
      <TableCell
        className={`font-bold ${
          isFirstYear ? "text-rcg-blue" : "text-rcg-navy"
        }`}
      >
        {displayYear}
      </TableCell>
      <TableCell className="text-right font-tabular-nums">
        {formatCurrency(yearData.costSegEstimate)}
      </TableCell>
      <TableCell className="text-right font-tabular-nums">
        {formatCurrency(yearData.standardDepreciation)}
      </TableCell>
      <TableCell className="text-right font-tabular-nums">
        {formatCurrency(yearData.traditionalCostSeg)}
      </TableCell>
      <TableCell className="text-right font-tabular-nums font-semibold text-rcg-blue">
        {formatCurrency(yearData.bonusDepreciation)}
      </TableCell>
    </TableRow>
  );
});

// Memoized summary card to prevent re-renders
const SummaryCard = React.memo(function SummaryCard({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-rcg-text-gray uppercase font-medium mb-2">
        {title}
      </p>
      <p className={`text-2xl font-bold font-tabular-nums ${className || "text-rcg-navy"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
});

export function DepreciationComparison({
  depreciationSchedule,
  startYear = 2025,
}: DepreciationComparisonProps) {
  // Memoize totals calculation to prevent re-computation on every render
  const totals = React.useMemo(() => {
    return depreciationSchedule.reduce(
      (acc, year) => ({
        costSegEstimate: acc.costSegEstimate + year.costSegEstimate,
        standardDepreciation: acc.standardDepreciation + year.standardDepreciation,
        traditionalCostSeg: acc.traditionalCostSeg + year.traditionalCostSeg,
        bonusDepreciation: acc.bonusDepreciation + year.bonusDepreciation,
      }),
      {
        costSegEstimate: 0,
        standardDepreciation: 0,
        traditionalCostSeg: 0,
        bonusDepreciation: 0,
      }
    );
  }, [depreciationSchedule]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-rcg-navy font-poppins">
          Depreciation Comparison
        </h2>
        <p className="text-sm text-rcg-text-gray mt-1">
          Year-by-year comparison of different depreciation methods
        </p>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-rcg-navy hover:bg-rcg-navy">
              <TableHead className="text-white font-bold">Year</TableHead>
              <TableHead className="text-right text-white font-bold">
                Cost Seg Est
              </TableHead>
              <TableHead className="text-right text-white font-bold">
                Std. Dep
              </TableHead>
              <TableHead className="text-right text-white font-bold">
                Trad. Cost Seg
              </TableHead>
              <TableHead className="text-right text-white font-bold bg-rcg-blue">
                Bonus Dep
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {depreciationSchedule.map((yearData, index) => (
              <DepreciationRow
                key={yearData.year}
                yearData={yearData}
                displayYear={startYear + index}
                isFirstYear={index === 0}
              />
            ))}

            {/* Total Row */}
            <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <TableCell className="text-rcg-navy">Total</TableCell>
              <TableCell className="text-right font-tabular-nums text-rcg-navy">
                {formatCurrency(totals.costSegEstimate)}
              </TableCell>
              <TableCell className="text-right font-tabular-nums text-rcg-navy">
                {formatCurrency(totals.standardDepreciation)}
              </TableCell>
              <TableCell className="text-right font-tabular-nums text-rcg-navy">
                {formatCurrency(totals.traditionalCostSeg)}
              </TableCell>
              <TableCell className="text-right font-tabular-nums font-bold text-rcg-blue">
                {formatCurrency(totals.bonusDepreciation)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="lg:hidden space-y-4">
        {depreciationSchedule.map((yearData, index) => {
          const displayYear = startYear + index;
          const isFirstYear = index === 0;

          return (
            <div
              key={yearData.year}
              className={`rounded-lg p-4 ${
                isFirstYear ? "bg-rcg-light-blue border-2 border-rcg-blue" : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-rcg-navy">Year {displayYear}</span>
                {isFirstYear && (
                  <Badge className="bg-rcg-blue text-white">Current Year</Badge>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-rcg-text-gray">Cost Seg Est:</span>
                  <span className="font-semibold font-tabular-nums">{formatCurrency(yearData.costSegEstimate)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-rcg-text-gray">Standard Dep:</span>
                  <span className="font-semibold font-tabular-nums">{formatCurrency(yearData.standardDepreciation)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-rcg-text-gray">Trad. Cost Seg:</span>
                  <span className="font-semibold font-tabular-nums">{formatCurrency(yearData.traditionalCostSeg)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-300 pt-2 mt-2">
                  <span className="font-medium text-rcg-blue">Bonus Dep:</span>
                  <span className="font-bold text-rcg-blue font-tabular-nums">{formatCurrency(yearData.bonusDepreciation)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Total Card */}
        <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold text-rcg-navy">Total</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-rcg-text-gray">Cost Seg Est:</span>
              <span className="font-bold font-tabular-nums">{formatCurrency(totals.costSegEstimate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-rcg-text-gray">Standard Dep:</span>
              <span className="font-bold font-tabular-nums">{formatCurrency(totals.standardDepreciation)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-rcg-text-gray">Trad. Cost Seg:</span>
              <span className="font-bold font-tabular-nums">{formatCurrency(totals.traditionalCostSeg)}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-400 pt-2 mt-2">
              <span className="font-medium text-rcg-blue">Bonus Dep:</span>
              <span className="font-bold text-rcg-blue font-tabular-nums text-lg">{formatCurrency(totals.bonusDepreciation)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Savings vs Standard"
          value={totals.bonusDepreciation - totals.standardDepreciation}
          className="text-rcg-success"
        />
        <SummaryCard
          title="First Year Benefit"
          value={depreciationSchedule[0]?.bonusDepreciation || 0}
          className="text-rcg-blue"
        />
        <SummaryCard
          title="Total 6-Year Depreciation"
          value={totals.bonusDepreciation}
          className="text-rcg-navy"
        />
      </div>
    </div>
  );
}
