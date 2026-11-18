import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, crumbs = [], actions }: PageHeaderProps) {
  const t = useTranslations("common");
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
      <div className="min-w-0">
        <nav aria-label="breadcrumb" className="mb-1.5">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400">
                {t("home")}
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="rtl:rotate-180">
                  ›
                </span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-brand-600 dark:hover:text-brand-400">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
