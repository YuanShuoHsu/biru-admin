import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
  const tAuth = await getTranslations({ locale, namespace: "auth" });

  return { title: tAuth("forgotPassword.label") };
};

const AuthForgotPasswordPage = async ({
  searchParams,
}: AuthForgotPasswordPageProps) => {
  const { redirectTo } = await searchParams;

  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  return <AuthForgotPassword redirectTo={safeRedirectTo} />;
};

export default AuthForgotPasswordPage;
