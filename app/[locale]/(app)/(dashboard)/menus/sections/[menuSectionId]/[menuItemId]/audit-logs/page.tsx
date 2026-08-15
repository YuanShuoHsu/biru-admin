import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const MenuItemAuditLogsPage = async ({
  params,
  searchParams,
}: MenuItemAuditLogsPageProps) => {
  const [{ locale, menuItemId, menuSectionId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

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

export default MenuItemAuditLogsPage;
