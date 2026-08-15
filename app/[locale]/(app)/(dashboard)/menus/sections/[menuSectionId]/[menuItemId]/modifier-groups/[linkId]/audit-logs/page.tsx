import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const MenuItemModifierGroupAuditLogsPage = async ({
  params,
  searchParams,
}: MenuItemModifierGroupAuditLogsPageProps) => {
  const [{ locale, linkId, menuItemId, menuSectionId }, query] =
    await Promise.all([params, searchParams]);

  setRequestLocale(locale);

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

export default MenuItemModifierGroupAuditLogsPage;
