import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ operatingCostId: string }>({
  resolveTarget: ({ operatingCostId }) => ({
    href: `/reports/operating-costs/${operatingCostId}/audit-logs`,
    resourceId: operatingCostId,
  }),
  resource: "operatingCost",
});
