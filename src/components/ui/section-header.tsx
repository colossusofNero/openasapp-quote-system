import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 mb-6 border-b border-gray-200",
        className
      )}
    >
      <div className="flex-1">
        <h2 className="text-xl sm:text-2xl font-semibold text-rcg-navy font-poppins">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-rcg-text-gray">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="sm:ml-4 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
