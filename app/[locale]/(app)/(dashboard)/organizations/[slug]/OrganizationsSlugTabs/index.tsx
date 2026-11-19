"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Suspense, use } from "react";

import RouteTabs from "@/components/RouteTabs";

import { countKeys } from "@/constants/organizations";

import { Chip, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCountStore } from "@/providers/count-store-provider";

const ContentStack = styled(Stack)(({ theme }) => ({
  flex: 1,
  gap: theme.spacing(2),
}));

const TabLabelStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
}));

const PendingInvitationChip = ({
  initialCount,
}: {
  initialCount: Promise<number>;
}) => {
  const loadedCount = use(initialCount);

  const { getCount } = useCountStore((state) => state);
  const count = getCount(countKeys.pendingInvitations) ?? loadedCount;

  return count > 0 && <Chip color="secondary" label={count} size="small" />;
};

interface TabAccess {
  canReadWaitlistSetting: boolean;
  canUpdateOrganization: boolean;
}

type RouteTabItems = React.ComponentProps<typeof RouteTabs>["tabs"];

const PermittedRouteTabs = ({
  tabAccess,
  tabs,
}: {
  tabAccess: Promise<TabAccess>;
  tabs: RouteTabItems;
}) => {
  const { slug } = useParams<{ slug: string }>();

  const { canReadWaitlistSetting, canUpdateOrganization } = use(tabAccess);

  const hiddenPaths = [
    ...(canUpdateOrganization ? [] : ["special-hours", "in-store", "points"]),
    ...(canReadWaitlistSetting ? [] : ["waitlist"]),
  ].map((segment) => `/organizations/${slug}/${segment}`);

  return (
    <RouteTabs
      ariaLabel="organization tabs"
      tabs={tabs.filter(({ path }) => !hiddenPaths.includes(path))}
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
}: OrganizationsSlugTabsProps) => {
  const { slug } = useParams<{ slug: string }>();

  const tInvitations = useTranslations("organizations.invitations");

  const tabs: RouteTabItems = [
    { path: `/organizations/${slug}/members` },
    { path: `/organizations/${slug}/teams` },
    {
      label: (
        <TabLabelStack direction="row">
          {tInvitations("label")}
          <Suspense>
            <PendingInvitationChip initialCount={pendingInvitationCount} />
          </Suspense>
        </TabLabelStack>
      ),
      path: `/organizations/${slug}/invitations`,
    },
    { path: `/organizations/${slug}/location` },
    { path: `/organizations/${slug}/pickup` },
    { path: `/organizations/${slug}/special-hours` },
    { path: `/organizations/${slug}/in-store` },
    { path: `/organizations/${slug}/waitlist` },
    { path: `/organizations/${slug}/points` },
  ];

  return (
    <ContentStack>
      <Suspense
        fallback={<RouteTabs ariaLabel="organization tabs" tabs={tabs} />}
      >
        <PermittedRouteTabs tabAccess={tabAccess} tabs={tabs} />
      </Suspense>
      {children}
    </ContentStack>
  );
};

export default OrganizationsSlugTabs;
