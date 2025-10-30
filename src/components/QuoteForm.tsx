"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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

type StepId = "client" | "financial" | "metrics" | "context" | "review";

interface StepDefinition {
  id: StepId;
  title: string;
  hint: string;
  render: () => ReactNode;
}

const DESKTOP_BREAKPOINT = 960;

const FIELD_META: Record<keyof QuoteFormValues, { label: string; hint?: string; helpText?: string }> = {
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
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200";
const currencyInputClass = `${baseInputClass} pl-10`;
const percentageInputClass = `${baseInputClass} pl-10`;

const STEP_FIELD_KEYS: Record<Exclude<StepId, "review">, (keyof QuoteFormValues)[]> = {
  client: [
    "prospectName",
    "propertyAddress",
    "zipCode",
    "taxYear",
    "taxDeadline",
    "propertyType",
    "yearBuilt",
  ],
  financial: [
    "purchasePrice",
    "landValuePercent",
    "hasCapitalImprovements",
    "capitalImprovementsAmount",
    "priceOverride",
    "overrideAmount",
  ],
  metrics: [
    "sqftBuilding",
    "acresLand",
    "numberOfFloors",
    "multipleProperties",
  ],
  context: [
    "is1031Exchange",
    "accumulated1031Depreciation",
    "needRush",
  ],
};

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: "client",
    title: "Client & property",
    hint: "Core identifiers and location details for the engagement.",
    render: () => null,
  },
  {
    id: "financial",
    title: "Financial snapshot",
    hint: "Purchase allocations, improvements, and overrides.",
    render: () => null,
  },
  {
    id: "metrics",
    title: "Property metrics",
    hint: "Size, floors, and multi-property scope.",
    render: () => null,
  },
  {
    id: "context",
    title: "Context & delivery",
    hint: "Exchange history, rush needs, and delivery expectations.",
    render: () => null,
  },
  {
    id: "review",
    title: "Review & submit",
    hint: "Receipt-style summary before exporting the PDF.",
    render: () => null,
  },
];

