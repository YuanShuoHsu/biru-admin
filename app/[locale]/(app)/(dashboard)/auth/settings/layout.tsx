"use client";

import RouteTabs from "@/components/RouteTabs";

import { Stack } from "@mui/material";

const AuthSettingsLayout = ({ children }: { children: React.ReactNode }) => (
  <Stack gap={2} marginBottom="auto">
    <RouteTabs
      ariaLabel="account settings tabs"
      tabs={[
        { path: "/auth/settings/account" },
        { path: "/auth/settings/security" },
      ]}
    />
    {children}
  </Stack>
);

export default AuthSettingsLayout;
