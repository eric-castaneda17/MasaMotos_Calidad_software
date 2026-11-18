import { cn } from "@/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "secondary" | "danger" | "ghost";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children?: ReactNode;
  size?: "xs" | "sm" | "md";
  variant?: ButtonVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
}

const sizeClasses = {
  xs: "px-3 py-2 text-xs",
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3.5 text-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-theme-xs hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-900",
  secondary:
    "bg-navy-700 text-white shadow-theme-xs hover:bg-navy-800 disabled:bg-navy-300 dark:bg-navy-600 dark:hover:bg-navy-500",
  danger:
    "bg-error-600 text-white shadow-theme-xs hover:bg-error-700 disabled:bg-error-300 dark:disabled:bg-error-900",
  outline:
    "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5 dark:hover:text-white",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white",
};

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
  ...rest
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden",
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && "cursor-not-allowed opacity-60",
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        startIcon && <span className="flex items-center [&>svg]:size-5">{startIcon}</span>
      )}
      {children}
      {endIcon && <span className="flex items-center [&>svg]:size-5">{endIcon}</span>}
    </button>
  );
};

export default Button;
