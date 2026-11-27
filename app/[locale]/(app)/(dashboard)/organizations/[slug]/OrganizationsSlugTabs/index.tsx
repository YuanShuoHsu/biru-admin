"use client";

import { useParams } from "next/navigation";
import { Suspense, use } from "react";

import RouteTabs from "@/components/RouteTabs";

import { countKeys } from "@/constants/organizations";

import { usePathname } from "@/i18n/navigation";

import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCountStore } from "@/providers/count-store-provider";

const ContentStack = styled(Stack)(({ theme }) => ({
  flex: 1,
  gap: theme.spacing(2),
}));

interface TabAccess {
  canReadWaitlistSetting: boolean;
  canUpdateOrganization: boolean;
}

type OrganizationTab = React.ComponentProps<
  typeof RouteTabs
>["tabs"][number] & {
  permission?: keyof TabAccess;
};

// https://nextjs.org/docs/app/getting-started/fetching-data#streaming-data-with-the-use-api
const PermittedRouteTabs = ({
  pendingInvitationCount,
  tabAccess,
}: {
  pendingInvitationCount?: Promise<number>;
  tabAccess?: Promise<TabAccess>;
}) => {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();

  const access = tabAccess && use(tabAccess);
  const loadedInvitationCount =
    pendingInvitationCount && use(pendingInvitationCount);

  const { getCount } = useCountStore((state) => state);

  const tabs: OrganizationTab[] = [
    { path: `/organizations/${slug}/members` },
    { path: `/organizations/${slug}/teams` },
    {
      badge: getCount(countKeys.pendingInvitations) ?? loadedInvitationCount,
      path: `/organizations/${slug}/invitations`,
    },
    { path: `/organizations/${slug}/location` },
    { path: `/organizations/${slug}/pickup` },
    {
      path: `/organizations/${slug}/special-hours`,
      permission: "canUpdateOrganization",
    },
    {
      path: `/organizations/${slug}/in-store`,
      permission: "canUpdateOrganization",
    },
    {
      path: `/organizations/${slug}/waitlist`,
      permission: "canReadWaitlistSetting",
    },
    {
      path: `/organizations/${slug}/points`,
      permission: "canUpdateOrganization",
    },
  ];

  return (
    <RouteTabs
      ariaLabel="organization tabs"
      tabs={tabs.filter(
        ({ path, permission }) =>
          !permission ||
          (access ? access[permission] : pathname.startsWith(path)),
      )}
    />
  );
};

interface OrganizationsSlugTabsProps {
  children: React.ReactNode;
  pendingInvitationCount: Promise<number>;
  tabAccess: Promise<TabAccess>;
}

const OrganizationsSlugTabs = ({
  children,
  pendingInvitationCount,
  tabAccess,
}: OrganizationsSlugTabsProps) => (
  <ContentStack>
    <Suspense fallback={<PermittedRouteTabs />}>
      <PermittedRouteTabs
        pendingInvitationCount={pendingInvitationCount}
        tabAccess={tabAccess}
      />
    </Suspense>
    {children}
  </ContentStack>
);

export default OrganizationsSlugTabs;
