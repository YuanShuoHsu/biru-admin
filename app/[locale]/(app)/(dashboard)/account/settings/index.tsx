"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import CustomTabPanel from "@/components/CustomTabPanel";

import { query } from "@/constants/query";

import { Lock, Person } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import { getHref } from "@/utils/href";
import { a11yProps } from "@/utils/tab";

import AccountTab from "./AccountTab";
import SecurityTab from "./SecurityTab";

type TabId = "account" | "security";

interface AccountSettingsProps {
  currentURL: string;
}

const AccountSettings = ({ currentURL }: AccountSettingsProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const { session } = useAuthStore((state) => state);

  const tAccount = useTranslations("account");
  const tAuth = useTranslations("auth");

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: currentURL,
  });

  if (!session?.user) {
    return (
      <Card>
        <CardHeader title={tAccount("accountSettings.title")} />
        <CardContent>
          <Stack gap={2}>
            <Typography variant="h6">
              {tAccount("accountSettings.signInCta")}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {tAccount("accountSettings.empty")}
            </Typography>
            <Button
              href={signInHref}
              startIcon={<Person />}
              variant="contained"
            >
              {tAuth("signIn.label")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const navItems: { id: TabId; Icon: typeof Person; label: string }[] = [
    {
      id: "account",
      Icon: Person,
      label: tAccount("accountSettings.sections.account"),
    },
    {
      id: "security",
      Icon: Lock,
      label: tAccount("accountSettings.sections.security"),
    },
  ];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setActiveTab(newValue);

  return (
    <Stack gap={2}>
      <Tabs
        aria-label="account settings tabs"
        onChange={handleTabChange}
        scrollButtons="auto"
        value={activeTab}
        variant="scrollable"
      >
        {navItems.map(({ id, Icon, label }, index) => (
          <Tab
            icon={<Icon />}
            iconPosition="start"
            key={id}
            label={label}
            {...a11yProps(index)}
          />
        ))}
      </Tabs>
      <CustomTabPanel index={0} value={activeTab}>
        <AccountTab currentURL={currentURL} />
      </CustomTabPanel>
      <CustomTabPanel index={1} value={activeTab}>
        <SecurityTab currentURL={currentURL} />
      </CustomTabPanel>
    </Stack>
  );
};

export default AccountSettings;
