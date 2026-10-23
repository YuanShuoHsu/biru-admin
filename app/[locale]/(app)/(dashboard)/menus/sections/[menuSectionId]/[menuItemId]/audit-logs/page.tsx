import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{
  menuItemId: string;
  menuSectionId: string;
}>({
  resolveTarget: ({ menuItemId, menuSectionId }) => ({
    href: `/menus/sections/${menuSectionId}/${menuItemId}/audit-logs`,
    resourceId: menuItemId,
  }),
  resource: "menuItem",
});
