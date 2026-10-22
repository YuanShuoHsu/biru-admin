import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
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

const WaitlistTicketAuditLogsContent = async ({
  params,
  searchParams,
}: WaitlistTicketAuditLogsPageProps) => {
  const [{ locale, ticketId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

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

const WaitlistTicketAuditLogsPage = (
  props: WaitlistTicketAuditLogsPageProps,
) => (
  <Suspense fallback={<AuditLogs loading resource="waitlistTicket" />}>
    <WaitlistTicketAuditLogsContent {...props} />
  </Suspense>
);

export default WaitlistTicketAuditLogsPage;
