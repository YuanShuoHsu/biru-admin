"use client";

import RouteTabs from "@/components/RouteTabs";

import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  marginBottom: "auto",
}));

const AuthPointsLayout = ({ children }: { children: React.ReactNode }) => (
  <StyledStack>
    <RouteTabs
      ariaLabel="points tabs"
      tabs={[
        { path: "/auth/points/transactions" },
        { path: "/auth/points/store" },
      ]}
    />
    {children}
  </StyledStack>
);

export default AuthPointsLayout;
