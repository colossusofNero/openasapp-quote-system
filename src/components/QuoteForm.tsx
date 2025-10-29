"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
} from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

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
import {
  QuoteSchema,
  defaultQuoteValues,
  quoteSchema,
} from "@/lib/quoteSchema";
import { formatMoney, formatNumber } from "@/lib/utils";

type FieldId = keyof QuoteSchema;

interface StepConfig {
  id: string;
  title: string;
  description: string;
  gridClass: string;
  fields: FieldId[];
}

const RUSH_OPTION_LABELS: Record<RushOption, string> = {
  no_rush: "No rush (standard turnaround)",
  rush: "Rush delivery (+$1,500)",
};

const TAX_DEADLINE_OPTIONS = TAX_DEADLINES;

const DESKTOP_STEPS: StepConfig[] = [
  {
    id: "contact",
    title: "Prospect & property basics",
    description: "Tell us who this quote is for and where the property lives.",
    gridClass: "grid gap-6 md:grid-cols-2",
    fields: ["prospectName", "propertyAddress", "zipCode", "taxYear", "taxDeadline"],
  },
  {
    id: "financial",
    title: "Financial snapshot",
    description: "Capture purchase price, improvements, and overrides.",
    gridClass: "grid gap-6 md:grid-cols-2",
    fields: [
      "purchasePrice",
      "landValuePercent",
      "hasCapitalImprovements",
      "capitalImprovementsAmount",
      "priceOverride",
      "overrideAmount",
    ],
  },
  {
    id: "property",
    title: "Property profile",
    description: "Dimensions, type, and property count drive the bid range.",
    gridClass: "grid gap-6 md:grid-cols-2 xl:grid-cols-3",
    fields: [
      "propertyType",
      "yearBuilt",
      "numberOfFloors",
      "sqftBuilding",
      "acresLand",
      "multipleProperties",
    ],
  },
  {
    id: "context",
    title: "Additional context",
    description: "Let us know about 1031 exchanges and delivery speed.",
    gridClass: "grid gap-6 md:grid-cols-2",
    fields: ["is1031Exchange", "accumulated1031Depreciation", "needRush"],
  },
];

interface FieldMeta {
  label: string;
  placeholder?: string;
  helpText?: string;
  hint?: string;
}

const FIELD_META: Record<FieldId, FieldMeta> = {
  prospectName: {
    label: "Prospect name",
    placeholder: "Valued Client",
  },
  propertyAddress: {
    label: "Property address",
    placeholder: "123 Main St, Yourtown, ST 12345",
  },
  zipCode: {
    label: "ZIP code",
    hint: "Use the five-digit ZIP where the property sits",
  },
  taxYear: {
    label: "Tax year",
    hint: "Calendar year for this quote",
  },
  taxDeadline: {
    label: "Tax deadline",
  },
  purchasePrice: {
    label: "Purchase price",
    hint: "Total acquisition price including land",
  },
  hasCapitalImprovements: {
    label: "Capital improvements completed?",
    helpText: "Select Yes if improvements are already in service.",
  },
  capitalImprovementsAmount: {
    label: "Capital improvements amount",
    hint: "Completed improvements only",
  },
  landValuePercent: {
    label: "Land value %",
    hint: "Portion of purchase allocated to land",
  },
  is1031Exchange: {
    label: "1031 exchange?",
    helpText: "Select Yes if prior depreciation carries forward.",
  },
  accumulated1031Depreciation: {
    label: "Accumulated 1031 depreciation",
  },
  sqftBuilding: {
    label: "SqFt building",
  },
  acresLand: {
    label: "Acres land",
  },
  propertyType: {
    label: "Property type",
  },
  numberOfFloors: {
    label: "Number of floors",
  },
  multipleProperties: {
    label: "# of properties",
    hint: "How many locations share this scope?",
  },
  needRush: {
    label: "Delivery speed",
  },
  yearBuilt: {
    label: "Year built",
  },
  priceOverride: {
    label: "Price override?",
    helpText: "Overrides replace the calculated final bid.",
  },
  overrideAmount: {
    label: "Override amount",
  },
};

interface QuestionDefinition {
  stepId: string;
  fieldId: FieldId;
}

const baseInputClassName =
  "w-full rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";
