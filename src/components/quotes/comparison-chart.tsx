"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ComparisonChartProps {
  data: {
    buildingValue: number;
    landValue: number;
    bidAmount: number;
  };
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  const chartData = [
    {
      name: "Property Value",
      building: data.buildingValue,
      land: data.landValue,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Value Breakdown</CardTitle>
        <CardDescription>
          Visual representation of building vs land value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="building" fill="#3b82f6" name="Building Value" />
            <Bar dataKey="land" fill="#10b981" name="Land Value" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Building Value</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(data.buildingValue)}
            </p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Land Value</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data.landValue)}
            </p>
          </div>
          <div className="text-center p-4 border rounded-lg bg-primary/5">
            <p className="text-sm text-muted-foreground">Service Fee</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(data.bidAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
