import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface ModifierGroupAuditLogsPageProps {
  params: Promise<{ locale: Locale; groupId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: ModifierGroupAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const ModifierGroupAuditLogsContent = async ({
  params,
  searchParams,
}: ModifierGroupAuditLogsPageProps) => {
  const [{ locale, groupId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/menus/modifier-groups/${groupId}/audit-logs`}
      locale={locale}
      resource="modifierGroup"
      resourceId={groupId}
      searchParams={query}
    />
  );
};

const ModifierGroupAuditLogsPage = (props: ModifierGroupAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="modifierGroup" />}>
    <ModifierGroupAuditLogsContent {...props} />
  </Suspense>
);

export default ModifierGroupAuditLogsPage;
