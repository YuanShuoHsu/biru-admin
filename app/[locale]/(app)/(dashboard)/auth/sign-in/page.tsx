import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import AuthSignIn from ".";

import { REMEMBER_ME } from "@/constants/sign-in";

import type { Locale } from "@/i18n/routing";

interface AuthSignInPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export const generateMetadata = async ({
  params,
}: AuthSignInPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAuth = await getTranslations({ locale, namespace: "auth" });

  return { title: tAuth("signIn.label") };
};

const AuthSignInPage = async ({ searchParams }: AuthSignInPageProps) => {
  const { redirectTo } = await searchParams;

  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  const cookieStore = await cookies();
  const rememberMe = cookieStore.get(REMEMBER_ME)?.value === "true";

  return <AuthSignIn redirectTo={safeRedirectTo} rememberMe={rememberMe} />;
};

export default AuthSignInPage;
