"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import AccountTab from "./AccountTab";
import SecurityTab from "./SecurityTab";

import CustomTabPanel from "@/components/CustomTabPanel";

import { Lock, Person, type SvgIconComponent } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

import { a11yProps } from "@/utils/tab";

const AccountSettings = () => {
  const [value, setValue] = useState(0);

  const tAccount = useTranslations("account");

  const navItems: {
    Component: React.ComponentType;
    Icon: SvgIconComponent;
    label: string;
  }[] = [
    {
      Component: AccountTab,
      Icon: Person,
      label: tAccount("accountSettings.account.label"),
    },
    {
      Component: SecurityTab,
      Icon: Lock,
      label: tAccount("accountSettings.security.label"),
    },
  ];

  const handleChange = (_: React.SyntheticEvent, newValue: number) =>
    setValue(newValue);

  return (
    <Stack gap={2}>
      <Tabs
        aria-label="account settings tabs"
        onChange={handleChange}
        scrollButtons="auto"
        value={value}
        variant="scrollable"
      >
        {navItems.map(({ Icon, label }, index) => (
          <Tab
            icon={<Icon />}
            iconPosition="start"
            key={index}
            label={label}
            {...a11yProps(index)}
          />
        ))}
      </Tabs>
      {navItems.map(({ Component }, index) => (
        <CustomTabPanel index={index} key={index} value={value}>
          <Component />
        </CustomTabPanel>
      ))}
    </Stack>
  );
};

export default AccountSettings;
