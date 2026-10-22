import { Suspense } from "react";

import MenuCard from "@/app/[locale]/(app)/(dashboard)/menus/MenuCard";

import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganizationMenu,
} from "@/utils/session";

interface SubheaderMenusSectionsPageProps {
  searchParams: Promise<{ organization?: string }>;
}

const SubheaderMenusSectionsContent = async ({
  searchParams,
}: SubheaderMenusSectionsPageProps) => {
  const { organization: organizationSlug } = await searchParams;

  const { menu } = await getResolvedAdminOrganizationMenu(organizationSlug);
  if (!menu) return null;

  const role = await getMemberRole(menu.organizationId);

  return (
    <MenuCard
      canViewAuditLog={hasRolePermission(role, {
        auditLog: ["read"],
      })}
      canWrite={hasRolePermission(role, { menu: ["update"] })}
      menu={menu}
    />
  );
};

const SubheaderMenusSectionsPage = (props: SubheaderMenusSectionsPageProps) => (
  <Suspense fallback={<MenuCard loading />}>
    <SubheaderMenusSectionsContent {...props} />
  </Suspense>
);

export default SubheaderMenusSectionsPage;
