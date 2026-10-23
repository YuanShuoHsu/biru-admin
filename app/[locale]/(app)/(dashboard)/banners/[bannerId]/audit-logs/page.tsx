import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ bannerId: string }>({
  adminScope: true,
  resolveTarget: ({ bannerId }) => ({
    href: `/banners/${bannerId}/audit-logs`,
    resourceId: bannerId,
  }),
  resource: "banner",
});
