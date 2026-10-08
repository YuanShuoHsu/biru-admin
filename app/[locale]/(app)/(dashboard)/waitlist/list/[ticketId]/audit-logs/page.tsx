import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AuditLogsPage, {
  type AuditLogSearchParams,
} from "@/components/AuditLogsPage";

import type { Locale } from "@/i18n/routing";

interface WaitlistTicketAuditLogsPageProps {
  params: Promise<{ locale: Locale; ticketId: string }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateMetadata = async ({
  params,
}: WaitlistTicketAuditLogsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

const WaitlistTicketAuditLogsPage = async ({
  params,
  searchParams,
}: WaitlistTicketAuditLogsPageProps) => {
  const [{ locale, ticketId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  return (
    <AuditLogsPage
      href={`/waitlist/list/${ticketId}/audit-logs`}
      locale={locale}
      resource="waitlistTicket"
      resourceId={ticketId}
      searchParams={query}
    />
  );
};

export default WaitlistTicketAuditLogsPage;
