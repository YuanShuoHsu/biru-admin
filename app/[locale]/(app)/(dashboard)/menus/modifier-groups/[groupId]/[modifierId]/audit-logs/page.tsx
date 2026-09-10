import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface ModifierAuditLogsPageProps {
  params: Promise<{ locale: Locale; groupId: string; modifierId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: ModifierAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("audit.title") };
};

const ModifierAuditLogsPage = async ({
  params,
  searchParams,
}: ModifierAuditLogsPageProps) => {
  const [{ locale, groupId, modifierId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      href={`/menus/modifier-groups/${groupId}/${modifierId}/audit-logs`}
      locale={locale}
      resource="modifier"
      resourceId={modifierId}
      searchParams={query}
    />
  );
};

export default ModifierAuditLogsPage;
