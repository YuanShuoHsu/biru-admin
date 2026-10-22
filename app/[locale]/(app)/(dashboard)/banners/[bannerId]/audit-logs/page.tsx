import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
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
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const BannerAuditLogsContent = async ({
  params,
  searchParams,
}: BannerAuditLogsPageProps) => {
  const [{ bannerId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

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

const BannerAuditLogsPage = (props: BannerAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="banner" />}>
    <BannerAuditLogsContent {...props} />
  </Suspense>
);

export default BannerAuditLogsPage;
