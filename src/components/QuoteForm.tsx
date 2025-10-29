"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Field } from "@/components/Field";
import {
  PROPERTY_TYPES,
  QuoteComputation,
  QuoteFormValues,
  RUSH_OPTIONS,
  RushOption,
  TAX_DEADLINES,
  calculateQuote,
} from "@/lib/quoteMath";
import { QuoteSchema, defaultQuoteValues, quoteSchema } from "@/lib/quoteSchema";
import { formatMoney, formatNumber } from "@/lib/utils";

import { QuoteDocument } from "./QuoteDocument";

const RUSH_OPTION_LABELS: Record<RushOption, string> = {
  no_rush: "Standard turnaround",
  rush: "Rush delivery (+$1,500)",
};

const FIELD_META: Record<keyof QuoteSchema, { label: string; hint?: string; helpText?: string }> = {
  prospectName: { label: "Prospect name", hint: "Who will receive this quote?" },
  propertyAddress: { label: "Property address", hint: "Street, city, state" },
  zipCode: { label: "ZIP code", hint: "5-digit ZIP for the property" },
  taxYear: { label: "Tax year" },
  taxDeadline: { label: "Tax deadline" },
  purchasePrice: { label: "Purchase price", hint: "Total acquisition cost" },
  hasCapitalImprovements: {
    label: "Capital improvements completed?",
    helpText: "Select Yes if improvements are already in service.",
  },
  capitalImprovementsAmount: { label: "Capital improvements amount" },
  landValuePercent: { label: "Land value %" },
  is1031Exchange: {
    label: "1031 exchange?",
    helpText: "Choose Yes if prior depreciation carries over.",
  },
  accumulated1031Depreciation: { label: "Accumulated 1031 depreciation" },
  sqftBuilding: { label: "Building square footage" },
  acresLand: { label: "Land acreage" },
  propertyType: { label: "Property type" },
  numberOfFloors: { label: "Number of floors" },
  multipleProperties: { label: "# of properties", hint: "Locations included in this scope" },
  needRush: { label: "Delivery speed" },
  yearBuilt: { label: "Year built" },
  priceOverride: {
    label: "Price override?",
    helpText: "Overrides replace the calculated final bid.",
  },
  overrideAmount: { label: "Override amount" },
};

const baseInputClass =
  "w-full rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

const currencyInputClass = `${baseInputClass} pl-10`;
const percentageInputClass = `${baseInputClass} pl-10`;
const selectInputClass = `${baseInputClass} pr-10`;

