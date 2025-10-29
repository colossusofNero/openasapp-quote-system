"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldRenderProps {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

interface FieldProps {
  label: string;
  fieldId: string;
  children: (props: FieldRenderProps) => ReactNode;
  required?: boolean;
  helpText?: string;
  error?: string;
  className?: string;
}

export function Field({
  label,
  fieldId,
  children,
  required = false,
  helpText,
  error,
  className,
}: FieldProps) {
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <label htmlFor={fieldId} className="text-slate-600">
          {label}
        </label>
        {required ? (
          <span className="text-rose-500" aria-hidden>
            *
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">Optional</span>
        )}
      </div>
      {children({ id: fieldId, describedBy, invalid })}
      {helpText && (
        <p id={helpId} className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
