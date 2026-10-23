import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ balanceId: string }>({
  resolveTarget: ({ balanceId }) => ({
    href: `/attendance/leave/balances/${balanceId}/audit-logs`,
    resourceId: balanceId,
  }),
  resource: "leaveBalance",
});
