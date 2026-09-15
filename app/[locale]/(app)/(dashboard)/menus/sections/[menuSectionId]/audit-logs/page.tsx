import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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

const MenuSectionAuditLogsPage = async ({
  params,
  searchParams,
}: MenuSectionAuditLogsPageProps) => {
  const [{ locale, menuSectionId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

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

export default MenuSectionAuditLogsPage;
