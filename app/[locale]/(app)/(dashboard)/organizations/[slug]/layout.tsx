import OrganizationsSlugTabs from "./OrganizationsSlugTabs";

import { CountStoreProvider } from "@/providers/count-store-provider";

import { isActiveSession } from "@/utils/auth";
import { settle } from "@/utils/fetcher";
import { getApiMemberRole } from "@/utils/organizations";
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

const OrganizationsSlugLayout = async ({
  children,
  params,
}: OrganizationsSlugLayoutProps) => {
  const { slug } = await params;

  const [{ data }, session] = await Promise.all([
    settle(getFullOrganization(decodeURIComponent(slug))),
    getSession(),
  ]);

  const currentUserRole = getApiMemberRole(
    data?.members.find(({ userId }) => userId === session?.user?.id)?.role,
    session?.user?.role,
  );

  return (
    <CountStoreProvider>
      <OrganizationsSlugTabs
        currentUserRole={currentUserRole}
        pendingInvitationCount={getPendingInvitationCount(params)}
      >
        {children}
      </OrganizationsSlugTabs>
    </CountStoreProvider>
  );
};

export default OrganizationsSlugLayout;
