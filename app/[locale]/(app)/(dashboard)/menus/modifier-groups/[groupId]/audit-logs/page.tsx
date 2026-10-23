import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ groupId: string }>({
  resolveTarget: ({ groupId }) => ({
    href: `/menus/modifier-groups/${groupId}/audit-logs`,
    resourceId: groupId,
  }),
  resource: "modifierGroup",
});
