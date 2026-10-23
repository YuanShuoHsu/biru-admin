import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage({
  adminScope: true,
  resolveTarget: () => ({ href: "/audit-logs" }),
});
