import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import AuthVerifyEmail from ".";

import type { Locale } from "@/i18n/routing";

interface AuthVerifyEmailPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    email?: string;
    redirectTo?: string;
    token?: string;
  }>;
}

const AuthVerifyEmailPage = async ({
  params,
  searchParams,
}: AuthVerifyEmailPageProps) => {
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

  if (!safeEmail && !safeToken) notFound();

  return (
    <AuthVerifyEmail
      email={safeEmail}
      locale={locale}
      redirectTo={safeRedirectTo}
      token={safeToken}
    />
  );
};

export default AuthVerifyEmailPage;
