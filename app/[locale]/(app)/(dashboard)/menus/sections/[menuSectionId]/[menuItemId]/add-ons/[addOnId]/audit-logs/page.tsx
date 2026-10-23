import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{
  addOnId: string;
  menuItemId: string;
  menuSectionId: string;
}>({
  resolveTarget: ({ addOnId, menuItemId, menuSectionId }) => ({
    href: `/menus/sections/${menuSectionId}/${menuItemId}/add-ons/${addOnId}/audit-logs`,
    resourceId: addOnId,
  }),
  resource: "menuItemAddOn",
});
