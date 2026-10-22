import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface PayslipAuditLogsPageProps {
  params: Promise<{ statementId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: PayslipAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const PayslipAuditLogsContent = async ({
  params,
  searchParams,
}: PayslipAuditLogsPageProps) => {
  const [{ statementId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/payroll/statements/${statementId}/audit-logs`}
      locale={locale}
      resource="payslip"
      resourceId={statementId}
      searchParams={query}
    />
  );
};

const PayslipAuditLogsPage = (props: PayslipAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="payslip" />}>
    <PayslipAuditLogsContent {...props} />
  </Suspense>
);

export default PayslipAuditLogsPage;
