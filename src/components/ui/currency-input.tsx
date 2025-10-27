import * as React from "react";
import { cn } from "@/lib/utils";
import { DollarSignIcon } from "lucide-react";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatNumber(value));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const formatNumber = (num: number): string => {
      return num.toLocaleString('en-US', {
        maximumFractionDigits: 0,
      });
    };

    const parseNumber = (str: string): number | undefined => {
      const cleaned = str.replace(/[^0-9]/g, '');
      if (cleaned === '') return undefined;
      return parseInt(cleaned, 10);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseNumber(inputValue);

      if (inputValue === '' || inputValue === '$') {
        setDisplayValue('');
        onChange?.(undefined);
      } else if (numericValue !== undefined) {
        setDisplayValue(formatNumber(numericValue));
        onChange?.(numericValue);
      }
    };

    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <DollarSignIcon className="h-4 w-4 text-gray-500" />
        </div>
        <input
          type="text"
          className={cn(
            "flex h-12 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-base font-mono text-right ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 placeholder:text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rcg-blue focus-visible:border-rcg-blue disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