export function QuoteForm() {
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [lastValidValues, setLastValidValues] = useState<QuoteFormValues>(defaultQuoteValues);
  const [lastValidResults, setLastValidResults] = useState<QuoteComputation>(
    calculateQuote(defaultQuoteValues),
  );
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteSchema>({
    resolver: zodResolver(quoteSchema),
    defaultValues: defaultQuoteValues,
    mode: "onBlur",
  });

  const watchedValues = useWatch({ control });
  const rawValues = (watchedValues ?? defaultQuoteValues) as QuoteSchema;

  useEffect(() => {
    const parse = quoteSchema.safeParse(watchedValues);
    if (!parse.success) {
      return;
    }

    setLastValidValues(parse.data);
    setLastValidResults(calculateQuote(parse.data));

    if (typeof window !== "undefined") {
      window.localStorage.setItem("quoteFormDraft", JSON.stringify(parse.data));
    }
  }, [watchedValues]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedDraft = window.localStorage.getItem("quoteFormDraft");
    if (!storedDraft) {
      return;
    }

    try {
      const parsed = JSON.parse(storedDraft) as QuoteSchema;
      reset(parsed, { keepDefaultValues: false });
    } catch (error) {
      console.error("Unable to restore saved quote", error);
      window.localStorage.removeItem("quoteFormDraft");
    }
  }, [reset]);

  const handleSaveDraft = () => {
    if (typeof window === "undefined") {
      return;
    }

    setIsSavingDraft(true);
    window.localStorage.setItem("quoteFormDraft", JSON.stringify(lastValidValues));
    window.setTimeout(() => setIsSavingDraft(false), 1500);
  };

  const onSubmit = async (data: QuoteSchema) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("quoteFormDraft", JSON.stringify(data));
    }

    const results = calculateQuote(data);
    setLastValidValues(data);
    setLastValidResults(results);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    if (!pdfRef.current) {
      return;
    }

    try {
      const html2pdf = await loadHtml2Pdf();
      if (!html2pdf) {
        throw new Error("html2pdf.js is not available");
      }

      const filename = `Quote_${(data.prospectName || "Client").replace(/\s+/g, "_")}.pdf`;

      await html2pdf()
        .set({
          margin: 12,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        })
        .from(pdfRef.current)
        .save();
    } catch (error) {
      console.error("Failed to export quote PDF", error);
    }
  };

  const hasCapitalImprovements = Boolean(rawValues?.hasCapitalImprovements);
  const is1031Exchange = Boolean(rawValues?.is1031Exchange);
  const priceOverride = Boolean(rawValues?.priceOverride);

  return (
    <div className="space-y-10 text-slate-100">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 px-8 py-10 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.75)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              RCG Quote Configurator
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Build a complete cost seg quote</h1>
            <p className="max-w-2xl text-sm text-slate-400">
              Capture the project snapshot, review totals instantly, and export a branded PDF handoff — all on one screen.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            {isSavingDraft ? "Draft saved" : "Save draft"}
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          className="space-y-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-[0_40px_80px_-60px_rgba(0,0,0,0.9)]"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Section title="Client & property" description="Core identifiers and location details for the engagement.">
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldWrapper
                fieldId="prospectName"
                meta={FIELD_META.prospectName}
                error={errors.prospectName?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="text"
                    autoComplete="name"
                    className={baseInputClass}
                    placeholder="Valued Client"
                    {...register("prospectName")}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="propertyAddress"
                meta={FIELD_META.propertyAddress}
                error={errors.propertyAddress?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="text"
                    autoComplete="street-address"
                    className={baseInputClass}
                    placeholder="123 Main St, Anytown, ST 12345"
                    {...register("propertyAddress")}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper fieldId="zipCode" meta={FIELD_META.zipCode} error={errors.zipCode?.message} required>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    inputMode="numeric"
                    maxLength={5}
                    className={baseInputClass}
                    placeholder="12345"
                    {...register("zipCode")}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper fieldId="taxYear" meta={FIELD_META.taxYear} error={errors.taxYear?.message} required>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="number"
                    className={baseInputClass}
                    {...register("taxYear", { valueAsNumber: true })}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="taxDeadline"
                meta={FIELD_META.taxDeadline}
                error={errors.taxDeadline?.message}
                required
                className="sm:col-span-2"
              >
                {({ id, describedBy, invalid }) => (
                  <select
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className={selectInputClass}
                    {...register("taxDeadline")}
                  >
                    <option value="" disabled>
                      Select deadline
                    </option>
                    {TAX_DEADLINES.map((deadline) => (
                      <option key={deadline} value={deadline}>
                        {deadline}
                      </option>
                    ))}
                  </select>
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="propertyType"
                meta={FIELD_META.propertyType}
                error={errors.propertyType?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <select
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className={selectInputClass}
                    {...register("propertyType")}
                  >
                    <option value="" disabled>
                      Select property type
                    </option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="yearBuilt"
                meta={FIELD_META.yearBuilt}
                error={errors.yearBuilt?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="number"
                    className={baseInputClass}
                    {...register("yearBuilt", { valueAsNumber: true })}
                  />
                )}
              </FieldWrapper>
            </div>
          </Section>

          <Section title="Financial snapshot" description="Purchase allocations, improvements, and overrides.">
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldWrapper
                fieldId="purchasePrice"
                meta={FIELD_META.purchasePrice}
                error={errors.purchasePrice?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-400">$
                    </span>
                    <input
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      type="number"
                      min={0}
                      className={currencyInputClass}
                      {...register("purchasePrice", { valueAsNumber: true })}
                    />
                  </div>
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="landValuePercent"
                meta={FIELD_META.landValuePercent}
                error={errors.landValuePercent?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-400">
                      %
                    </span>
                    <input
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      type="number"
                      step="0.01"
                      className={percentageInputClass}
                      {...register("landValuePercent", { valueAsNumber: true })}
                    />
                  </div>
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="hasCapitalImprovements"
                meta={FIELD_META.hasCapitalImprovements}
                error={errors.hasCapitalImprovements?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <Controller
                    control={control}
                    name="hasCapitalImprovements"
                    render={({ field }) => (
                      <ToggleChips
                        id={id}
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: true, label: "Yes" },
                          { value: false, label: "No" },
                        ]}
                        describedBy={describedBy}
                        invalid={invalid}
                      />
                    )}
                  />
                )}
              </FieldWrapper>

              {hasCapitalImprovements && (
                <FieldWrapper
                  fieldId="capitalImprovementsAmount"
                  meta={FIELD_META.capitalImprovementsAmount}
                  error={errors.capitalImprovementsAmount?.message}
                  required
                >
                  {({ id, describedBy, invalid }) => (
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-400">
                        $
                      </span>
                      <input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        type="number"
                        min={0}
                        className={currencyInputClass}
                        {...register("capitalImprovementsAmount", { valueAsNumber: true })}
                      />
                    </div>
                  )}
                </FieldWrapper>
              )}

              <FieldWrapper
                fieldId="priceOverride"
                meta={FIELD_META.priceOverride}
                error={errors.priceOverride?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <Controller
                    control={control}
                    name="priceOverride"
                    render={({ field }) => (
                      <ToggleChips
                        id={id}
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: true, label: "Yes" },
                          { value: false, label: "No" },
                        ]}
                        describedBy={describedBy}
                        invalid={invalid}
                      />
                    )}
                  />
                )}
              </FieldWrapper>

              {priceOverride && (
                <FieldWrapper
                  fieldId="overrideAmount"
                  meta={FIELD_META.overrideAmount}
                  error={errors.overrideAmount?.message}
                  required
                >
                  {({ id, describedBy, invalid }) => (
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-400">
                        $
                      </span>
                      <input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        type="number"
                        min={0}
                        className={currencyInputClass}
                        {...register("overrideAmount", { valueAsNumber: true })}
                      />
                    </div>
                  )}
                </FieldWrapper>
              )}
            </div>
          </Section>

          <Section title="Property metrics" description="Size, floors, and multi-property scope.">
            <div className="grid gap-6 sm:grid-cols-3">
              <FieldWrapper
                fieldId="sqftBuilding"
                meta={FIELD_META.sqftBuilding}
                error={errors.sqftBuilding?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="number"
                    className={baseInputClass}
                    {...register("sqftBuilding", { valueAsNumber: true })}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper fieldId="acresLand" meta={FIELD_META.acresLand} error={errors.acresLand?.message} required>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="number"
                    step="0.01"
                    className={baseInputClass}
                    {...register("acresLand", { valueAsNumber: true })}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="numberOfFloors"
                meta={FIELD_META.numberOfFloors}
                error={errors.numberOfFloors?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="number"
                    className={baseInputClass}
                    {...register("numberOfFloors", { valueAsNumber: true })}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="multipleProperties"
                meta={FIELD_META.multipleProperties}
                error={errors.multipleProperties?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="number"
                    className={baseInputClass}
                    {...register("multipleProperties", { valueAsNumber: true })}
                  />
                )}
              </FieldWrapper>
            </div>
          </Section>

          <Section title="Context & delivery" description="Timing preferences and 1031 considerations.">
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldWrapper
                fieldId="needRush"
                meta={FIELD_META.needRush}
                error={errors.needRush?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <Controller
                    control={control}
                    name="needRush"
                    render={({ field }) => (
                      <ToggleChips
                        id={id}
                        value={field.value}
                        onChange={field.onChange}
                        options={RUSH_OPTIONS.map((option) => ({
                          value: option,
                          label: RUSH_OPTION_LABELS[option as RushOption],
                        }))}
                        describedBy={describedBy}
                        invalid={invalid}
                      />
                    )}
                  />
                )}
              </FieldWrapper>

              <FieldWrapper
                fieldId="is1031Exchange"
                meta={FIELD_META.is1031Exchange}
                error={errors.is1031Exchange?.message}
                required
              >
                {({ id, describedBy, invalid }) => (
                  <Controller
                    control={control}
                    name="is1031Exchange"
                    render={({ field }) => (
                      <ToggleChips
                        id={id}
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: true, label: "Yes" },
                          { value: false, label: "No" },
                        ]}
                        describedBy={describedBy}
                        invalid={invalid}
                      />
                    )}
                  />
                )}
              </FieldWrapper>

              {is1031Exchange && (
                <FieldWrapper
                  fieldId="accumulated1031Depreciation"
                  meta={FIELD_META.accumulated1031Depreciation}
                  error={errors.accumulated1031Depreciation?.message}
                  required
                  className="sm:col-span-2"
                >
                  {({ id, describedBy, invalid }) => (
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-400">
                        $
                      </span>
                      <input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        type="number"
                        min={0}
                        className={currencyInputClass}
                        {...register("accumulated1031Depreciation", { valueAsNumber: true })}
                      />
                    </div>
                  )}
                </FieldWrapper>
              )}
            </div>
          </Section>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Exporting your quote captures the latest values, including overrides and rush fees.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-400/25 transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Preparing PDF…" : "Get quote (PDF)"}
            </button>
          </div>
        </form>

        <aside className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_30px_60px_-45px_rgba(0,0,0,0.9)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Live summary</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Your quote</h2>
            <p className="mt-1 text-sm text-slate-400">Updates instantly as you adjust inputs.</p>
          </div>

          <SummaryRow label="Final bid" value={lastValidResults.finalBid} emphasis />
          {lastValidValues.priceOverride && lastValidValues.overrideAmount ? (
            <SummaryRow label="Override applied" value={lastValidValues.overrideAmount} subtle />
          ) : (
            <SummaryRow label="Base cost seg bid" value={lastValidResults.baseCostSegBid} />
          )}
          <SummaryRow label="Multiple properties quote" value={lastValidResults.multiplePropertiesQuote} />
          <SummaryRow label="Cost method floor" value={lastValidResults.costMethodQuote} />
          {lastValidResults.rushFee > 0 && <SummaryRow label="Rush fee" value={lastValidResults.rushFee} subtle />}

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          <div className="space-y-3 text-sm text-slate-300">
            <InfoLine label="Property" value={lastValidValues.propertyAddress || "—"} />
            <InfoLine label="Type" value={lastValidValues.propertyType} />
            <InfoLine label="Floors" value={String(lastValidValues.numberOfFloors)} />
            <InfoLine label="SqFt" value={`${formatNumber(lastValidValues.sqftBuilding)} sqft`} />
            <InfoLine label="Acreage" value={`${lastValidValues.acresLand.toFixed(2)} acres`} />
            <InfoLine label="Land allocation" value={`${lastValidValues.landValuePercent.toFixed(2)}%`} />
            <InfoLine label="Properties" value={String(lastValidValues.multipleProperties)} />
            <InfoLine label="Rush" value={lastValidValues.needRush === "rush" ? "Yes" : "No"} />
          </div>
        </aside>
      </div>

      <div ref={pdfRef} className="pointer-events-none absolute -left-[9999px] top-0">
        <QuoteDocument values={lastValidValues} results={lastValidResults} />
      </div>
    </div>
  );
}

