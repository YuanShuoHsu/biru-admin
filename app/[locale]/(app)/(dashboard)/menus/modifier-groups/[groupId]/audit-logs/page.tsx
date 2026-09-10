import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface ModifierGroupAuditLogsPageProps {
  params: Promise<{ locale: Locale; groupId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: ModifierGroupAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const ModifierGroupAuditLogsPage = async ({
  params,
  searchParams,
}: ModifierGroupAuditLogsPageProps) => {
  const [{ locale, groupId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      href={`/menus/modifier-groups/${groupId}/audit-logs`}
      locale={locale}
      resource="modifierGroup"
      resourceId={groupId}
      searchParams={query}
    />
  );
};

export default ModifierGroupAuditLogsPage;
