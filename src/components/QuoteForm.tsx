"use client";

import { useEffect } from "react";
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
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-rcg-navy via-rcg-blue to-sky-400 px-8 py-10 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/80">RCGV Quote & Estimate</p>
            <h1 className="mt-2 text-3xl font-semibold">Cost Segregation Builder</h1>
            <p className="mt-4 max-w-xl text-sm text-white/80">
              Match the inputs from the OpenAsApp experience to generate pricing, payment options, and bonus depreciation values in seconds.
            </p>
          </div>
          <div className="hidden shrink-0 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:block">
            Parity Mode
          </div>
        </div>
      </section>

      <section className="space-y-8 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <div className="grid gap-6 lg:grid-cols-2">
          <Field
            label="Name of Prospect"
            fieldId="prospectName"
            required
            error={errors.prospectName?.message}
          >
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="text"
                placeholder="Valued Client"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("prospectName")}
              />
            )}
          </Field>

          <Field
            label="Address of Property"
            fieldId="propertyAddress"
            required
            error={errors.propertyAddress?.message}
          >
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="text"
                placeholder="123 Main St, Yourtown, US 85260"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("propertyAddress")}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Field label="Tax Year" fieldId="taxYear" required error={errors.taxYear?.message}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("taxYear", { valueAsNumber: true })}
              />
            )}
          </Field>

          <Field label="Tax Deadline" fieldId="taxDeadline" required error={errors.taxDeadline?.message}>
            {({ id, describedBy, invalid }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-8 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                  {...register("purchasePrice", { valueAsNumber: true })}
                />
              </div>
            )}
          </Field>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
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
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-8 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                    {...register("capitalImprovementsAmount", { valueAsNumber: true })}
                  />
                </div>
              )}
            </Field>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Field label="Land Value" fieldId="landValuePercent" required error={errors.landValuePercent?.message}>
            {({ id, describedBy, invalid }) => (
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus-within:border-rcg-blue focus-within:ring-2 focus-within:ring-rcg-blue/30">
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
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-8 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                    {...register("accumulated1031Depreciation", { valueAsNumber: true })}
                  />
                </div>
              )}
            </Field>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Field label="Square Footage" fieldId="sqftBuilding" required error={errors.sqftBuilding?.message}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("acresLand", { valueAsNumber: true })}
              />
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("yearBuilt", { valueAsNumber: true })}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Field label="ZIP Code" fieldId="zipCode" required error={errors.zipCode?.message}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="text"
                inputMode="numeric"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("zipCode")}
              />
            )}
          </Field>

          <Field label="Type of Property" fieldId="propertyType" required error={errors.propertyType?.message}>
            {({ id, describedBy, invalid }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
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

          <Field label="Need a Rush?" fieldId="needRush" required error={errors.needRush?.message}>
            {({ id, describedBy, invalid }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
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

        <div className="grid gap-6 lg:grid-cols-3">
          <Field label="Number of Floors" fieldId="numberOfFloors" required error={errors.numberOfFloors?.message}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min="1"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("numberOfFloors", { valueAsNumber: true })}
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                {...register("multipleProperties", { valueAsNumber: true })}
              />
            )}
          </Field>

          <Field
            label="Price Override"
            fieldId="priceOverride"
            required
            error={errors.priceOverride ? "Select Yes or No" : undefined}
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
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
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
        </div>

        {priceOverride && (
          <Field
            label="Override Amount"
            fieldId="overrideAmount"
            required
            error={errors.overrideAmount?.message}
            helpText="Use sparingly — overrides replace the calculated final bid."
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-8 py-3 text-base shadow-sm outline-none transition focus:border-rcg-blue focus:ring-2 focus:ring-rcg-blue/30"
                  {...register("overrideAmount", { valueAsNumber: true })}
                />
              </div>
            )}
          </Field>
        )}
      </section>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!isDirty || !isValid}
          className="rounded-full bg-rcg-blue px-10 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-rcg-blue/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Get Quote
        </button>
      </div>
    </form>
  );
}
