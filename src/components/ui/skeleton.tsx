import { cn } from "@/lib/utils";

/**
 * Base skeleton component for loading states
 * Provides a pulsing animation to indicate loading content
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card-shaped skeleton for loading card components
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-6 space-y-4", className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Table row skeleton for loading table data
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table skeleton with header and multiple rows
 */
export function TableSkeleton({
  columns = 5,
  rows = 6
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4">
                <Skeleton className="h-4 w-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Form skeleton for loading form components
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Info card skeleton for loading InfoCard components
 */
export function InfoCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 p-6 space-y-3",
      className
    )}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

/**
 * Quote header skeleton for loading quote headers
 */
export function QuoteHeaderSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InfoCardSkeleton />
        <InfoCardSkeleton />
        <InfoCardSkeleton />
      </div>
    </div>
  );
}

/**
 * Pricing display skeleton
 */
export function PricingDisplaySkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Depreciation comparison skeleton
 */
export function DepreciationComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <TableSkeleton columns={5} rows={7} />
      <div className="grid grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Full quote detail page skeleton
 */
export function QuoteDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Action buttons skeleton */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Quote header */}
      <QuoteHeaderSkeleton />

      {/* Pricing display */}
      <PricingDisplaySkeleton />

      {/* Depreciation comparison */}
      <DepreciationComparisonSkeleton />
    </div>
  );
}

/**
 * Dashboard quotes list skeleton
 */
export function QuotesListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} className="h-32" />
      ))}
    </div>
  );
}
