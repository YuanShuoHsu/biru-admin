import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ requestId: string }>({
  resolveTarget: ({ requestId }) => ({
    href: `/attendance/schedule/reviews/${requestId}/audit-logs`,
    resourceId: requestId,
  }),
  resource: "attendanceRequest",
});
