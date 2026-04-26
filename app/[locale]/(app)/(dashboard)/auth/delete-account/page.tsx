import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import AuthDeleteAccount from ".";

import type { Locale } from "@/i18n/routing";

interface AuthDeleteAccountPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    redirectTo?: string;
    token?: string;
  }>;
}

const AuthDeleteAccountPage = async ({
  params,
  searchParams,
}: AuthDeleteAccountPageProps) => {
  const [{ locale }, { redirectTo, token }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const safeToken = typeof token === "string" ? token : "";

  if (!safeToken) notFound();

  const safeRedirectTo =
    typeof redirectTo === "string" ? redirectTo : undefined;

  return <AuthDeleteAccount redirectTo={safeRedirectTo} token={safeToken} />;
};

export default AuthDeleteAccountPage;
