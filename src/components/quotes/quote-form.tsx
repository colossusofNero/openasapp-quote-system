"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuoteInputSchema, QuoteInput } from "@/lib/validations/quote.schema";
import { useCreateQuote, useCalculateQuote } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";

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
  const [step, setStep] = useState(1);
  const [calculatedQuote, setCalculatedQuote] = useState<any>(null);

  const createQuote = useCreateQuote();
  const calculateQuote = useCalculateQuote();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuoteInput>({
    resolver: zodResolver(QuoteInputSchema),
    defaultValues: initialData || {
      multipleProperties: 1,
      capEx: 0,
      accumulated1031Depreciation: 0,
      quoteType: 'RCGV',
      rushFee: false,
    },
  });

  const formValues = watch();

  const handleCalculate = async () => {
    calculateQuote.mutate(formValues, {
      onSuccess: (response) => {
        setCalculatedQuote(response.data);
        setStep(4);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 ${s < 4 ? 'border-r' : ''}`}
              >
                <div className="flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      s <= step
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </div>
                </div>
                <p className="text-center text-xs mt-2">
                  {s === 1 && 'Property'}
                  {s === 2 && 'Additional'}
                  {s === 3 && 'Client'}
                  {s === 4 && 'Review'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Property Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Enter the basic property information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  {...register('purchasePrice', { valueAsNumber: true })}
                />
                {errors.purchasePrice && (
                  <p className="text-sm text-red-600">{errors.purchasePrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" {...register('zipCode')} />
                {errors.zipCode && (
                  <p className="text-sm text-red-600">{errors.zipCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sqFtBuilding">Building Size (sq ft)</Label>
                <Input
                  id="sqFtBuilding"
                  type="number"
                  {...register('sqFtBuilding', { valueAsNumber: true })}
                />
                {errors.sqFtBuilding && (
                  <p className="text-sm text-red-600">{errors.sqFtBuilding.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="acresLand">Land Size (acres)</Label>
                <Input
                  id="acresLand"
                  type="number"
                  step="0.01"
                  {...register('acresLand', { valueAsNumber: true })}
                />
                {errors.acresLand && (
                  <p className="text-sm text-red-600">{errors.acresLand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select id="propertyType" {...register('propertyType')}>
                  <option value="">Select type...</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                {errors.propertyType && (
                  <p className="text-sm text-red-600">{errors.propertyType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfFloors">Number of Floors</Label>
                <Input
                  id="numberOfFloors"
                  type="number"
                  {...register('numberOfFloors', { valueAsNumber: true })}
                />
                {errors.numberOfFloors && (
                  <p className="text-sm text-red-600">{errors.numberOfFloors.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  {...register('yearBuilt', { valueAsNumber: true })}
                />
                {errors.yearBuilt && (
                  <p className="text-sm text-red-600">{errors.yearBuilt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfPurchase">Purchase Date</Label>
                <Input
                  id="dateOfPurchase"
                  type="date"
                  {...register('dateOfPurchase')}
                />
                {errors.dateOfPurchase && (
                  <p className="text-sm text-red-600">{errors.dateOfPurchase.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxYear">Tax Year</Label>
                <Input
                  id="taxYear"
                  type="number"
                  {...register('taxYear', { valueAsNumber: true })}
                />
                {errors.taxYear && (
                  <p className="text-sm text-red-600">{errors.taxYear.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Additional Info */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Optional details for more accurate quotes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capEx">Capital Expenditures ($)</Label>
                <Input
                  id="capEx"
                  type="number"
                  {...register('capEx', { valueAsNumber: true })}
                />
                {errors.capEx && (
                  <p className="text-sm text-red-600">{errors.capEx.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="multipleProperties">Multiple Properties</Label>
                <Input
                  id="multipleProperties"
                  type="number"
                  {...register('multipleProperties', { valueAsNumber: true })}
                />
                {errors.multipleProperties && (
                  <p className="text-sm text-red-600">{errors.multipleProperties.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quoteType">Quote Type</Label>
                <Select id="quoteType" {...register('quoteType')}>
                  <option value="RCGV">RCGV</option>
                  <option value="Pro">Pro</option>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="rushFee"
                  {...register('rushFee')}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="rushFee" className="font-normal">
                  Rush order (additional fee applies)
                </Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Client Info */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Enter the property owner details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyOwnerName">Property Owner Name</Label>
              <Input id="propertyOwnerName" {...register('propertyOwnerName')} />
              {errors.propertyOwnerName && (
                <p className="text-sm text-red-600">{errors.propertyOwnerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyAddress">Property Address</Label>
              <Input id="propertyAddress" {...register('propertyAddress')} />
              {errors.propertyAddress && (
                <p className="text-sm text-red-600">{errors.propertyAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                {...register('notes')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" onClick={handleCalculate} disabled={calculateQuote.isPending}>
                {calculateQuote.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Calculating...
                  </>
                ) : (
                  'Calculate & Review'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Calculate */}
      {step === 4 && (
        <>
          {calculatedQuote ? (
            <Card>
              <CardHeader>
                <CardTitle>Quote Calculation</CardTitle>
                <CardDescription>Review the calculated quote details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Final Bid Amount</Label>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(calculatedQuote.bidAmount)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Building Value</Label>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(calculatedQuote.buildingValue)}
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    This is a calculated estimate. The quote will be saved as a draft and can be edited before sending to the client.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={createQuote.isPending}>
                    {createQuote.isPending ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Quote'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </form>
  );
}
