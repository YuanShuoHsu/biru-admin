import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface OrderAuditLogsPageProps {
  params: Promise<{ locale: Locale; orderId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: OrderAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const OrderAuditLogsPage = async ({
  params,
  searchParams,
}: OrderAuditLogsPageProps) => {
  const [{ locale, orderId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      href={`/orders/list/${orderId}/audit-logs`}
      locale={locale}
      resource="order"
      resourceId={orderId}
      searchParams={query}
    />
  );
};

export default OrderAuditLogsPage;
