import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const CouponAuditLogsPage = async ({
  params,
  searchParams,
}: CouponAuditLogsPageProps) => {
  const [{ couponId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

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

export default CouponAuditLogsPage;
