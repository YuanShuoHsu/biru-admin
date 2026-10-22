import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface MenuSectionAuditLogsPageProps {
  params: Promise<{ locale: Locale; menuSectionId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: MenuSectionAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const MenuSectionAuditLogsContent = async ({
  params,
  searchParams,
}: MenuSectionAuditLogsPageProps) => {
  const [{ locale, menuSectionId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/menus/sections/${menuSectionId}/audit-logs`}
      locale={locale}
      resource="menuSection"
      resourceId={menuSectionId}
      searchParams={query}
    />
  );
};

const MenuSectionAuditLogsPage = (props: MenuSectionAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="menuSection" />}>
    <MenuSectionAuditLogsContent {...props} />
  </Suspense>
);

export default MenuSectionAuditLogsPage;
