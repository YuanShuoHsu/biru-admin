"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Suspense, use } from "react";

import RouteTabs from "@/components/RouteTabs";

import { countKeys } from "@/constants/organizations";

import { usePathname } from "@/i18n/navigation";

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

type OrganizationTab = React.ComponentProps<
  typeof RouteTabs
>["tabs"][number] & {
  permission?: keyof TabAccess;
};

// https://nextjs.org/docs/app/getting-started/fetching-data#streaming-data-with-the-use-api
const PermittedRouteTabs = ({
  tabAccess,
  tabs,
}: {
  tabAccess?: Promise<TabAccess>;
  tabs: OrganizationTab[];
}) => {
  const pathname = usePathname();

  const access = tabAccess && use(tabAccess);

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
}: OrganizationsSlugTabsProps) => {
  const { slug } = useParams<{ slug: string }>();

  const tInvitations = useTranslations("organizations.invitations");

  const tabs: OrganizationTab[] = [
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
    <ContentStack>
      <Suspense fallback={<PermittedRouteTabs tabs={tabs} />}>
        <PermittedRouteTabs tabAccess={tabAccess} tabs={tabs} />
      </Suspense>
      {children}
    </ContentStack>
  );
};

export default OrganizationsSlugTabs;
