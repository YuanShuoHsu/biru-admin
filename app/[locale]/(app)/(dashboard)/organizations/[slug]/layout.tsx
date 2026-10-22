import { cookies } from "next/headers";

import OrganizationsSlugTabs from "./OrganizationsSlugTabs";

import { authClient } from "@/lib/auth-client";

import { CountStoreProvider } from "@/providers/count-store-provider";

interface OrganizationsSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}

const getPendingInvitationCount = async (
  params: OrganizationsSlugLayoutProps["params"],
) => {
  const [cookieStore, { slug }] = await Promise.all([cookies(), params]);

  const { data } = await authClient.organization.getFullOrganization({
    query: { organizationSlug: decodeURIComponent(slug) },
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  return (
    data?.invitations.filter(({ status }) => status === "pending").length ?? 0
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