const selectClassName = `${baseInputClassName} pr-10`;
const currencyInputClassName = `${baseInputClassName} pl-10`;

export function QuoteForm() {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopStepIndex, setDesktopStepIndex] = useState(0);
  const [mobileQuestionIndex, setMobileQuestionIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const {
    control,
    register,
    handleSubmit,
    reset,
    trigger,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<QuoteSchema>({
    resolver: zodResolver(quoteSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: defaultQuoteValues,
  });

  const watchedValues = useWatch({ control }) as QuoteSchema;
  const summaryValues: QuoteFormValues = watchedValues ?? defaultQuoteValues;
  const hasCapitalImprovements = summaryValues.hasCapitalImprovements;
  const is1031Exchange = summaryValues.is1031Exchange;
  const priceOverride = summaryValues.priceOverride;

  const computedResults = useMemo(
    () => calculateQuote(summaryValues),
    [summaryValues],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateMatches = () => setIsDesktop(mediaQuery.matches);
    updateMatches();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMatches);
      return () => mediaQuery.removeEventListener("change", updateMatches);
    }

    mediaQuery.addListener(updateMatches);
    return () => mediaQuery.removeListener(updateMatches);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSession = window.sessionStorage.getItem("quoteFormData");
    const storedDraft = window.localStorage.getItem("quoteFormDraft");
    const candidate = storedSession ?? storedDraft;

    if (!candidate) {
      void trigger();
      return;
    }

    try {
      const parsed = JSON.parse(candidate) as QuoteSchema;
      reset(parsed, { keepDirty: false, keepValues: false });
    } catch (error) {
      console.error("Failed to parse stored quote data", error);
      window.sessionStorage.removeItem("quoteFormData");
      window.localStorage.removeItem("quoteFormDraft");
    } finally {
      void trigger();
    }
  }, [reset, trigger]);

  useEffect(() => {
    if (!hasCapitalImprovements) {
      setValue("capitalImprovementsAmount", 0, { shouldValidate: true, shouldDirty: false });
      clearErrors("capitalImprovementsAmount");
    }
  }, [hasCapitalImprovements, setValue, clearErrors]);

  useEffect(() => {
    if (!is1031Exchange) {
      setValue("accumulated1031Depreciation", 0, { shouldValidate: true, shouldDirty: false });
      clearErrors("accumulated1031Depreciation");
    }
  }, [is1031Exchange, setValue, clearErrors]);

  useEffect(() => {
    if (!priceOverride) {
      setValue("overrideAmount", undefined, { shouldValidate: true, shouldDirty: false });
      clearErrors("overrideAmount");
    }
  }, [priceOverride, setValue, clearErrors]);

  useEffect(() => {
    if (saveStatus !== "saved") {
      return;
    }

    const timeout = window.setTimeout(() => setSaveStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [saveStatus]);

  const visibleSteps = useMemo(
    () =>
      DESKTOP_STEPS.map((step) => ({
        ...step,
        fields: step.fields.filter((fieldId) => {
          if (fieldId === "capitalImprovementsAmount") {
            return hasCapitalImprovements;
          }
          if (fieldId === "accumulated1031Depreciation") {
            return is1031Exchange;
          }
          if (fieldId === "overrideAmount") {
            return priceOverride;
          }
          return true;
        }),
      })),
    [hasCapitalImprovements, is1031Exchange, priceOverride],
  );

  const visibleQuestions = useMemo(() => {
    const questions: QuestionDefinition[] = [];
    for (const step of visibleSteps) {
      for (const fieldId of step.fields) {
        questions.push({ stepId: step.id, fieldId });
      }
    }
    return questions;
  }, [visibleSteps]);

  useEffect(() => {
    if (!isDesktop) {
      setMobileQuestionIndex((index) =>
        Math.min(index, Math.max(visibleQuestions.length - 1, 0)),
      );
      return;
    }

    const currentQuestion = visibleQuestions[mobileQuestionIndex];
    if (!currentQuestion) {
      return;
    }

    const stepIndex = visibleSteps.findIndex((step) => step.id === currentQuestion.stepId);
    if (stepIndex >= 0 && stepIndex !== desktopStepIndex) {
      setDesktopStepIndex(stepIndex);
    }
  }, [isDesktop, visibleQuestions, visibleSteps, mobileQuestionIndex, desktopStepIndex]);

  useEffect(() => {
    if (isDesktop) {
      return;
    }
    const step = visibleSteps[desktopStepIndex];
    if (!step) {
      return;
    }
    const firstQuestionIndex = visibleQuestions.findIndex((question) => question.stepId === step.id);
    if (firstQuestionIndex >= 0 && firstQuestionIndex !== mobileQuestionIndex) {
      setMobileQuestionIndex(firstQuestionIndex);
    }
  }, [isDesktop, visibleSteps, visibleQuestions, desktopStepIndex, mobileQuestionIndex]);

  const currentFields: FieldId[] = useMemo(() => {
    if (isDesktop) {
      return visibleSteps[desktopStepIndex]?.fields ?? [];
    }
    const currentQuestion = visibleQuestions[mobileQuestionIndex];
    return currentQuestion ? [currentQuestion.fieldId] : [];
  }, [isDesktop, visibleSteps, desktopStepIndex, visibleQuestions, mobileQuestionIndex]);

  const hasFieldError = (fieldId: FieldId) => Boolean(errors[fieldId as keyof typeof errors]);
  const isCurrentValid = currentFields.every((fieldId) => !hasFieldError(fieldId));

  const totalUnits = isDesktop ? visibleSteps.length : visibleQuestions.length;
  const activeIndex = isDesktop ? desktopStepIndex : mobileQuestionIndex;
  const progress = totalUnits <= 1 ? 100 : Math.round((activeIndex / (totalUnits - 1)) * 100);

  const currentStep = visibleSteps[desktopStepIndex];
  const currentQuestion = visibleQuestions[mobileQuestionIndex];
  const nextLabel = activeIndex === totalUnits - 1 ? "Review quote" : "Next";

  const onSubmit = (data: QuoteSchema) => {
    if (typeof window !== "undefined") {
      const payload = JSON.stringify(data);
      window.sessionStorage.setItem("quoteFormData", payload);
      window.localStorage.setItem("quoteFormDraft", payload);
    }
    router.push("/quote/preview");
  };

  const handleNext = async () => {
    if (currentFields.length === 0) {
      return;
    }

    const valid = await trigger(currentFields as FieldId[], {
      shouldFocus: true,
    });

    if (!valid) {
      return;
    }

    if (isDesktop) {
      if (desktopStepIndex >= visibleSteps.length - 1) {
        void handleSubmit(onSubmit)();
        return;
      }
      setDesktopStepIndex((index) => Math.min(index + 1, visibleSteps.length - 1));
    } else {
      if (mobileQuestionIndex >= visibleQuestions.length - 1) {
        void handleSubmit(onSubmit)();
        return;
      }
      setMobileQuestionIndex((index) => Math.min(index + 1, visibleQuestions.length - 1));
    }
  };

  const handleBack = () => {
    if (isDesktop) {
      setDesktopStepIndex((index) => Math.max(index - 1, 0));
    } else {
      setMobileQuestionIndex((index) => Math.max(index - 1, 0));
    }
  };

  const handleSaveDraft = () => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = JSON.stringify(summaryValues);
    window.localStorage.setItem("quoteFormDraft", payload);
    window.sessionStorage.setItem("quoteFormData", payload);
    setSaveStatus("saved");
  };

  const handleReset = () => {
    reset(defaultQuoteValues, { keepDirty: false, keepValues: false });
    setDesktopStepIndex(0);
    setMobileQuestionIndex(0);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("quoteFormData");
      window.localStorage.removeItem("quoteFormDraft");
    }
    void trigger();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative flex flex-col gap-10 pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 lg:pb-0"
    >
      <div className="space-y-8">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900/60 p-8 text-slate-100 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
                Configurator wizard
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Run a modern cost seg quote</h1>
                <p className="max-w-2xl text-sm text-slate-200/80">
                  Guided steps on the left, live pricing on the right. On mobile we’ll walk you through one smart question at a time with totals updating below.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-right shadow-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Live total</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(computedResults.finalBid)}</p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span>
                  Step {activeIndex + 1} of {totalUnits}
                </span>
                <span>
                  {isDesktop
                    ? currentStep?.title ?? ""
                    : currentQuestion
                      ? FIELD_META[currentQuestion.fieldId].label
                      : ""}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {isDesktop && currentStep ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white">{currentStep.title}</h2>
                  <p className="text-sm text-slate-400">{currentStep.description}</p>
                </div>
                <div className={currentStep.gridClass}>
                  {currentStep.fields.map((fieldId) => (
                    <FieldRenderer
                      key={fieldId}
                      fieldId={fieldId}
                      register={register}
                      control={control}
                      errors={errors}
                      required={determineRequired(fieldId, summaryValues)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {!isDesktop && currentQuestion ? (
              <div className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">
                    {FIELD_META[currentQuestion.fieldId].label}
                  </h2>
                  {FIELD_META[currentQuestion.fieldId].hint && (
                    <p className="text-sm text-slate-400">
                      {FIELD_META[currentQuestion.fieldId].hint}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <FieldRenderer
                    fieldId={currentQuestion.fieldId}
                    register={register}
                    control={control}
                    errors={errors}
                    required={determineRequired(currentQuestion.fieldId, summaryValues)}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-white/10 px-4 py-2 font-semibold text-slate-300 transition hover:border-emerald-300/60 hover:text-white"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-full border border-white/10 px-4 py-2 font-semibold text-slate-300 transition hover:border-emerald-300/60 hover:text-white"
                >
                  {saveStatus === "saved" ? "Saved ✓" : "Save & resume"}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={activeIndex === 0}
                  className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200 transition disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600 hover:border-emerald-300/60 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isCurrentValid || isSubmitting}
                  className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-emerald-950 shadow-lg transition disabled:cursor-not-allowed disabled:bg-emerald-800/50 hover:bg-emerald-400"
                >
                  {nextLabel}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <LiveSummary values={summaryValues} results={computedResults} />

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-white/10 bg-slate-950/95 px-5 py-4 text-slate-100 shadow-[0_-10px_40px_rgba(15,23,42,0.6)] backdrop-blur lg:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Est. total</p>
          <p className="text-xl font-semibold">{formatMoney(computedResults.finalBid)}</p>
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentValid || isSubmitting}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg transition disabled:cursor-not-allowed disabled:bg-emerald-800/50 hover:bg-emerald-400"
        >
          {nextLabel}
        </button>
      </div>
    </form>
  );
}

type RendererProps = {
  fieldId: FieldId;
  register: UseFormRegister<QuoteSchema>;
  control: Control<QuoteSchema>;
  errors: FieldErrors<QuoteSchema>;
  required: boolean;
};

function FieldRenderer({ fieldId, register, control, errors, required }: RendererProps) {
  const meta = FIELD_META[fieldId];
  const fieldError = errors[fieldId as keyof typeof errors];
  const errorMessage =
    typeof fieldError?.message === "string" ? fieldError.message : undefined;

  const commonFieldProps = {
    label: meta.label,
    fieldId,
    required,
    helpText: meta.helpText,
    hint: meta.hint,
    error: errorMessage,
  };

  switch (fieldId) {
    case "prospectName":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              placeholder={meta.placeholder}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("prospectName")}
            />
          )}
        </Field>
      );
    case "propertyAddress":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              placeholder={meta.placeholder}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("propertyAddress")}
            />
          )}
        </Field>
      );
    case "zipCode":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              inputMode="numeric"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("zipCode")}
            />
          )}
        </Field>
      );
    case "taxYear":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("taxYear", { valueAsNumber: true })}
            />
          )}
        </Field>
      );
    case "taxDeadline":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={selectClassName}
              {...register("taxDeadline")}
            >
              {TAX_DEADLINE_OPTIONS.map((deadline) => (
                <option key={deadline} value={deadline}>
                  {deadline}
                </option>
              ))}
            </select>
          )}
        </Field>
      );
    case "purchasePrice":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
              <input
                id={id}
                type="number"
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
      );
    case "landValuePercent":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3">
              <input
                id={id}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max="80"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="w-full border-none bg-transparent text-sm text-slate-100 outline-none"
                {...register("landValuePercent", { valueAsNumber: true })}
              />
              <span className="text-xs text-slate-500">%</span>
            </div>
          )}
        </Field>
      );
    case "hasCapitalImprovements":
      return (
        <Field {...commonFieldProps}>
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
      );
    case "capitalImprovementsAmount":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
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
      );
    case "priceOverride":
      return (
        <Field {...commonFieldProps}>
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
      );
    case "overrideAmount":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
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
      );
    case "propertyType":
      return (
        <Field {...commonFieldProps}>
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
      );
    case "yearBuilt":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("yearBuilt", { valueAsNumber: true })}
            />
          )}
        </Field>
      );
    case "numberOfFloors":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min="1"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("numberOfFloors", { valueAsNumber: true })}
            />
          )}
        </Field>
      );
    case "sqftBuilding":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("sqftBuilding", { valueAsNumber: true })}
            />
          )}
        </Field>
      );
    case "acresLand":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              step="0.01"
              min="0"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("acresLand", { valueAsNumber: true })}
            />
          )}
        </Field>
      );
    case "multipleProperties":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min="1"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className={baseInputClassName}
              {...register("multipleProperties", { valueAsNumber: true })}
            />
          )}
        </Field>
      );
    case "is1031Exchange":
      return (
        <Field {...commonFieldProps}>
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
      );
    case "accumulated1031Depreciation":
      return (
        <Field {...commonFieldProps}>
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
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
      );
    case "needRush":
      return (
        <Field {...commonFieldProps}>
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
      );
    default:
      return null;
  }
}

