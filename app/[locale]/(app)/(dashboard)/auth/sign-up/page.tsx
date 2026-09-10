import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthSignUp from ".";

import type { Locale } from "@/i18n/routing";

interface AuthSignUpPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export const generateMetadata = async ({
  params,
}: AuthSignUpPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("auth.signUp.label") };
};

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
