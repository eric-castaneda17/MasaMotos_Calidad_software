import { cn } from "@/utils";

export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("custom-scrollbar max-w-full overflow-x-auto", className)}>
      <table className="w-full min-w-full text-start text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className, align = "start" }: { children?: React.ReactNode; className?: string; align?: "start" | "end" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-gray-500 uppercase sm:px-5 dark:border-gray-800 dark:bg-white/2 dark:text-gray-400",
        align === "end" ? "text-end" : align === "center" ? "text-center" : "text-start",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, align = "start" }: { children?: React.ReactNode; className?: string; align?: "start" | "end" | "center" }) {
  return (
    <td
      className={cn(
        "border-b border-gray-100 px-4 py-3 text-gray-700 sm:px-5 dark:border-gray-800 dark:text-gray-300",
        align === "end" ? "text-end tabular-nums" : align === "center" ? "text-center" : "text-start",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-gray-50/60 dark:hover:bg-white/2", className)}>{children}</tr>;
}
