import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface SupplierAuditLogsPageProps {
  params: Promise<{ locale: Locale; supplierId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: SupplierAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const SupplierAuditLogsContent = async ({
  params,
  searchParams,
}: SupplierAuditLogsPageProps) => {
  const [{ locale, supplierId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/inventory/suppliers/${supplierId}/audit-logs`}
      locale={locale}
      resource="supplier"
      resourceId={supplierId}
      searchParams={query}
    />
  );
};

const SupplierAuditLogsPage = (props: SupplierAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="supplier" />}>
    <SupplierAuditLogsContent {...props} />
  </Suspense>
);

export default SupplierAuditLogsPage;
