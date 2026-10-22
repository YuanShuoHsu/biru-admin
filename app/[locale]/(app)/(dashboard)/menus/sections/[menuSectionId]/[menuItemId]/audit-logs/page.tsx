import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface MenuItemAuditLogsPageProps {
  params: Promise<{
    locale: Locale;
    menuItemId: string;
    menuSectionId: string;
  }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: MenuItemAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const MenuItemAuditLogsContent = async ({
  params,
  searchParams,
}: MenuItemAuditLogsPageProps) => {
  const [{ locale, menuItemId, menuSectionId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <AuditLogsPage
      href={`/menus/sections/${menuSectionId}/${menuItemId}/audit-logs`}
      locale={locale}
      resource="menuItem"
      resourceId={menuItemId}
      searchParams={query}
    />
  );
};

const MenuItemAuditLogsPage = (props: MenuItemAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="menuItem" />}>
    <MenuItemAuditLogsContent {...props} />
  </Suspense>
);

export default MenuItemAuditLogsPage;
