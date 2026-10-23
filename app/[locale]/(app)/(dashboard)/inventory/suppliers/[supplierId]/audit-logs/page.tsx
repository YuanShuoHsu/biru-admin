import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ supplierId: string }>({
  resolveTarget: ({ supplierId }) => ({
    href: `/inventory/suppliers/${supplierId}/audit-logs`,
    resourceId: supplierId,
  }),
  resource: "supplier",
});
