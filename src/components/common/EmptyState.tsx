import { BoxIconLine } from "@/icons";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500 [&>svg]:size-7">
        {icon ?? <BoxIconLine />}
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
