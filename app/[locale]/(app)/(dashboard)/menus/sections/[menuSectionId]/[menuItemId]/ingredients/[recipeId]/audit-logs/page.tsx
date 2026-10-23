import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{
  menuItemId: string;
  menuSectionId: string;
  recipeId: string;
}>({
  resolveTarget: ({ menuItemId, menuSectionId, recipeId }) => ({
    href: `/menus/sections/${menuSectionId}/${menuItemId}/ingredients/${recipeId}/audit-logs`,
    resourceId: recipeId,
  }),
  resource: "recipe",
});
