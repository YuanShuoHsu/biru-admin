import OrganizationsSlugTabs from "./OrganizationsSlugTabs";

import { CountStoreProvider } from "@/providers/count-store-provider";

import { isActiveSession } from "@/utils/auth";
import { getFullOrganization } from "@/utils/session";

interface OrganizationsSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}

const getPendingInvitationCount = async (
  params: OrganizationsSlugLayoutProps["params"],
) => {
  const { slug } = await params;

  const data = await getFullOrganization(decodeURIComponent(slug));

  return (
    data?.invitations.filter(
      (invitation) =>
        invitation.status === "pending" && isActiveSession(invitation),
    ).length ?? 0
  );
};

const OrganizationsSlugLayout = ({
  children,
  params,
}: OrganizationsSlugLayoutProps) => (
  <CountStoreProvider>
    <OrganizationsSlugTabs
      pendingInvitationCount={getPendingInvitationCount(params)}
    >
      {children}
    </OrganizationsSlugTabs>
  </CountStoreProvider>
);

export default OrganizationsSlugLayout;
