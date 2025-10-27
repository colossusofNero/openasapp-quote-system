import { RCGLogo } from "@/components/layout/logo";
import { formatDate } from "@/lib/utils";

interface QuoteHeaderProps {
  clientName: string;
  propertyAddress: string;
  quoteDate: string | Date;
  purchasePrice: number;
  buildingSqFt: number;
  landAcres: number;
  yearBuilt: number;
}

export function QuoteHeader({
  clientName,
  propertyAddress,
  quoteDate,
  purchasePrice,
  buildingSqFt,
  landAcres,
  yearBuilt,
}: QuoteHeaderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="space-y-6">
      {/* Logo and Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <RCGLogo />
        <div className="sm:text-right">
          <p className="text-sm font-medium text-rcg-text-gray">Quote Date</p>
          <p className="text-base font-semibold text-rcg-navy">
            {formatDate(quoteDate)}
          </p>
        </div>
      </div>

      {/* Client Name and Address */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-rcg-blue font-poppins">
          {clientName}
        </h1>
        <p className="text-base sm:text-lg text-rcg-text-gray">{propertyAddress}</p>
      </div>

      {/* Property Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <InfoCard
          label="Purchase Price"
          value={formatCurrency(purchasePrice)}
        />
        <InfoCard
          label="Building SqFt"
          value={formatNumber(buildingSqFt)}
        />
        <InfoCard
          label="Land Acres"
          value={landAcres.toString()}
        />
        <InfoCard
          label="Year Built"
          value={yearBuilt.toString()}
        />
      </div>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
}

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-rcg-text-gray mb-1">{label}</p>
      <p className="text-xl font-bold text-rcg-navy font-tabular-nums">{value}</p>
    </div>
  );
}
