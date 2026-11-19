import OrganizationsSlugTabs from "./OrganizationsSlugTabs";

import { CountStoreProvider } from "@/providers/count-store-provider";

import { isActiveSession } from "@/utils/auth";
import { settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

interface OrganizationsSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}

const getPendingInvitationCount = async (
  params: OrganizationsSlugLayoutProps["params"],
) => {
  const { slug } = await params;

  const { data } = await settle(getFullOrganization(decodeURIComponent(slug)));

  return (
    data?.invitations.filter(
      (invitation) =>
        invitation.status === "pending" && isActiveSession(invitation),
    ).length ?? 0
  );
};

const getTabAccess = async (params: OrganizationsSlugLayoutProps["params"]) => {
  const { slug } = await params;

  const [{ data }, session] = await Promise.all([
    settle(getFullOrganization(decodeURIComponent(slug))),
    getSession(),
  ]);

  const currentUserRole = data?.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;
  const isPlatformAdmin = session?.user?.role === "admin";

  return {
    canReadWaitlistSetting:
      isPlatformAdmin ||
      hasRolePermission(currentUserRole, { waitlistSetting: ["read"] }),
    canUpdateOrganization:
      isPlatformAdmin ||
      hasRolePermission(currentUserRole, { organization: ["update"] }),
  };
};

const OrganizationsSlugLayout = ({
  children,
  params,
}: OrganizationsSlugLayoutProps) => (
  <CountStoreProvider>
    <OrganizationsSlugTabs
      pendingInvitationCount={getPendingInvitationCount(params)}
      tabAccess={getTabAccess(params)}
    >
      {children}
    </OrganizationsSlugTabs>
  </CountStoreProvider>
);

export default OrganizationsSlugLayout;
