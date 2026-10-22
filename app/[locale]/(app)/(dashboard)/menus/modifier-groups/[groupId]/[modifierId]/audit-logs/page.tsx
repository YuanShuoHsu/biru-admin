import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface ModifierAuditLogsPageProps {
  params: Promise<{ locale: Locale; groupId: string; modifierId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: ModifierAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const ModifierAuditLogsContent = async ({
  params,
  searchParams,
}: ModifierAuditLogsPageProps) => {
  const [{ locale, groupId, modifierId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/menus/modifier-groups/${groupId}/${modifierId}/audit-logs`}
      locale={locale}
      resource="modifier"
      resourceId={modifierId}
      searchParams={query}
    />
  );
};

const ModifierAuditLogsPage = (props: ModifierAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="modifier" />}>
    <ModifierAuditLogsContent {...props} />
  </Suspense>
);

export default ModifierAuditLogsPage;
