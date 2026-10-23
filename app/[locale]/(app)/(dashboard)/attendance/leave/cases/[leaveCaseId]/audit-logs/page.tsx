import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ leaveCaseId: string }>({
  resolveTarget: ({ leaveCaseId }) => ({
    href: `/attendance/leave/cases/${leaveCaseId}/audit-logs`,
    resourceId: leaveCaseId,
  }),
  resource: "leaveCase",
});
