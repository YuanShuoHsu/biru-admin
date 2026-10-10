import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuthNoAccess from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getSession } from "@/utils/session";

interface AuthNoAccessPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirectTo?: string }>;
}

export const generateMetadata = async ({
  params,
}: AuthNoAccessPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAuth = await getTranslations({ locale, namespace: "auth" });

  return { title: tAuth("noAccess.label") };
};

const AuthNoAccessPage = async ({
  params,
  searchParams,
}: AuthNoAccessPageProps) => {
  const [{ locale }, { redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  const session = await getSession();

  if (!session) return redirect({ href: "/auth/sign-in", locale });

  return (
    <AuthNoAccess email={session.user.email} redirectTo={safeRedirectTo} />
  );
};

export default AuthNoAccessPage;
