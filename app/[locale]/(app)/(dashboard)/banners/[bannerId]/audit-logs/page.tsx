import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface BannerAuditLogsPageProps {
  params: Promise<{ bannerId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: BannerAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const BannerAuditLogsPage = async ({
  params,
  searchParams,
}: BannerAuditLogsPageProps) => {
  const [{ bannerId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      adminScope
      href={`/banners/${bannerId}/audit-logs`}
      locale={locale}
      resource="banner"
      resourceId={bannerId}
      searchParams={query}
    />
  );
};

export default BannerAuditLogsPage;