interface FieldWrapperProps {
  fieldId: keyof QuoteSchema;
  meta: { label: string; hint?: string; helpText?: string };
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

function FieldWrapper({ fieldId, meta, error, required, className, children }: FieldWrapperProps) {
  return (
    <Field
      fieldId={fieldId}
      label={meta.label}
      hint={meta.hint}
      helpText={meta.helpText}
      error={error}
      required={required}
      className={className}
    >
      {children}
    </Field>
  );
}

interface SectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

interface ToggleOption<T> {
  value: T;
  label: string;
}

interface ToggleChipsProps<T> {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
  describedBy?: string;
  invalid?: boolean;
}

function ToggleChips<T extends string | number | boolean>({
  id,
  value,
  onChange,
  options,
  describedBy,
  invalid,
}: ToggleChipsProps<T>) {
  return (
    <div
      id={`${id}-group`}
      role="radiogroup"
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        const inputId = index === 0 ? id : `${id}-${index}`;
        return (
          <label
            key={String(option.value)}
            role="radio"
            aria-checked={isActive}
            className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-300/80 ${
              isActive
                ? "border-emerald-400 bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                : "border-slate-700/70 bg-slate-900 text-slate-300 hover:border-emerald-300/60 hover:text-emerald-100"
            }`}
          >
            <input
              type="radio"
              name={id}
              value={String(option.value)}
              checked={isActive}
              onChange={() => onChange(option.value)}
              id={inputId}
              className="sr-only"
            />
            <span className="w-full text-center">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
  subtle,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
        emphasis
          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100"
          : subtle
            ? "border-slate-800 bg-slate-900 text-slate-300"
            : "border-slate-800/80 bg-slate-900/60 text-slate-200"
      }`}
    >
      <span>{label}</span>
      <span className="font-semibold">{formatMoney(value)}</span>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}

interface Html2PdfInstance {
  set: (options: Record<string, unknown>) => Html2PdfInstance;
  from: (element: HTMLElement) => Html2PdfInstance;
  save: () => Promise<void> | void;
}

type Html2PdfFactory = () => Html2PdfInstance;

async function loadHtml2Pdf(): Promise<Html2PdfFactory | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const globalWindow = window as typeof window & { html2pdf?: Html2PdfFactory };
  if (globalWindow.html2pdf) {
    return globalWindow.html2pdf;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load html2pdf.js"));
    document.body.appendChild(script);
  });

  return globalWindow.html2pdf ?? null;
}
