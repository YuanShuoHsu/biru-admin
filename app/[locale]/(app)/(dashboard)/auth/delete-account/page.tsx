import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import AuthDeleteAccount from ".";

import type { Locale } from "@/i18n/routing";

interface AuthDeleteAccountPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    email?: string;
    redirectTo?: string;
    token?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: AuthDeleteAccountPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("auth.deleteAccount.label") };
};

const AuthDeleteAccountPage = async ({
  params,
  searchParams,
}: AuthDeleteAccountPageProps) => {
  const [{ locale }, { email, redirectTo, token }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const safeEmail = typeof email === "string" ? email : "";
  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;
  const safeToken = typeof token === "string" ? token : "";

  if (!safeToken) notFound();

  return (
    <AuthDeleteAccount
      email={safeEmail}
      redirectTo={safeRedirectTo}
      token={safeToken}
    />
  );
};

export default AuthDeleteAccountPage;
