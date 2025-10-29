"use client";

import { ReactNode, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Field } from "@/components/Field";
import {
  PROPERTY_TYPES,
  RUSH_OPTIONS,
  TAX_DEADLINES,
  RushOption,
} from "@/lib/quoteMath";
import { QuoteSchema, defaultQuoteValues, quoteSchema } from "@/lib/quoteSchema";

const RUSH_OPTION_LABELS: Record<RushOption, string> = {
  no_rush: "No Rush (standard turnaround)",
  rush: "Rush (+$1,500 fee)",
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/20 focus:outline-none";
const selectClassName = `${inputClassName} appearance-none pr-10`;
const currencyInputClassName = `${inputClassName} pl-10`;

export function QuoteForm() {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<QuoteSchema>({
    resolver: zodResolver(quoteSchema),
    mode: "onChange",
    defaultValues: defaultQuoteValues,
  });

  const hasCapitalImprovements = watch("hasCapitalImprovements");
  const is1031Exchange = watch("is1031Exchange");
  const priceOverride = watch("priceOverride");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.sessionStorage.getItem("quoteFormData") : null;
    if (!stored) {
      return;
    }

    try {
      const parsed: QuoteSchema = JSON.parse(stored);
      reset(parsed, { keepDirty: true, keepTouched: true });
    } catch {
      window.sessionStorage.removeItem("quoteFormData");
    }
  }, [reset]);

  const onSubmit = (data: QuoteSchema) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("quoteFormData", JSON.stringify(data));
    }
    router.push("/quote/preview");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-10">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-rcg-navy via-rcg-blue to-sky-400 px-8 py-10 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white">🏢</span>
              RCGV Quote & Estimate
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Cost Segregation Builder</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Enter the same fields from the OpenAsApp experience to generate pricing, payment options, and bonus depreciation values instantly.
              </p>
            </div>
          </div>
          <div className="self-end rounded-2xl bg-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white/80">
            Preview ready in seconds
          </div>
        </div>
      </header>

      <section className="space-y-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <FormSection title="Prospect Information" description="Client and property owner details">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Name of Prospect" fieldId="prospectName" required error={errors.prospectName?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="text"
                  placeholder="Valued Client"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("prospectName")}
                />
              )}
            </Field>

            <Field label="Address of Property" fieldId="propertyAddress" required error={errors.propertyAddress?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="text"
                  placeholder="123 Main St, Yourtown, US 85260"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("propertyAddress")}
                />
              )}
            </Field>

            <Field label="ZIP Code" fieldId="zipCode" required error={errors.zipCode?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("zipCode")}
                />
              )}
            </Field>

            <Field label="Tax Deadline" fieldId="taxDeadline" required error={errors.taxDeadline?.message}>
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={selectClassName}
                  {...register("taxDeadline")}
                >
                  {TAX_DEADLINES.map((deadline) => (
                    <option key={deadline} value={deadline}>
                      {deadline}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </FormSection>

        <FormSection title="Financial Information" description="Purchase details and pricing context">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Purchase Price" fieldId="purchasePrice" required error={errors.purchasePrice?.message}>
              {({ id, describedBy, invalid }) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className={currencyInputClassName}
                    {...register("purchasePrice", { valueAsNumber: true })}
                  />
                </div>
              )}
            </Field>

            <Field label="Tax Year" fieldId="taxYear" required error={errors.taxYear?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("taxYear", { valueAsNumber: true })}
                />
              )}
            </Field>

            <Field
              label="Capital Improvements"
              fieldId="hasCapitalImprovements"
              required
              error={errors.hasCapitalImprovements ? "Select Yes or No" : undefined}
              helpText="Include only completed improvements."
            >
              {({ id, describedBy, invalid }) => (
                <Controller
                  control={control}
                  name="hasCapitalImprovements"
                  render={({ field }) => (
                    <select
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      className={selectClassName}
                      value={field.value ? "yes" : "no"}
                      onChange={(event) => field.onChange(event.target.value === "yes")}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  )}
                />
              )}
            </Field>

            {hasCapitalImprovements && (
              <Field
                label="Capital Improvements Amount"
                fieldId="capitalImprovementsAmount"
                required
                error={errors.capitalImprovementsAmount?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      id={id}
                      type="number"
                      step="0.01"
                      min="0"
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      className={currencyInputClassName}
                      {...register("capitalImprovementsAmount", { valueAsNumber: true })}
                    />
                  </div>
                )}
              </Field>
            )}

            <Field label="Land Value" fieldId="landValuePercent" required error={errors.landValuePercent?.message}>
              {({ id, describedBy, invalid }) => (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-rcg-blue focus-within:ring-2 focus-within:ring-rcg-blue/20">
                  <input
                    id={id}
                    type="number"
                    step="0.01"
                    min="0"
                    max="80"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className="w-full border-none bg-transparent text-base outline-none"
                    {...register("landValuePercent", { valueAsNumber: true })}
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              )}
            </Field>

            <Field
              label="Price Override"
              fieldId="priceOverride"
              required
              error={errors.priceOverride ? "Select Yes or No" : undefined}
              helpText="Overrides replace the calculated final bid."
            >
              {({ id, describedBy, invalid }) => (
                <Controller
                  control={control}
                  name="priceOverride"
                  render={({ field }) => (
                    <select
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      className={selectClassName}
                      value={field.value ? "yes" : "no"}
                      onChange={(event) => field.onChange(event.target.value === "yes")}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  )}
                />
              )}
            </Field>

            {priceOverride && (
              <Field
                label="Override Amount"
                fieldId="overrideAmount"
                required
                error={errors.overrideAmount?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      id={id}
                      type="number"
                      step="0.01"
                      min="0"
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      className={currencyInputClassName}
                      {...register("overrideAmount", { valueAsNumber: true })}
                    />
                  </div>
                )}
              </Field>
            )}
          </div>
        </FormSection>

        <FormSection title="Property Details" description="Physical characteristics and specifications">
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Type of Property" fieldId="propertyType" required error={errors.propertyType?.message}>
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={selectClassName}
                  {...register("propertyType")}
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Year Built" fieldId="yearBuilt" required error={errors.yearBuilt?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("yearBuilt", { valueAsNumber: true })}
                />
              )}
            </Field>

            <Field label="Number of Floors" fieldId="numberOfFloors" required error={errors.numberOfFloors?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("numberOfFloors", { valueAsNumber: true })}
                />
              )}
            </Field>

            <Field label="SqFt Building" fieldId="sqftBuilding" required error={errors.sqftBuilding?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("sqftBuilding", { valueAsNumber: true })}
                />
              )}
            </Field>

            <Field label="Acres Land" fieldId="acresLand" required error={errors.acresLand?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="number"
                  step="0.01"
                  min="0"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("acresLand", { valueAsNumber: true })}
                />
              )}
            </Field>

            <Field label="Multiple Properties?" fieldId="multipleProperties" required error={errors.multipleProperties?.message}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClassName}
                  {...register("multipleProperties", { valueAsNumber: true })}
                />
              )}
            </Field>
          </div>
        </FormSection>

        <FormSection title="Additional Information" description="Optional details for more accurate quotes">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="1031 Exchange?"
              fieldId="is1031Exchange"
              required
              error={errors.is1031Exchange ? "Select Yes or No" : undefined}
            >
              {({ id, describedBy, invalid }) => (
                <Controller
                  control={control}
                  name="is1031Exchange"
                  render={({ field }) => (
                    <select
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      className={selectClassName}
                      value={field.value ? "yes" : "no"}
                      onChange={(event) => field.onChange(event.target.value === "yes")}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  )}
                />
              )}
            </Field>

            {is1031Exchange && (
              <Field
                label="1031 Accumulated Depreciation"
                fieldId="accumulated1031Depreciation"
                required
                error={errors.accumulated1031Depreciation?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      id={id}
                      type="number"
                      step="0.01"
                      min="0"
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      className={currencyInputClassName}
                      {...register("accumulated1031Depreciation", { valueAsNumber: true })}
                    />
                  </div>
                )}
              </Field>
            )}

            <Field label="Need a Rush?" fieldId="needRush" required error={errors.needRush?.message}>
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={selectClassName}
                  {...register("needRush")}
                >
                  {RUSH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {RUSH_OPTION_LABELS[option]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </FormSection>
      </section>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => reset(defaultQuoteValues)}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Reset form
        </button>
        <button
          type="submit"
          disabled={!isDirty || !isValid}
          className="inline-flex items-center justify-center rounded-full bg-rcg-navy px-10 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rcg-navy/90 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Calculate Quote
        </button>
      </div>
    </form>
  );
}

interface FormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
