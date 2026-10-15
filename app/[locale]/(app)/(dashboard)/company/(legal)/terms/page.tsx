import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import CompanyLegalTerms from ".";

import BackButton from "@/components/BackButton";

import { buildMetadata } from "@/utils/metadata";

interface CompanyLegalTermsPageProps {
  searchParams: Promise<{ back?: string; redirectTo?: string }>;
}

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, tCompany, tMetadata] = await Promise.all([
    getLocale(),
    getTranslations("company"),
    getTranslations("metadata"),
  ]);

  return buildMetadata({
    description: tMetadata("terms.description"),
    locale,
    pathname: "/company/terms",
    title: tCompany("legal.terms.label"),
  });
};

const CompanyLegalTermsPage = async ({
  searchParams,
}: CompanyLegalTermsPageProps) => {
  const [locale, { back, redirectTo }] = await Promise.all([
    getLocale(),
    searchParams,
  ]);

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
