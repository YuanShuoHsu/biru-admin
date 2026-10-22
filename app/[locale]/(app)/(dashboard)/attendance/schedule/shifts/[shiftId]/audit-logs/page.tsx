import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface ShiftAuditLogsPageProps {
  params: Promise<{ shiftId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: ShiftAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const ShiftAuditLogsContent = async ({
  params,
  searchParams,
}: ShiftAuditLogsPageProps) => {
  const [{ shiftId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/schedule/shifts/${shiftId}/audit-logs`}
      locale={locale}
      resource="shift"
      resourceId={shiftId}
      searchParams={query}
    />
  );
};

const ShiftAuditLogsPage = (props: ShiftAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="shift" />}>
    <ShiftAuditLogsContent {...props} />
  </Suspense>
);

export default ShiftAuditLogsPage;
