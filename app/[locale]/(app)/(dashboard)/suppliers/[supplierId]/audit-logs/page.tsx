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
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
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
      href={`/suppliers/${supplierId}/audit-logs`}
      locale={locale}
      resource="supplier"
      resourceId={supplierId}
      searchParams={query}
    />
  );
};

export default SupplierAuditLogsPage;
