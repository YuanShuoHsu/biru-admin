import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ employeeId: string }>({
  resolveTarget: ({ employeeId }) => ({
    href: `/attendance/payroll/withholding/${employeeId}/audit-logs`,
    resourceId: employeeId,
  }),
  resource: "taxIdentity",
});
