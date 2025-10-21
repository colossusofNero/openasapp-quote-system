import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface DepreciationTableProps {
  depreciationSummary: {
    method: string;
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year6: number;
    totalTax: number;
  };
}

export function DepreciationTable({ depreciationSummary }: DepreciationTableProps) {
  const years = [
    { year: 1, amount: depreciationSummary.year1 },
    { year: 2, amount: depreciationSummary.year2 },
    { year: 3, amount: depreciationSummary.year3 },
    { year: 4, amount: depreciationSummary.year4 },
    { year: 5, amount: depreciationSummary.year5 },
    { year: 6, amount: depreciationSummary.year6 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depreciation Schedule</CardTitle>
        <CardDescription>
          Year-by-year depreciation using {depreciationSummary.method} method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Depreciation Amount</TableHead>
              <TableHead className="text-right">Cumulative</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.map((item, index) => {
              const cumulative = years
                .slice(0, index + 1)
                .reduce((sum, y) => sum + y.amount, 0);

              return (
                <TableRow key={item.year}>
                  <TableCell className="font-medium">Year {item.year}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(cumulative)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-bold bg-muted/50">
              <TableCell>Total Tax Benefit</TableCell>
              <TableCell className="text-right" colSpan={2}>
                {formatCurrency(depreciationSummary.totalTax)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
