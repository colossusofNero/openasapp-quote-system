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
  hint?: string;
}

export function Field({
  label,
  fieldId,
  children,
  required = false,
  helpText,
  error,
  className,
  hint,
}: FieldProps) {
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helpId, hintId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={fieldId} className="text-sm font-semibold text-slate-800">
          <span className="inline-flex items-center gap-1">
            {label}
            {required ? (
              <span className="text-xs font-medium text-sky-500" aria-hidden>
                *
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Optional
              </span>
            )}
          </span>
        </label>
        {hint && (
          <span id={hintId} className="text-xs text-slate-500">
            {hint}
          </span>
        )}
      </div>
      {children({ id: fieldId, describedBy, invalid })}
      {helpText && (
        <p id={helpId} className="text-xs text-slate-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}
