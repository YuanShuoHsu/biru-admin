import { setRequestLocale } from "next-intl/server";

import AuthForgotPassword from ".";

import type { Locale } from "@/i18n/routing";

interface AuthForgotPasswordPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

const AuthForgotPasswordPage = async ({
  params,
  searchParams,
}: AuthForgotPasswordPageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  return <AuthForgotPassword redirectTo={safeRedirectTo} />;
};

export default AuthForgotPasswordPage;
