import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugTabs from "./OrganizationsSlugTabs";

import { countKeys } from "@/constants/organizations";

import { authClient } from "@/lib/auth-client";

import { CountStoreProvider } from "@/providers/count-store-provider";

interface OrganizationsSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}

const OrganizationsSlugLayout = async ({
  children,
  params,
}: OrganizationsSlugLayoutProps) => {
  const [cookieStore, { slug }] = await Promise.all([cookies(), params]);

  const { data } = await authClient.organization.getFullOrganization({
    query: { organizationSlug: decodeURIComponent(slug) },
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  if (!data) notFound();

  const pendingInvitationCount = data.invitations.filter(
    ({ status }) => status === "pending",
  ).length;

  return (
    <CountStoreProvider
      initialItems={{ [countKeys.pendingInvitations]: pendingInvitationCount }}
    >
      <OrganizationsSlugTabs>{children}</OrganizationsSlugTabs>
    </CountStoreProvider>
  );
};

export default OrganizationsSlugLayout;