function determineRequired(fieldId: FieldId, values: QuoteFormValues): boolean {
  if (fieldId === "capitalImprovementsAmount") {
    return values.hasCapitalImprovements;
  }
  if (fieldId === "accumulated1031Depreciation") {
    return values.is1031Exchange;
  }
  if (fieldId === "overrideAmount") {
    return Boolean(values.priceOverride);
  }
  return true;
}

function LiveSummary({
  values,
  results,
}: {
  values: QuoteFormValues;
  results: QuoteComputation;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-6 rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-slate-100 shadow-2xl backdrop-blur">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Live summary</p>
          <p className="text-4xl font-semibold text-white">{formatMoney(results.finalBid)}</p>
          <p className="text-xs text-slate-400">Final bid updates as you configure.</p>
        </div>

        <div className="space-y-3">
          <SummaryRow label="Base cost seg bid" value={results.baseCostSegBid} />
          <SummaryRow label="Natural log quote" value={results.natLogQuote} />
          <SummaryRow label="Cost method floor" value={results.costMethodQuote} highlight />
          {results.rushFee > 0 ? (
            <SummaryRow label="Rush fee" value={results.rushFee} subtle />
          ) : null}
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
          <SummaryStat
            label="50/50 plan"
            value={results.fiftyFiftyPlanTotal}
            hint={`${formatMoney(results.fiftyFiftyInstallment)} × 2`}
          />
          <SummaryStat
            label="Monthly plan"
            value={results.monthlyTotal}
            hint={`${formatMoney(results.monthlyInstallment)} / month`}
          />
          <SummaryStat
            label="Bonus depreciation"
            value={results.bonusDepreciation}
            hint="Est. 80% capture"
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">
          <SnapshotRow label="Property type" value={values.propertyType} />
          <SnapshotRow label="Tax year" value={`${values.taxYear} • ${values.taxDeadline}`} />
          <SnapshotRow label="Building size" value={`${formatNumber(values.sqftBuilding)} sqft`} />
          <SnapshotRow label="Acreage" value={`${values.acresLand.toFixed(2)} acres`} />
          <SnapshotRow label="Structures" value={`${values.multipleProperties}`} />
          <SnapshotRow label="Year built" value={`${values.yearBuilt}`} />
          <SnapshotRow
            label="Rush"
            value={values.needRush === "rush" ? "Rush selected" : "Standard turnaround"}
          />
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
  subtle = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  subtle?: boolean;
}) {
  const tone = highlight
    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
    : subtle
      ? "border-white/5 bg-white/5 text-slate-300"
      : "border-white/10 bg-black/30 text-slate-100";

  return (
    <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <span>{label}</span>
      <span className="font-semibold">{formatMoney(value)}</span>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{formatMoney(value)}</p>
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="uppercase tracking-[0.25em] text-slate-500">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
