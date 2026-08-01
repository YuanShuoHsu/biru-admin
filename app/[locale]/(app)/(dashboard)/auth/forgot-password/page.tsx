import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthForgotPassword from ".";

import type { Locale } from "@/i18n/routing";

interface AuthForgotPasswordPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export const generateMetadata = async ({
  params,
}: AuthForgotPasswordPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("auth.forgotPassword.label") };
};

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
