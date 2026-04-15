"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import AccountTab from "./AccountTab";
import SecurityTab from "./SecurityTab";

import CustomTabPanel from "@/components/CustomTabPanel";

import { Lock, Person } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

import { a11yProps } from "@/utils/tab";

type TabId = "account" | "security";

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tAccount = useTranslations("account");

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
        <AccountTab />
      </CustomTabPanel>
      <CustomTabPanel index={1} value={activeTab}>
        <SecurityTab />
      </CustomTabPanel>
    </Stack>
  );
};

export default AccountSettings;
