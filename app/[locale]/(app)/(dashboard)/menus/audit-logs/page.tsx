import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

import { getResolvedAdminOrganizationMenu } from "@/utils/session";

interface MenuAuditLogsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: MenuAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const MenuAuditLogsContent = async ({
  params,
  searchParams,
}: MenuAuditLogsPageProps) => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);

  const { menu } = await getResolvedAdminOrganizationMenu(query.organization);
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

const MenuAuditLogsPage = (props: MenuAuditLogsPageProps) => (
  <Suspense fallback={<AuditLogs loading resource="menu" />}>
    <MenuAuditLogsContent {...props} />
  </Suspense>
);

export default MenuAuditLogsPage;
