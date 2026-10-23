import { notFound } from "next/navigation";

import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

import { getResolvedAdminOrganizationMenu } from "@/utils/session";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage({
  resolveTarget: async (_params, { organization }) => {
    const { menu } = await getResolvedAdminOrganizationMenu(organization);
    if (!menu) notFound();

    return { href: "/menus/audit-logs", resourceId: menu.id };
  },
  resource: "menu",
});
