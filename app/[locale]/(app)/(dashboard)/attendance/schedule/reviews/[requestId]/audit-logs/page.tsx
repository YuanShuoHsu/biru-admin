import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface AttendanceRequestAuditLogsPageProps {
  params: Promise<{ requestId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: AttendanceRequestAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const AttendanceRequestAuditLogsContent = async ({
  params,
  searchParams,
}: AttendanceRequestAuditLogsPageProps) => {
  const [{ requestId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/schedule/reviews/${requestId}/audit-logs`}
      locale={locale}
      resource="attendanceRequest"
      resourceId={requestId}
      searchParams={query}
    />
  );
};

const AttendanceRequestAuditLogsPage = (
  props: AttendanceRequestAuditLogsPageProps,
) => (
  <Suspense fallback={<AuditLogs loading resource="attendanceRequest" />}>
    <AttendanceRequestAuditLogsContent {...props} />
  </Suspense>
);

export default AttendanceRequestAuditLogsPage;
