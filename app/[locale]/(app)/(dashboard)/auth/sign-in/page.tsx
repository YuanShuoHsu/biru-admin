import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import AuthSignIn from ".";

import { REMEMBER_ME } from "@/constants/sign-in";

import type { Locale } from "@/i18n/routing";

interface AuthSignInPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

const AuthSignInPage = async ({
  params,
  searchParams,
}: AuthSignInPageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  const cookieStore = await cookies();
  const rememberMe = cookieStore.get(REMEMBER_ME)?.value === "true";

  return (
    <AuthSignIn
      locale={locale}
      redirectTo={safeRedirectTo}
      rememberMe={rememberMe}
    />
  );
};

export default AuthSignInPage;
