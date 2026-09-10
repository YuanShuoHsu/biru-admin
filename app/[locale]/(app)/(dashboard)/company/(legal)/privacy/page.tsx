import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import CompanyLegalPrivacy from ".";

import BackButton from "@/components/BackButton";

import type { Locale } from "@/i18n/routing";

import { buildMetadata } from "@/utils/metadata";

interface CompanyLegalPrivacyPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ back?: string; redirectTo?: string }>;
}

export const generateMetadata = async ({
  params,
}: CompanyLegalPrivacyPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return buildMetadata({
    description: t("metadata.privacy.description"),
    locale,
    pathname: "/company/privacy",
    title: t("company.legal.privacy.label"),
  });
};

const CompanyLegalPrivacyPage = async ({
  params,
  searchParams,
}: CompanyLegalPrivacyPageProps) => {
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
      <CompanyLegalPrivacy locale={locale} />
    </>
  );
};

export default CompanyLegalPrivacyPage;
