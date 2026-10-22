import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface LeaveTypeAuditLogsPageProps {
  params: Promise<{ leaveTypeId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: LeaveTypeAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const LeaveTypeAuditLogsContent = async ({
  params,
  searchParams,
}: LeaveTypeAuditLogsPageProps) => {
  const [{ leaveTypeId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/leave/leave-types/${leaveTypeId}/audit-logs`}
      locale={locale}
      resource="leaveType"
      resourceId={leaveTypeId}
      searchParams={query}
    />
  );
};

const LeaveTypeAuditLogsPage = (props: LeaveTypeAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="leaveType" />}>
    <LeaveTypeAuditLogsContent {...props} />
  </Suspense>
);

export default LeaveTypeAuditLogsPage;
