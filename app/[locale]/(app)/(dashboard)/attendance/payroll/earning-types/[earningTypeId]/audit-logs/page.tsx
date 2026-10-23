import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ earningTypeId: string }>({
  resolveTarget: ({ earningTypeId }) => ({
    href: `/attendance/payroll/earning-types/${earningTypeId}/audit-logs`,
    resourceId: earningTypeId,
  }),
  resource: "earningType",
});
