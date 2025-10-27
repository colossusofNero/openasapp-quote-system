"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./tooltip";
import { Info } from "lucide-react";

export interface InfoCardProps {
  label: string;
  value: string | number;
  helpText?: string;
  icon?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

// Memoized InfoCard component to prevent unnecessary re-renders
// This is especially important when displaying multiple info cards in a grid
export const InfoCard = React.memo(function InfoCard({
  label,
  value,
  helpText,
  icon,
  className,
  valueClassName,
}: InfoCardProps) {
  // Format the value if it's a number
  const formattedValue = React.useMemo(() => {
    if (typeof value === "number") {
      return value.toLocaleString("en-US");
    }
    return value;
  }, [value]);

  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl border border-gray-200 p-6",
        "transition-all duration-200 hover:shadow-lg hover:border-rcg-blue/20",
        className
      )}
    >
      {/* Icon if provided */}
      {icon && (
        <div className="mb-4 text-rcg-blue">
          {icon}
        </div>
      )}

      {/* Label with optional help text */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-rcg-text-gray">
          {label}
        </span>
        {helpText && (
          <Tooltip content={helpText} side="top">
            <button
              type="button"
              className="inline-flex items-center justify-center text-rcg-text-gray/60 hover:text-rcg-blue transition-colors"
              aria-label="More information"
            >
              <Info className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Value display */}
      <div
        className={cn(
          "text-2xl sm:text-3xl font-bold text-rcg-navy font-tabular-nums",
          valueClassName
        )}
      >
        {formattedValue}
      </div>

      {/* Subtle indicator on hover */}
      <div className="absolute inset-0 rounded-xl border-2 border-rcg-blue opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
});

// Format currency helper
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format percentage helper
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
