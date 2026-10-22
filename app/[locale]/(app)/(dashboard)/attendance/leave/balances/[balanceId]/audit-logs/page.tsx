import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface LeaveBalanceAuditLogsPageProps {
  params: Promise<{ balanceId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: LeaveBalanceAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const LeaveBalanceAuditLogsContent = async ({
  params,
  searchParams,
}: LeaveBalanceAuditLogsPageProps) => {
  const [{ balanceId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/leave/balances/${balanceId}/audit-logs`}
      locale={locale}
      resource="leaveBalance"
      resourceId={balanceId}
      searchParams={query}
    />
  );
};

const LeaveBalanceAuditLogsPage = (props: LeaveBalanceAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="leaveBalance" />}>
    <LeaveBalanceAuditLogsContent {...props} />
  </Suspense>
);

export default LeaveBalanceAuditLogsPage;
