"use client";

import { useTranslations } from "next-intl";
import { use } from "react";

import { Link, usePathname } from "@/i18n/navigation";

import { Stack, Tab, Tabs } from "@mui/material";

const OrganizationsSlugLayout = ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = use(params);
  const pathname = usePathname();

  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");
  const tInvitations = useTranslations("organizations.invitations");

  const tabs = [
    { label: tMembers("label"), value: `/organizations/${slug}/members` },
    { label: tTeams("label"), value: `/organizations/${slug}/teams` },
    {
      label: tInvitations("label"),
      value: `/organizations/${slug}/invitations`,
    },
  ];

  const currentTab =
    tabs.find(({ value }) => pathname.startsWith(value))?.value ||
    tabs[0].value;

  return (
    <Stack gap={2}>
      <Tabs
        aria-label="organization tabs"
        scrollButtons="auto"
        value={currentTab}
        variant="scrollable"
      >
        {tabs.map(({ label, value }) => (
          <Tab
            component={Link}
            href={value}
            key={value}
            label={label}
            value={value}
          />
        ))}
      </Tabs>
      {children}
    </Stack>
  );
};

export default OrganizationsSlugLayout;
