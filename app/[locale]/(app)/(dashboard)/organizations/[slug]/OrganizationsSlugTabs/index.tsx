"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

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

interface OrganizationsSlugTabsProps {
  children: React.ReactNode;
}

const OrganizationsSlugTabs = ({ children }: OrganizationsSlugTabsProps) => {
  const { getCount } = useCountStore((state) => state);
  const count = getCount(countKeys.pendingInvitations);

  const { slug } = useParams<{ slug: string }>();

  const tInvitations = useTranslations("organizations.invitations");

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
                {count > 0 && (
                  <Chip color="secondary" label={count} size="small" />
                )}
              </TabLabelStack>
            ),
            path: `/organizations/${slug}/invitations`,
          },
          { path: `/organizations/${slug}/location` },
          { path: `/organizations/${slug}/pickup` },
          { path: `/organizations/${slug}/points` },
        ]}
      />
      {children}
    </ContentStack>
  );
};

export default OrganizationsSlugTabs;
