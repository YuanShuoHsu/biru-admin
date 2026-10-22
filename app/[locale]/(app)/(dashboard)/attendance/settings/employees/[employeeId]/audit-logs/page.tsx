import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface EmployeeAuditLogsPageProps {
  params: Promise<{ employeeId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: EmployeeAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const EmployeeAuditLogsContent = async ({
  params,
  searchParams,
}: EmployeeAuditLogsPageProps) => {
  const [{ employeeId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/settings/employees/${employeeId}/audit-logs`}
      locale={locale}
      resource="employee"
      resourceId={employeeId}
      searchParams={query}
    />
  );
};

const EmployeeAuditLogsPage = (props: EmployeeAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="employee" />}>
    <EmployeeAuditLogsContent {...props} />
  </Suspense>
);

export default EmployeeAuditLogsPage;
