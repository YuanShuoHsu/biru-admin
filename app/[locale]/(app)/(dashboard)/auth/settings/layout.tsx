"use client";

import RouteTabs from "@/components/RouteTabs";

import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledStack = styled(Stack)(({ theme }) => ({
  marginBottom: "auto",
  gap: theme.spacing(2),
}));

const AuthSettingsLayout = ({ children }: { children: React.ReactNode }) => (
  <StyledStack>
    <RouteTabs
      ariaLabel="account settings tabs"
      tabs={[
        { path: "/auth/settings/account" },
        { path: "/auth/settings/security" },
      ]}
    />
    {children}
  </StyledStack>
);

export default AuthSettingsLayout;
