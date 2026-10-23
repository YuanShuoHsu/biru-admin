import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ employeeId: string }>({
  resolveTarget: ({ employeeId }) => ({
    href: `/attendance/settings/employees/${employeeId}/audit-logs`,
    resourceId: employeeId,
  }),
  resource: "employee",
});
