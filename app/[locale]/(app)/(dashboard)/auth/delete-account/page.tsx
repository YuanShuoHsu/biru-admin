import { setRequestLocale } from "next-intl/server";
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
