"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import RouteTabs from "@/components/RouteTabs";

import { countKeys } from "@/constants/organizations";

import { Chip, Stack } from "@mui/material";

import { useCountStore } from "@/providers/count-store-provider";

interface OrganizationsSlugTabsProps {
  children: React.ReactNode;
}

const OrganizationsSlugTabs = ({ children }: OrganizationsSlugTabsProps) => {
  const { getCount } = useCountStore((state) => state);
  const count = getCount(countKeys.pendingInvitations);

  const { slug } = useParams<{ slug: string }>();

  const tInvitations = useTranslations("organizations.invitations");

  return (
    <Stack height="100%" gap={2}>
      <RouteTabs
        ariaLabel="organization tabs"
        tabs={[
          { path: `/organizations/${slug}/members` },
          { path: `/organizations/${slug}/teams` },
          {
            label: (
              <Stack alignItems="center" direction="row" gap={1}>
                {tInvitations("label")}
                {count > 0 && (
                  <Chip color="secondary" label={count} size="small" />
                )}
              </Stack>
            ),
            path: `/organizations/${slug}/invitations`,
          },
          { path: `/organizations/${slug}/location` },
          { path: `/organizations/${slug}/pickup` },
          { path: `/organizations/${slug}/points` },
        ]}
      />
      {children}
    </Stack>
  );
};

export default OrganizationsSlugTabs;
