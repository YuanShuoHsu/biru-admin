import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import AuthResetPassword from ".";

import type { Locale } from "@/i18n/routing";

interface AuthResetPasswordPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    email?: string;
    error?: string;
    redirectTo?: string;
    token?: string;
  }>;
}

const AuthResetPasswordPage = async ({
  params,
  searchParams,
}: AuthResetPasswordPageProps) => {
  const [{ locale }, { email, error, redirectTo, token }] = await Promise.all([
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

  if (error || !safeEmail || !safeToken) notFound();

  return (
    <AuthResetPassword
      email={safeEmail}
      redirectTo={safeRedirectTo}
      token={safeToken}
    />
  );
};

export default AuthResetPasswordPage;
