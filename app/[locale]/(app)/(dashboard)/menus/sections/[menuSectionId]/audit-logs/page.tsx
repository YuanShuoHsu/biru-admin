import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ menuSectionId: string }>({
  resolveTarget: ({ menuSectionId }) => ({
    href: `/menus/sections/${menuSectionId}/audit-logs`,
    resourceId: menuSectionId,
  }),
  resource: "menuSection",
});
