import { cn } from "@/utils";

type Tone = "brand" | "navy" | "success" | "warning" | "error" | "gray";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  navy: "bg-navy-50 text-navy-600 dark:bg-navy-500/15 dark:text-navy-300",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  gray: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
};

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export default function MetricCard({ label, value, hint, icon, tone = "navy", className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-theme-sm sm:p-5 dark:border-gray-800 dark:bg-white/3",
        className,
      )}
    >
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl [&>svg]:size-6", tones[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 truncate text-xl font-bold text-gray-900 tabular-nums sm:text-2xl dark:text-white">
          {value}
        </p>
        {hint && <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}
