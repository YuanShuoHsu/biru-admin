import { setRequestLocale } from "next-intl/server";

import CompanyLegalTerms from ".";

import BackButton from "@/components/BackButton";

import type { Locale } from "@/i18n/routing";

interface CompanyLegalTermsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ back?: string; redirectTo?: string }>;
}

const CompanyLegalTermsPage = async ({
  params,
  searchParams,
}: CompanyLegalTermsPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  const { back, redirectTo } = await searchParams;

  const safeBack =
    typeof back === "string" && back.startsWith("/") ? back : "/";
  const safeRedirectTo =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : undefined;

  return (
    <>
      <BackButton back={safeBack} redirectTo={safeRedirectTo} />
      <CompanyLegalTerms locale={locale} />
    </>
  );
};

export default CompanyLegalTermsPage;
