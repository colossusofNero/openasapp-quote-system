import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface PaymentOptionsProps {
  paymentOptions: {
    upfront: { amount: number; discount: number };
    fiftyFifty: { firstPayment: number; secondPayment: number; total: number };
    monthly: { monthlyAmount: number; numberOfMonths: number; total: number };
  };
}

export function PaymentOptions({ paymentOptions }: PaymentOptionsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Upfront Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Upfront Payment
            <Badge variant="success">Save {paymentOptions.upfront.discount}%</Badge>
          </CardTitle>
          <CardDescription>Pay in full and save</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(paymentOptions.upfront.amount)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            One-time payment
          </p>
        </CardContent>
      </Card>

      {/* 50/50 Payment */}
      <Card>
        <CardHeader>
          <CardTitle>50/50 Payment</CardTitle>
          <CardDescription>Split into two payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">First Payment</p>
              <p className="text-2xl font-bold">
                {formatCurrency(paymentOptions.fiftyFifty.firstPayment)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Second Payment</p>
              <p className="text-2xl font-bold">
                {formatCurrency(paymentOptions.fiftyFifty.secondPayment)}
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">
                {formatCurrency(paymentOptions.fiftyFifty.total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Payment</CardTitle>
          <CardDescription>Spread over {paymentOptions.monthly.numberOfMonths} months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Per Month</p>
              <p className="text-2xl font-bold">
                {formatCurrency(paymentOptions.monthly.monthlyAmount)}
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Total ({paymentOptions.monthly.numberOfMonths} months)</p>
              <p className="text-lg font-semibold">
                {formatCurrency(paymentOptions.monthly.total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
