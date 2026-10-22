import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface MenuItemAddOnAuditLogsPageProps {
  params: Promise<{
    locale: Locale;
    addOnId: string;
    menuItemId: string;
    menuSectionId: string;
  }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: MenuItemAddOnAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const MenuItemAddOnAuditLogsContent = async ({
  params,
  searchParams,
}: MenuItemAddOnAuditLogsPageProps) => {
  const [{ locale, addOnId, menuItemId, menuSectionId }, query] =
    await Promise.all([params, searchParams]);

  return (
    <AuditLogsPage
      href={`/menus/sections/${menuSectionId}/${menuItemId}/add-ons/${addOnId}/audit-logs`}
      locale={locale}
      resource="menuItemAddOn"
      resourceId={addOnId}
      searchParams={query}
    />
  );
};

const MenuItemAddOnAuditLogsPage = (props: MenuItemAddOnAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="menuItemAddOn" />}>
    <MenuItemAddOnAuditLogsContent {...props} />
  </Suspense>
);

export default MenuItemAddOnAuditLogsPage;
