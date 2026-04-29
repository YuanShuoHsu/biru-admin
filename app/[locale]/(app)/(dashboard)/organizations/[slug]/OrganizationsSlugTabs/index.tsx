"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";

import {
  Groups,
  Mail,
  People,
  type SvgIconComponent,
} from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

interface OrganizationsSlugTabsProps {
  children: React.ReactNode;
}

const OrganizationsSlugTabs = ({ children }: OrganizationsSlugTabsProps) => {
  const { slug } = useParams<{ slug: string }>();

  const pathname = usePathname();

  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");
  const tInvitations = useTranslations("organizations.invitations");

  const tabs: { Icon: SvgIconComponent; label: string; value: string }[] = [
    {
      Icon: People,
      label: tMembers("label"),
      value: `/organizations/${slug}/members`,
    },
    {
      Icon: Groups,
      label: tTeams("label"),
      value: `/organizations/${slug}/teams`,
    },
    {
      Icon: Mail,
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
        {tabs.map(({ Icon, label, value }) => (
          <Tab
            component={Link}
            href={value}
            icon={<Icon fontSize="small" />}
            iconPosition="start"
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

export default OrganizationsSlugTabs;
