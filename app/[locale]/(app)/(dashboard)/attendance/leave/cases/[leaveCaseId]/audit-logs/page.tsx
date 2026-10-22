import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface LeaveCaseAuditLogsPageProps {
  params: Promise<{ leaveCaseId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: LeaveCaseAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const LeaveCaseAuditLogsContent = async ({
  params,
  searchParams,
}: LeaveCaseAuditLogsPageProps) => {
  const [{ leaveCaseId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/leave/cases/${leaveCaseId}/audit-logs`}
      locale={locale}
      resource="leaveCase"
      resourceId={leaveCaseId}
      searchParams={query}
    />
  );
};

const LeaveCaseAuditLogsPage = (props: LeaveCaseAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="leaveCase" />}>
    <LeaveCaseAuditLogsContent {...props} />
  </Suspense>
);

export default LeaveCaseAuditLogsPage;
