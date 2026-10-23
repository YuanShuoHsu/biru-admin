import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ groupId: string; modifierId: string }>({
  resolveTarget: ({ groupId, modifierId }) => ({
    href: `/menus/modifier-groups/${groupId}/${modifierId}/audit-logs`,
    resourceId: modifierId,
  }),
  resource: "modifier",
});
