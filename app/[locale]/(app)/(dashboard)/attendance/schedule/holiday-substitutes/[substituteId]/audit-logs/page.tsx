import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface HolidaySubstituteAuditLogsPageProps {
  params: Promise<{ substituteId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: HolidaySubstituteAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const HolidaySubstituteAuditLogsContent = async ({
  params,
  searchParams,
}: HolidaySubstituteAuditLogsPageProps) => {
  const [{ substituteId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/schedule/holiday-substitutes/${substituteId}/audit-logs`}
      locale={locale}
      resource="holidaySubstitute"
      resourceId={substituteId}
      searchParams={query}
    />
  );
};

const HolidaySubstituteAuditLogsPage = (
  props: HolidaySubstituteAuditLogsPageProps,
) => (
  <Suspense fallback={<AuditLogs loading resource="holidaySubstitute" />}>
    <HolidaySubstituteAuditLogsContent {...props} />
  </Suspense>
);

export default HolidaySubstituteAuditLogsPage;
