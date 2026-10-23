import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ substituteId: string }>({
  resolveTarget: ({ substituteId }) => ({
    href: `/attendance/schedule/holiday-substitutes/${substituteId}/audit-logs`,
    resourceId: substituteId,
  }),
  resource: "holidaySubstitute",
});
