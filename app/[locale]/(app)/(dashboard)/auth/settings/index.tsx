"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import Account from "./Account";
import Security from "./Security";

import CustomTabPanel from "@/components/CustomTabPanel";

import { Lock, Person, type SvgIconComponent } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

import { a11yProps } from "@/utils/tab";

const AuthSettings = () => {
  const [value, setValue] = useState(0);

  const tAuth = useTranslations("auth");

  const navItems: {
    Component: React.ComponentType;
    Icon: SvgIconComponent;
    label: string;
  }[] = [
    {
      Component: Account,
      Icon: Person,
      label: tAuth("settings.account.label"),
    },
    {
      Component: Security,
      Icon: Lock,
      label: tAuth("settings.security.label"),
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
            icon={<Icon fontSize="small" />}
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

export default AuthSettings;
