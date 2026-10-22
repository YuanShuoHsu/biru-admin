import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface MenuItemModifierGroupAuditLogsPageProps {
  params: Promise<{
    locale: Locale;
    linkId: string;
    menuItemId: string;
    menuSectionId: string;
  }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: MenuItemModifierGroupAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const MenuItemModifierGroupAuditLogsContent = async ({
  params,
  searchParams,
}: MenuItemModifierGroupAuditLogsPageProps) => {
  const [{ locale, linkId, menuItemId, menuSectionId }, query] =
    await Promise.all([params, searchParams]);

  return (
    <AuditLogsPage
      href={`/menus/sections/${menuSectionId}/${menuItemId}/modifier-groups/${linkId}/audit-logs`}
      locale={locale}
      resource="menuItemModifierGroup"
      resourceId={linkId}
      searchParams={query}
    />
  );
};

const MenuItemModifierGroupAuditLogsPage = (
  props: MenuItemModifierGroupAuditLogsPageProps,
) => (
  <Suspense fallback={<AuditLogs loading resource="menuItemModifierGroup" />}>
    <MenuItemModifierGroupAuditLogsContent {...props} />
  </Suspense>
);

export default MenuItemModifierGroupAuditLogsPage;