export function QuoteForm() {
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [lastValidValues, setLastValidValues] = useState<QuoteFormValues>(defaultQuoteValues);
  const [lastValidResults, setLastValidResults] = useState<QuoteComputation>(() =>
    calculateQuote(defaultQuoteValues),
  );
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<QuoteSchema>({
    resolver: zodResolver(quoteSchema),
    defaultValues: defaultQuoteValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const watchedValues = useWatch({ control });
  const rawValues = (watchedValues ?? defaultQuoteValues) as QuoteFormValues;

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
      const parsed = JSON.parse(storedDraft) as QuoteFormValues;
      reset(parsed, { keepDefaultValues: false });
    } catch (error) {
      console.error("Unable to restore saved quote", error);
      window.localStorage.removeItem("quoteFormDraft");
    }
  }, [reset]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const totalSteps = STEP_DEFINITIONS.length;

  useEffect(() => {
    if (currentStep === totalSteps) {
      setIsCurrentStepValid(true);
      return;
    }

    let active = true;
    const validate = async () => {
      const fields = visibleFieldsForStep(stepIdFromIndex(currentStep - 1), rawValues);
      if (!fields.length) {
        if (active) {
          setIsCurrentStepValid(true);
        }
        return;
      }
      const result = await trigger(fields as (keyof QuoteFormValues)[], { shouldFocus: false });
      if (active) {
        setIsCurrentStepValid(result);
      }
    };
    void validate();

    return () => {
      active = false;
    };
  }, [currentStep, rawValues, totalSteps, trigger]);

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

  const stepCards = useMemo<StepDefinition[]>(() => {
    return STEP_DEFINITIONS.map((definition) => ({
      ...definition,
      render: () => {
        switch (definition.id) {
          case "client":
            return (
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
                    <Controller
                      control={control}
                      name="taxDeadline"
                      render={({ field }) => (
                        <ChipGroup
                          id={id}
                          value={field.value}
                          onChange={field.onChange}
                          options={TAX_DEADLINES.map((deadline) => ({ value: deadline, label: deadline }))}
                          describedBy={describedBy}
                          invalid={invalid}
                        />
                      )}
                    />
                  )}
                </FieldWrapper>

                <FieldWrapper
                  fieldId="propertyType"
                  meta={FIELD_META.propertyType}
                  error={errors.propertyType?.message}
                  required
                  className="sm:col-span-2"
                >
                  {({ id, describedBy, invalid }) => (
                    <Controller
                      control={control}
                      name="propertyType"
                      render={({ field }) => (
                        <ChipGroup
                          id={id}
                          value={field.value}
                          onChange={field.onChange}
                          options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
                          describedBy={describedBy}
                          invalid={invalid}
                        />
                      )}
                    />
                  )}
                </FieldWrapper>

                <FieldWrapper fieldId="yearBuilt" meta={FIELD_META.yearBuilt} error={errors.yearBuilt?.message} required>
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
            );
          case "financial":
            return (
              <div className="grid gap-6 sm:grid-cols-2">
                <FieldWrapper
                  fieldId="purchasePrice"
                  meta={FIELD_META.purchasePrice}
                  error={errors.purchasePrice?.message}
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
                        <ChipGroup
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

                {rawValues.hasCapitalImprovements && (
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
                        <ChipGroup
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

                {rawValues.priceOverride && (
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
            );
          case "metrics":
            return (
              <div className="grid gap-6 sm:grid-cols-2">
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
            );
          case "context":
            return (
              <div className="grid gap-6 sm:grid-cols-2">
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
                        <ChipGroup
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

                {rawValues.is1031Exchange && (
                  <FieldWrapper
                    fieldId="accumulated1031Depreciation"
                    meta={FIELD_META.accumulated1031Depreciation}
                    error={errors.accumulated1031Depreciation?.message}
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
                          {...register("accumulated1031Depreciation", { valueAsNumber: true })}
                        />
                      </div>
                    )}
                  </FieldWrapper>
                )}

                <FieldWrapper
                  fieldId="needRush"
                  meta={FIELD_META.needRush}
                  error={errors.needRush?.message}
                  required
                  className="sm:col-span-2"
                >
                  {({ id, describedBy, invalid }) => (
                    <Controller
                      control={control}
                      name="needRush"
                      render={({ field }) => (
                        <ChipGroup
                          id={id}
                          value={field.value}
                          onChange={field.onChange}
                          options={RUSH_OPTIONS.map((option) => ({ value: option, label: rushLabel(option) }))}
                          describedBy={describedBy}
                          invalid={invalid}
                        />
                      )}
                    />
                  )}
                </FieldWrapper>
              </div>
            );
          case "review":
            return (
              <ReviewSection
                values={lastValidValues}
                results={lastValidResults}
                onEditStep={(stepId) => {
                  const index = STEP_DEFINITIONS.findIndex((definition) => definition.id === stepId);
                  if (index >= 0) {
                    setCurrentStep(index + 1);
                  }
                }}
              />
            );
          default:
            return null;
        }
      },
    }));
  }, [control, errors, lastValidResults, lastValidValues, rawValues, register]);

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      await handleSubmit(onSubmit)();
      return;
    }

    const valid = await trigger(
      visibleFieldsForStep(stepIdFromIndex(currentStep - 1), rawValues) as (keyof QuoteFormValues)[],
      { shouldFocus: true },
    );

    if (!valid) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  return (
    <div className="relative space-y-8 text-slate-900">
      <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500/80">RCG Quote Configurator</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Configure your cost seg quote</h1>
            <p className="max-w-2xl text-sm text-slate-500">
              Step through the engagement snapshot, review live pricing, and export a polished PDF handoff without leaving the page.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
          >
            {isSavingDraft ? "Draft saved" : "Save & Resume"}
          </button>
        </div>
        <div className="mt-8 flex items-center justify-between gap-3 text-sm font-semibold text-slate-600">
          <span>Step {currentStep}</span>
          <div className="h-2 flex-1 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <span>of {totalSteps}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {stepCards.map((definition, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const hidden = isMobile ? !isActive : stepNumber !== currentStep;
            return (
              <StepCard
                key={definition.id}
                title={definition.title}
                hint={definition.hint}
                step={stepNumber}
                totalSteps={totalSteps}
                hidden={hidden}
                ariaHidden={!isActive}
              >
                {definition.render()}
              </StepCard>
            );
          })}
        </form>

        <aside
          className="hidden h-max space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-4 lg:block"
          aria-label="Quote summary"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500/80">Live summary</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Your quote</h2>
            <p className="mt-1 text-sm text-slate-500">Updates instantly as you adjust inputs.</p>
          </div>

          <SummaryBreakdown values={lastValidValues} results={lastValidResults} />
        </aside>
      </div>

      <footer className="sticky bottom-20 z-10 flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur lg:static lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentStep === 1 || isSubmitting}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          className="hidden rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600 lg:inline-flex"
        >
          Save & Resume
        </button>
        <button
          type={currentStep === totalSteps ? "submit" : "button"}
          onClick={currentStep === totalSteps ? undefined : handleNext}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || (currentStep !== totalSteps && !isCurrentStepValid)}
        >
          {currentStep === totalSteps ? (isSubmitting ? "Exporting…" : "Get final quote") : "Next"}
        </button>
      </footer>

      <MobileTotalDrawer total={lastValidResults.finalBid} />

      <div ref={pdfRef} className="pointer-events-none absolute -left-[9999px] top-0">
        <QuoteDocument values={lastValidValues} results={lastValidResults} />
      </div>
    </div>
  );
}

