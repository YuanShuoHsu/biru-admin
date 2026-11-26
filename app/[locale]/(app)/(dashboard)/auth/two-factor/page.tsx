import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import AuthTwoFactor from ".";

import type { Locale } from "@/i18n/routing";

interface AuthTwoFactorPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ methods?: string; redirectTo?: string }>;
}

export const generateMetadata = async ({
  params,
}: AuthTwoFactorPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAuth = await getTranslations({ locale, namespace: "auth" });

  return { title: tAuth("twoFactor.label") };
};

const AuthTwoFactorPage = async ({ searchParams }: AuthTwoFactorPageProps) => {
  const { methods, redirectTo } = await searchParams;

  const twoFactorMethods =
    typeof methods === "string" ? methods.split(",") : [];
  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  return (
    <AuthTwoFactor methods={twoFactorMethods} redirectTo={safeRedirectTo} />
  );
};

export default AuthTwoFactorPage;
