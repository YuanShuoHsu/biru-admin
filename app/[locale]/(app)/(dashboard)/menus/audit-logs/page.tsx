import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

import { getResolvedAdminOrganizationMenu } from "@/utils/menus";

interface MenuAuditLogsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: MenuAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const MenuAuditLogsPage = async ({
  params,
  searchParams,
}: MenuAuditLogsPageProps) => {
  const [cookieStore, { locale }, query] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const { menu } = await getResolvedAdminOrganizationMenu(query.organization, {
    headers: { cookie: cookieStore.toString() },
  });

  if (!menu) notFound();

  return (
    <AuditLogsPage
      href="/menus/audit-logs"
      locale={locale}
      resource="menu"
      resourceId={menu.id}
      searchParams={query}
    />
  );
};

export default MenuAuditLogsPage;
