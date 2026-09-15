import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface OrganizationAuditLogsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: OrganizationAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const OrganizationAuditLogsPage = async ({
  params,
  searchParams,
}: OrganizationAuditLogsPageProps) => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      adminScope
      href="/audit-logs"
      locale={locale}
      searchParams={query}
    />
  );
};

export default OrganizationAuditLogsPage;
