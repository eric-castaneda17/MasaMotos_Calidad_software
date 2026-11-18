"use client";

import BrandLogo from "@/components/common/BrandLogo";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useFormAction } from "@/hooks/useFormAction";
import { useMessage } from "@/hooks/useMessage";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { loginAction } from "@/lib/actions/auth";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SignInForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const msg = useMessage();
  const [showPassword, setShowPassword] = useState(false);
  const { state, pending, onSubmit, fieldErrors } = useFormAction(loginAction, { silentError: true });
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return (
    <div className="flex w-full flex-1 flex-col px-6 py-20 lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8 lg:hidden">
          <BrandLogo variant="full" height={110} priority />
        </div>
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {state && !state.ok && !hasFieldErrors && (
            <div
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-300"
              data-testid="signin-error"
            >
              {msg(state.message)}
            </div>
          )}
          <TextInput
            label={t("email")}
            name="email"
            type="email"
            autoComplete="username"
            placeholder={t("emailPlaceholder")}
            required
            error={fieldErrors.email}
            autoFocus
          />
          <div className="relative">
            <TextInput
              label={t("password")}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              required
              error={fieldErrors.password}
              className="[&_input]:pe-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute end-3 top-9.5 text-gray-500 hover:text-gray-700 dark:text-gray-400"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? <EyeIcon className="size-5 fill-current" /> : <EyeCloseIcon className="size-5 fill-current" />}
            </button>
          </div>
          <Button type="submit" className="w-full" loading={pending} data-testid="signin-submit">
            {pending ? t("submitting") : t("submit")}
          </Button>
        </form>
        <p className="mt-10 text-center text-xs text-gray-400">
          {tc("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
