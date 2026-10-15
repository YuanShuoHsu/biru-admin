import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import CompanyLegalPrivacy from ".";

import BackButton from "@/components/BackButton";

import { buildMetadata } from "@/utils/metadata";

interface CompanyLegalPrivacyPageProps {
  searchParams: Promise<{ back?: string; redirectTo?: string }>;
}

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, tCompany, tMetadata] = await Promise.all([
    getLocale(),
    getTranslations("company"),
    getTranslations("metadata"),
  ]);

  return buildMetadata({
    description: tMetadata("privacy.description"),
    locale,
    pathname: "/company/privacy",
    title: tCompany("legal.privacy.label"),
  });
};

const CompanyLegalPrivacyPage = async ({
  searchParams,
}: CompanyLegalPrivacyPageProps) => {
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
      <CompanyLegalPrivacy locale={locale} />
    </>
  );
};

export default CompanyLegalPrivacyPage;
