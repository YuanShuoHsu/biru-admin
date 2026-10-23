import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ leaveTypeId: string }>({
  resolveTarget: ({ leaveTypeId }) => ({
    href: `/attendance/leave/leave-types/${leaveTypeId}/audit-logs`,
    resourceId: leaveTypeId,
  }),
  resource: "leaveType",
});
