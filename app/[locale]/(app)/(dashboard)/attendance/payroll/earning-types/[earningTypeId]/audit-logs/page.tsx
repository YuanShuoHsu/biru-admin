import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface EarningTypeAuditLogsPageProps {
  params: Promise<{ earningTypeId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: EarningTypeAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const EarningTypeAuditLogsContent = async ({
  params,
  searchParams,
}: EarningTypeAuditLogsPageProps) => {
  const [{ earningTypeId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/payroll/earning-types/${earningTypeId}/audit-logs`}
      locale={locale}
      resource="earningType"
      resourceId={earningTypeId}
      searchParams={query}
    />
  );
};

const EarningTypeAuditLogsPage = (props: EarningTypeAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="earningType" />}>
    <EarningTypeAuditLogsContent {...props} />
  </Suspense>
);

export default EarningTypeAuditLogsPage;
