import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import AuthAcceptInvitation from ".";

import type { Locale } from "@/i18n/routing";

interface AuthAcceptInvitationPageProps {
  params: Promise<{ locale: Locale; token: string }>;
}

const AuthAcceptInvitationPage = async ({
  params,
}: AuthAcceptInvitationPageProps) => {
  const { locale, token } = await params;

  setRequestLocale(locale);

  if (!token) notFound();

  return <AuthAcceptInvitation locale={locale} token={token} />;
};

export default AuthAcceptInvitationPage;
