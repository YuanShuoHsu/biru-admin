import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface ParentalReturnAuditLogsPageProps {
  params: Promise<{ parentalReturnId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: ParentalReturnAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const ParentalReturnAuditLogsContent = async ({
  params,
  searchParams,
}: ParentalReturnAuditLogsPageProps) => {
  const [{ parentalReturnId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/leave/parental-returns/${parentalReturnId}/audit-logs`}
      locale={locale}
      resource="parentalReturn"
      resourceId={parentalReturnId}
      searchParams={query}
    />
  );
};

const ParentalReturnAuditLogsPage = (
  props: ParentalReturnAuditLogsPageProps,
) => (
  <Suspense fallback={<AuditLogs loading resource="parentalReturn" />}>
    <ParentalReturnAuditLogsContent {...props} />
  </Suspense>
);

export default ParentalReturnAuditLogsPage;
