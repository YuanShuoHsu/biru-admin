import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface ShiftTypeAuditLogsPageProps {
  params: Promise<{ shiftTypeId: string; locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: ShiftTypeAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const ShiftTypeAuditLogsContent = async ({
  params,
  searchParams,
}: ShiftTypeAuditLogsPageProps) => {
  const [{ shiftTypeId, locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/attendance/schedule/shift-types/${shiftTypeId}/audit-logs`}
      locale={locale}
      resource="shiftType"
      resourceId={shiftTypeId}
      searchParams={query}
    />
  );
};

const ShiftTypeAuditLogsPage = (props: ShiftTypeAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="shiftType" />}>
    <ShiftTypeAuditLogsContent {...props} />
  </Suspense>
);

export default ShiftTypeAuditLogsPage;
