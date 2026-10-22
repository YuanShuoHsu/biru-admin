import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
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
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const OrderAuditLogsContent = async ({
  params,
  searchParams,
}: OrderAuditLogsPageProps) => {
  const [{ locale, orderId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

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

const OrderAuditLogsPage = (props: OrderAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="order" />}>
    <OrderAuditLogsContent {...props} />
  </Suspense>
);

export default OrderAuditLogsPage;
