import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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

const SupplierAuditLogsPage = async ({
  params,
  searchParams,
}: SupplierAuditLogsPageProps) => {
  const [{ locale, supplierId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

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

export default SupplierAuditLogsPage;
