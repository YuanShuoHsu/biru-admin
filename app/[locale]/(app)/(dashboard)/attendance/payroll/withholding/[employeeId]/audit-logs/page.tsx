import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface TaxIdentityAuditLogsPageProps {
  params: Promise<{ employeeId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: TaxIdentityAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const TaxIdentityAuditLogsContent = async ({
  params,
  searchParams,
}: TaxIdentityAuditLogsPageProps) => {
  const [{ employeeId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/payroll/withholding/${employeeId}/audit-logs`}
      locale={locale}
      resource="taxIdentity"
      resourceId={employeeId}
      searchParams={query}
    />
  );
};

const TaxIdentityAuditLogsPage = (props: TaxIdentityAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="taxIdentity" />}>
    <TaxIdentityAuditLogsContent {...props} />
  </Suspense>
);

export default TaxIdentityAuditLogsPage;
