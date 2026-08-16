import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface PlatformAuditLogsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: PlatformAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("audit.platformTitle") };
};

const PlatformAuditLogsPage = async ({
  params,
  searchParams,
}: PlatformAuditLogsPageProps) => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      href="/platform-audit-logs"
      locale={locale}
      platform
      searchParams={query}
    />
  );
};

export default PlatformAuditLogsPage;
