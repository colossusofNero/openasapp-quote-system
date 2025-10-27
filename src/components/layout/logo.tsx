import { cn } from "@/lib/utils";

interface RCGLogoProps {
  className?: string;
}

export function RCGLogo({ className }: RCGLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Building Icon with Gradient */}
      <div className="relative w-10 h-10">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient
              id="buildingGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#4A90E2" />
              <stop offset="100%" stopColor="#1E2949" />
            </linearGradient>
          </defs>
          {/* Main Building */}
          <rect
            x="8"
            y="10"
            width="24"
            height="28"
            fill="url(#buildingGradient)"
            rx="1"
          />
          {/* Windows */}
          <rect x="12" y="14" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="18" y="14" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="24" y="14" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="12" y="20" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="18" y="20" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="24" y="20" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="12" y="26" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="18" y="26" width="4" height="4" fill="white" opacity="0.3" />
          <rect x="24" y="26" width="4" height="4" fill="white" opacity="0.3" />
          {/* Entrance */}
          <rect x="16" y="32" width="8" height="6" fill="white" opacity="0.5" />
        </svg>
      </div>

      {/* Text Logo */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-bold text-rcg-navy font-poppins tracking-tight">
            RCGV
          </span>
        </div>
        <span className="text-[10px] font-semibold text-rcg-blue uppercase tracking-wider">
          Valuation
        </span>
      </div>
    </div>
  );
}
