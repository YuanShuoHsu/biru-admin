import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ statementId: string }>({
  resolveTarget: ({ statementId }) => ({
    href: `/attendance/payroll/statements/${statementId}/audit-logs`,
    resourceId: statementId,
  }),
  resource: "payslip",
});
