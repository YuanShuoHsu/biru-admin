import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ orderId: string }>({
  resolveTarget: ({ orderId }) => ({
    href: `/orders/list/${orderId}/audit-logs`,
    resourceId: orderId,
  }),
  resource: "order",
});
