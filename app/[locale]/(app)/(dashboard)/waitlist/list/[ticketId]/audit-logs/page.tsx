import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ ticketId: string }>({
  resolveTarget: ({ ticketId }) => ({
    href: `/waitlist/list/${ticketId}/audit-logs`,
    resourceId: ticketId,
  }),
  resource: "waitlistTicket",
});
