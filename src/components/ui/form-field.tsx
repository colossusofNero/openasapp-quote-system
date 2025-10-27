import * as React from "react";
import { cn } from "@/lib/utils";
import { InfoIcon, AlertCircleIcon } from "lucide-react";

export interface FormFieldProps {
  label: string;
  helpText?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FormField({
  label,
  helpText,
  required = false,
  error,
  children,
  htmlFor,
  className,
}: FormFieldProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-gray-700 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        {helpText && (
          <div className="relative">
            <button
              type="button"
              className="text-gray-400 hover:text-rcg-blue transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
            >
              <InfoIcon className="h-4 w-4" />
            </button>

            {showTooltip && (
              <div className="absolute left-0 top-6 z-50 w-64 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
                {helpText}
                <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-gray-900" />
              </div>
            )}
          </div>
        )}
      </div>

      {children}

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
