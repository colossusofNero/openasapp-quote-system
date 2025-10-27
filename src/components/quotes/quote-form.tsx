"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuoteInputSchema, QuoteInput } from "@/lib/validations/quote.schema";
import { useCreateQuote, useCalculateQuote } from "@/lib/api/hooks";
import { useDebounce } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/ui/form-field";
import { SectionHeader } from "@/components/ui/section-header";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

const PROPERTY_TYPES = [
  'Industrial',
  'Medical',
  'Office',
  'Other',
  'Restaurant',
  'Retail',
  'Warehouse',
  'Multi-Family',
  'Residential/LTR',
  'Short-Term Rental',
];

interface QuoteFormProps {
  initialData?: Partial<QuoteInput>;
  quoteId?: string;
}

export function QuoteForm({ initialData, quoteId }: QuoteFormProps) {
  const router = useRouter();
  const [calculatedQuote, setCalculatedQuote] = useState<any>(null);
  const [autoCalculateEnabled, setAutoCalculateEnabled] = useState(false);

  const createQuote = useCreateQuote();
  const calculateQuote = useCalculateQuote();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(QuoteInputSchema) as any,
    defaultValues: initialData || {
      multipleProperties: 1,
      capEx: 0,
      accumulated1031Depreciation: 0,
      quoteType: 'RCGV',
      rushFee: false,
    },
  });

  const formValues = watch();

  // Debounce the purchase price to prevent excessive API calls during typing
  // This improves performance by reducing network requests and calculations
  const debouncedPurchasePrice = useDebounce(formValues.purchasePrice, 500);
  const debouncedBuildingSize = useDebounce(formValues.sqFtBuilding, 500);

  // Memoize whether the form has required data for calculation
  const canAutoCalculate = useMemo(() => {
    return !!(
      formValues.purchasePrice &&
      formValues.sqFtBuilding &&
      formValues.propertyType &&
      formValues.dateOfPurchase
    );
  }, [
    formValues.purchasePrice,
    formValues.sqFtBuilding,
    formValues.propertyType,
    formValues.dateOfPurchase,
  ]);

  // Auto-calculate when debounced values change (if enabled)
  useEffect(() => {
    if (autoCalculateEnabled && canAutoCalculate && debouncedPurchasePrice) {
      calculateQuote.mutate(formValues, {
        onSuccess: (response) => {
          setCalculatedQuote(response.data);
        },
      });
    }
  }, [debouncedPurchasePrice, debouncedBuildingSize, autoCalculateEnabled, canAutoCalculate]);

  const handleCalculate = async () => {
    calculateQuote.mutate(formValues, {
      onSuccess: (response) => {
        setCalculatedQuote(response.data);
        setAutoCalculateEnabled(true); // Enable auto-recalculation after first manual calculation
      },
    });
  };

  const onSubmit = async (data: QuoteInput) => {
    createQuote.mutate(data, {
      onSuccess: (response) => {
        router.push(`/quotes/${response.data.id}`);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl">
      {/* Header Section */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-6">
          <h1 className="text-3xl font-bold text-rcg-navy font-poppins">
            RCGV Quote & Estimate
          </h1>
          <p className="text-rcg-text-gray mt-2">
            Complete the information below to generate an accurate cost segregation quote
          </p>
        </CardContent>
      </Card>

      {/* Prospect Information Section */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-6">
          <SectionHeader
            title="Prospect Information"
            description="Client and property owner details"
          />

          <div className="space-y-5">
            <FormField
              label="Client Name"
              htmlFor="propertyOwnerName"
              required
              error={errors.propertyOwnerName?.message as string}
              helpText="Enter the full legal name of the property owner or client"
            >
              <Input
                id="propertyOwnerName"
                placeholder="Enter client name"
                {...register('propertyOwnerName')}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Property Information Section */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-6">
          <SectionHeader
            title="Property Information"
            description="Location and tax details"
          />

          <div className="space-y-5">
            <FormField
              label="Property Address"
              htmlFor="propertyAddress"
              required
              error={errors.propertyAddress?.message as string}
              helpText="Full street address of the property"
            >
              <Input
                id="propertyAddress"
                placeholder="123 Main Street, City, State"
                {...register('propertyAddress')}
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="ZIP Code"
                htmlFor="zipCode"
                required
                error={errors.zipCode?.message as string}
              >
                <Input
                  id="zipCode"
                  placeholder="12345"
                  {...register('zipCode')}
                />
              </FormField>

              <FormField
                label="Tax Year"
                htmlFor="taxYear"
                required
                error={errors.taxYear?.message as string}
                helpText="The tax year for which the cost segregation study applies"
              >
                <Input
                  id="taxYear"
                  type="number"
                  placeholder="2024"
                  {...register('taxYear', { valueAsNumber: true })}
                />
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information Section */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-6">
          <SectionHeader
            title="Financial Information"
            description="Purchase details and pricing"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Date of Purchase"
              htmlFor="dateOfPurchase"
              required
              error={errors.dateOfPurchase?.message as string}
              helpText="The date when the property was acquired"
            >
              <Input
                id="dateOfPurchase"
                type="date"
                {...register('dateOfPurchase')}
              />
            </FormField>

            <FormField
              label="Purchase Price"
              htmlFor="purchasePrice"
              required
              error={errors.purchasePrice?.message as string}
              helpText="Total purchase price of the property"
            >
              <Controller
                name="purchasePrice"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="purchasePrice"
                    placeholder="0"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Property Details Section */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-6">
          <SectionHeader
            title="Property Details"
            description="Physical characteristics and specifications"
          />

          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Building Size"
                htmlFor="sqFtBuilding"
                required
                error={errors.sqFtBuilding?.message as string}
                helpText="Total square footage of the building(s)"
              >
                <div className="relative">
                  <Input
                    id="sqFtBuilding"
                    type="number"
                    placeholder="10000"
                    {...register('sqFtBuilding', { valueAsNumber: true })}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">sq ft</span>
                  </div>
                </div>
              </FormField>

              <FormField
                label="Land Size"
                htmlFor="acresLand"
                required
                error={errors.acresLand?.message as string}
                helpText="Total acres of land"
              >
                <div className="relative">
                  <Input
                    id="acresLand"
                    type="number"
                    step="0.01"
                    placeholder="2.5"
                    {...register('acresLand', { valueAsNumber: true })}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">acres</span>
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <FormField
                label="Property Type"
                htmlFor="propertyType"
                required
                error={errors.propertyType?.message as string}
              >
                <Select id="propertyType" {...register('propertyType')}>
                  <option value="">Select type...</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Number of Floors"
                htmlFor="numberOfFloors"
                error={errors.numberOfFloors?.message as string}
              >
                <Input
                  id="numberOfFloors"
                  type="number"
                  placeholder="2"
                  {...register('numberOfFloors', { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Year Built"
                htmlFor="yearBuilt"
                error={errors.yearBuilt?.message as string}
              >
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="2020"
                  {...register('yearBuilt', { valueAsNumber: true })}
                />
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Section */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-6">
          <SectionHeader
            title="Additional Information"
            description="Optional details for more accurate quotes"
          />

          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Capital Expenditures (CapEx)"
                htmlFor="capEx"
                error={errors.capEx?.message as string}
                helpText="Additional improvements or renovations made to the property"
              >
                <Controller
                  name="capEx"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="capEx"
                      placeholder="0"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Multiple Properties"
                htmlFor="multipleProperties"
                error={errors.multipleProperties?.message as string}
                helpText="Number of properties included in this quote"
              >
                <Input
                  id="multipleProperties"
                  type="number"
                  min="1"
                  placeholder="1"
                  {...register('multipleProperties', { valueAsNumber: true })}
                />
              </FormField>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="rushFee"
                {...register('rushFee')}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-rcg-blue focus:ring-rcg-blue cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="rushFee" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Rush Order
                </label>
                <p className="text-sm text-rcg-text-gray">
                  Expedited processing with additional fee
                </p>
              </div>
            </div>

            <FormField
              label="Notes"
              htmlFor="notes"
              helpText="Any additional information or special requirements"
            >
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                placeholder="Enter any additional notes or requirements..."
                className="flex min-h-[100px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rcg-blue focus-visible:border-rcg-blue disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Quote Results (if calculated) */}
      {calculatedQuote && (
        <Card className="shadow-sm border-rcg-blue border-2">
          <CardContent className="pt-6 pb-6">
            <SectionHeader
              title="Quote Calculation"
              description="Review the calculated quote details"
            />

            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-rcg-light-blue rounded-lg p-6">
                  <p className="text-sm font-medium text-rcg-text-gray mb-2">
                    Final Bid Amount
                  </p>
                  <p className="text-4xl font-bold text-rcg-navy font-poppins">
                    {formatCurrency(calculatedQuote.bidAmount)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm font-medium text-rcg-text-gray mb-2">
                    Building Value
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {formatCurrency(calculatedQuote.buildingValue)}
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  This is a calculated estimate. The quote will be saved as a draft and can be edited before sending to the client.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <Card className="shadow-sm bg-gray-50">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="border-gray-300 w-full sm:w-auto"
            >
              Cancel
            </Button>

            <div className="flex flex-col sm:flex-row gap-3">
              {!calculatedQuote && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleCalculate}
                  disabled={calculateQuote.isPending}
                  className="border-rcg-blue text-rcg-blue hover:bg-rcg-light-blue w-full sm:w-auto"
                >
                  {calculateQuote.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    'Calculate Quote'
                  )}
                </Button>
              )}

              {calculatedQuote && (
                <Button
                  type="submit"
                  size="lg"
                  disabled={createQuote.isPending}
                  className="bg-rcg-blue hover:bg-rcg-navy w-full sm:w-auto"
                >
                  {createQuote.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Quote'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
