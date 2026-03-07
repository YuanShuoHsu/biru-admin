import { setRequestLocale } from "next-intl/server";

import AuthSignUp from ".";

import type { Locale } from "@/i18n/routing";

interface AuthSignUpPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

const AuthSignUpPage = async ({
  params,
  searchParams,
}: AuthSignUpPageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  return <AuthSignUp locale={locale} redirectTo={safeRedirectTo} />;
};

export default AuthSignUpPage;
