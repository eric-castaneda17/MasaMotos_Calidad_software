import { cn } from "@/utils";

interface DataCardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export default function DataCard({ title, subtitle, actions, className, bodyClassName, children }: DataCardProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-4 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
