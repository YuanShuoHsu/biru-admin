import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ recipeId: string }>({
  resolveTarget: ({ recipeId }) => ({
    href: `/inventory/recipes/${recipeId}/audit-logs`,
    resourceId: recipeId,
  }),
  resource: "recipe",
});
