import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ shiftId: string }>({
  resolveTarget: ({ shiftId }) => ({
    href: `/attendance/schedule/shifts/${shiftId}/audit-logs`,
    resourceId: shiftId,
  }),
  resource: "shift",
});
