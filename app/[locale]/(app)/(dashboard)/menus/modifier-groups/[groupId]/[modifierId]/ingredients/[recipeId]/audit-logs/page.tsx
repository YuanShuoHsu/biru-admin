import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{
  groupId: string;
  modifierId: string;
  recipeId: string;
}>({
  resolveTarget: ({ groupId, modifierId, recipeId }) => ({
    href: `/menus/modifier-groups/${groupId}/${modifierId}/ingredients/${recipeId}/audit-logs`,
    resourceId: recipeId,
  }),
  resource: "recipe",
});
