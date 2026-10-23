import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ parentalReturnId: string }>({
  resolveTarget: ({ parentalReturnId }) => ({
    href: `/attendance/leave/parental-returns/${parentalReturnId}/audit-logs`,
    resourceId: parentalReturnId,
  }),
  resource: "parentalReturn",
});
