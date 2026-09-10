import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import CompanyLegalTerms from ".";

import BackButton from "@/components/BackButton";

import type { Locale } from "@/i18n/routing";

import { buildMetadata } from "@/utils/metadata";

interface CompanyLegalTermsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ back?: string; redirectTo?: string }>;
}

export const generateMetadata = async ({
  params,
}: CompanyLegalTermsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return buildMetadata({
    description: t("metadata.terms.description"),
    locale,
    pathname: "/company/terms",
    title: t("company.legal.terms.label"),
  });
};

const CompanyLegalTermsPage = async ({
  params,
  searchParams,
}: CompanyLegalTermsPageProps) => {
  const [{ locale }, { back, redirectTo }] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

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
