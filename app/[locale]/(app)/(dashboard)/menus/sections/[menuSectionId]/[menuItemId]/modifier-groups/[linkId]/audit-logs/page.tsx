import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{
  linkId: string;
  menuItemId: string;
  menuSectionId: string;
}>({
  resolveTarget: ({ linkId, menuItemId, menuSectionId }) => ({
    href: `/menus/sections/${menuSectionId}/${menuItemId}/modifier-groups/${linkId}/audit-logs`,
    resourceId: linkId,
  }),
  resource: "menuItemModifierGroup",
});
