import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ storePhotoId: string }>({
  adminScope: true,
  resolveTarget: ({ storePhotoId }) => ({
    href: `/store-photos/${storePhotoId}/audit-logs`,
    resourceId: storePhotoId,
  }),
  resource: "storePhoto",
});
