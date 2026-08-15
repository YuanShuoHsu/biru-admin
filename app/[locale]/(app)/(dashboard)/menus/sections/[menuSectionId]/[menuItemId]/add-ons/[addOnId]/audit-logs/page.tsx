import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const MenuItemAddOnAuditLogsPage = async ({
  params,
  searchParams,
}: MenuItemAddOnAuditLogsPageProps) => {
  const [{ locale, addOnId, menuItemId, menuSectionId }, query] =
    await Promise.all([params, searchParams]);

  setRequestLocale(locale);

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

export default MenuItemAddOnAuditLogsPage;
