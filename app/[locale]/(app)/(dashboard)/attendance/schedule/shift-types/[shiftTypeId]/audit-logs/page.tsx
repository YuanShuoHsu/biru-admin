import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ shiftTypeId: string }>({
  resolveTarget: ({ shiftTypeId }) => ({
    href: `/attendance/schedule/shift-types/${shiftTypeId}/audit-logs`,
    resourceId: shiftTypeId,
  }),
  resource: "shiftType",
});
