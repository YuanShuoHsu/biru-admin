"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Suspense, use } from "react";

import RouteTabs from "@/components/RouteTabs";

import { countKeys } from "@/constants/organizations";

import { Chip, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCountStore } from "@/providers/count-store-provider";

import type { Member } from "@/types/organizations";

import { hasRolePermission } from "@/utils/organizations";

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

interface OrganizationsSlugTabsProps {
  children: React.ReactNode;
  currentUserRole: Member["role"] | undefined;
  pendingInvitationCount: Promise<number>;
}

const OrganizationsSlugTabs = ({
  children,
  currentUserRole,
  pendingInvitationCount,
}: OrganizationsSlugTabsProps) => {
  const { slug } = useParams<{ slug: string }>();

  const tInvitations = useTranslations("organizations.invitations");

  const canUpdateOrganization = hasRolePermission(currentUserRole, {
    organization: ["update"],
  });

  return (
    <ContentStack>
      <RouteTabs
        ariaLabel="organization tabs"
        tabs={[
          { path: `/organizations/${slug}/members` },
          { path: `/organizations/${slug}/teams` },
          {
            label: (
              <TabLabelStack direction="row">
                {tInvitations("label")}
                <Suspense>
                  <PendingInvitationChip
                    initialCount={pendingInvitationCount}
                  />
                </Suspense>
              </TabLabelStack>
            ),
            path: `/organizations/${slug}/invitations`,
          },
          { path: `/organizations/${slug}/location` },
          { path: `/organizations/${slug}/pickup` },
          ...(canUpdateOrganization
            ? [
                { path: `/organizations/${slug}/special-hours` },
                { path: `/organizations/${slug}/in-store` },
              ]
            : []),
          ...(hasRolePermission(currentUserRole, { waitlistSetting: ["read"] })
            ? [{ path: `/organizations/${slug}/waitlist` }]
            : []),
          ...(canUpdateOrganization
            ? [{ path: `/organizations/${slug}/points` }]
            : []),
        ]}
      />
      {children}
    </ContentStack>
  );
};

export default OrganizationsSlugTabs;