function stepIdFromIndex(index: number): StepId {
  return STEP_DEFINITIONS[index]?.id ?? "client";
}

function visibleFieldsForStep(step: StepId, values: QuoteFormValues): (keyof QuoteFormValues)[] {
  if (step === "review") {
    return [];
  }

  const base = STEP_FIELD_KEYS[step] ?? [];
  return base.filter((field) => {
    if (field === "capitalImprovementsAmount") {
      return values.hasCapitalImprovements;
    }
    if (field === "overrideAmount") {
      return values.priceOverride;
    }
    if (field === "accumulated1031Depreciation") {
      return values.is1031Exchange;
    }
    return true;
  });
}


interface FieldWrapperProps {
  fieldId: keyof QuoteFormValues;
  meta: { label: string; hint?: string; helpText?: string };
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
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

interface StepCardProps {
  title: string;
  hint: string;
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  hidden: boolean;
  ariaHidden: boolean;
}

function StepCard({ title, hint, children, step, totalSteps, hidden, ariaHidden }: StepCardProps) {
  return (
    <section
      className={`flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-transform ${
        hidden ? "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100" : "opacity-100"
      }`}
      aria-hidden={ariaHidden}
      data-step={step}
      hidden={hidden}
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500/80">Step {step} of {totalSteps}</p>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{hint}</p>
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

interface ChipOption<T> {
  value: T;
  label: string;
}

interface ChipGroupProps<T> {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: ChipOption<T>[];
  describedBy?: string;
  invalid?: boolean;
}

function ChipGroup<T extends string | number | boolean>({
  id,
  value,
  onChange,
  options,
  describedBy,
  invalid,
}: ChipGroupProps<T>) {
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
            className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-300 ${
              isActive
                ? "border-sky-400 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-600"
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

interface SummaryBreakdownProps {
  values: QuoteFormValues;
  results: QuoteComputation;
}

function SummaryBreakdown({ values, results }: SummaryBreakdownProps) {
  return (
    <div className="space-y-5">
      <SummaryRow label="Final bid" value={results.finalBid} emphasis />
      {values.priceOverride && values.overrideAmount ? (
        <SummaryRow label="Override applied" value={values.overrideAmount} subtle />
      ) : (
        <SummaryRow label="Base cost seg bid" value={results.baseCostSegBid} />
      )}
      <SummaryRow label="Multiple properties quote" value={results.multiplePropertiesQuote} />
      <SummaryRow label="Cost method floor" value={results.costMethodQuote} />
      {results.rushFee > 0 && <SummaryRow label="Rush fee" value={results.rushFee} subtle />}

      <div className="h-px bg-slate-200" />

      <div className="space-y-2 text-sm text-slate-600">
        <InfoLine label="Property" value={values.propertyAddress || "—"} />
        <InfoLine label="Type" value={values.propertyType} />
        <InfoLine label="Floors" value={String(values.numberOfFloors)} />
        <InfoLine label="SqFt" value={`${formatNumber(values.sqftBuilding)} sqft`} />
        <InfoLine label="Acreage" value={`${values.acresLand.toFixed(2)} acres`} />
        <InfoLine label="Land allocation" value={`${values.landValuePercent.toFixed(2)}%`} />
        <InfoLine label="Properties" value={String(values.multipleProperties)} />
        <InfoLine label="Rush" value={values.needRush === "rush" ? "Yes" : "No"} />
      </div>
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
  const [delta, setDelta] = useState<number | null>(null);
  const previousRef = useRef(value);

  useEffect(() => {
    if (value !== previousRef.current) {
      setDelta(value - previousRef.current);
      previousRef.current = value;
      const timeout = window.setTimeout(() => setDelta(null), 1200);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [value]);

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
        emphasis
          ? "border-sky-400/70 bg-sky-50 text-sky-700"
          : subtle
            ? "border-slate-200 bg-slate-50 text-slate-600"
            : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <span>{label}</span>
      <span className="flex items-baseline gap-2 font-semibold">
        {formatMoney(value)}
        {delta !== null && delta !== 0 && (
          <span className={`text-xs font-medium ${delta > 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {`${delta > 0 ? "+" : "-"}${formatMoney(Math.abs(delta))}`}
          </span>
        )}
      </span>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function rushLabel(option: RushOption) {
  return option === "rush" ? "Rush delivery" : "Standard turnaround";
}

interface ReviewSectionProps {
  values: QuoteFormValues;
  results: QuoteComputation;
  onEditStep: (stepId: StepId) => void;
}

function ReviewSection({ values, results, onEditStep }: ReviewSectionProps) {
  const reviewRows: Array<{ label: string; value: string; step: StepId }> = [
    { label: FIELD_META.prospectName.label, value: values.prospectName, step: "client" },
    { label: FIELD_META.propertyAddress.label, value: values.propertyAddress, step: "client" },
    { label: FIELD_META.zipCode.label, value: values.zipCode, step: "client" },
    { label: FIELD_META.taxDeadline.label, value: values.taxDeadline, step: "client" },
    { label: FIELD_META.propertyType.label, value: values.propertyType, step: "client" },
    { label: FIELD_META.purchasePrice.label, value: formatMoney(values.purchasePrice), step: "financial" },
    {
      label: FIELD_META.capitalImprovementsAmount.label,
      value: values.hasCapitalImprovements ? formatMoney(values.capitalImprovementsAmount) : "No",
      step: "financial",
    },
    {
      label: FIELD_META.overrideAmount.label,
      value: values.priceOverride && values.overrideAmount ? formatMoney(values.overrideAmount) : "Not applied",
      step: "financial",
    },
    { label: FIELD_META.sqftBuilding.label, value: formatNumber(values.sqftBuilding), step: "metrics" },
    { label: FIELD_META.multipleProperties.label, value: String(values.multipleProperties), step: "metrics" },
    { label: FIELD_META.needRush.label, value: rushLabel(values.needRush), step: "context" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Totals</h3>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{formatMoney(results.finalBid)}</p>
        <p className="mt-1 text-sm text-slate-600">Final bid reflects overrides, multipliers, and rush fees.</p>
      </div>

      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {reviewRows.map((row) => (
          <button
            key={`${row.label}-${row.step}`}
            type="button"
            onClick={() => onEditStep(row.step)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <span className="font-semibold text-slate-700">{row.label}</span>
            <span className="text-slate-500">{row.value}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">Need an adjustment? Tap a row to jump back to that step.</p>
    </div>
  );
}

function MobileTotalDrawer({ total }: { total: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-5 py-4 text-sm font-semibold text-slate-700 shadow-[0_-12px_24px_rgba(15,20,40,0.08)] backdrop-blur lg:hidden">
      <span>Estimated total</span>
      <span className="text-lg text-slate-900">{formatMoney(total)}</span>
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
