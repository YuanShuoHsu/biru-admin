import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface CouponAuditLogsPageProps {
  params: Promise<{ couponId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: CouponAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const CouponAuditLogsContent = async ({
  params,
  searchParams,
}: CouponAuditLogsPageProps) => {
  const [{ couponId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      ancestorId={couponId}
      href={`/coupons/${couponId}/audit-logs`}
      locale={locale}
      resource="userCoupon"
      searchParams={query}
    />
  );
};

const CouponAuditLogsPage = (props: CouponAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="userCoupon" />}>
    <CouponAuditLogsContent {...props} />
  </Suspense>
);

export default CouponAuditLogsPage;
