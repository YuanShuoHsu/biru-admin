"use client";

import RouteTabs from "@/components/RouteTabs";

import { Stack } from "@mui/material";

const AuthPointsLayout = ({ children }: { children: React.ReactNode }) => (
  <Stack gap={2} marginBottom="auto">
    <RouteTabs
      ariaLabel="points tabs"
      tabs={[
        { path: "/auth/points/transactions" },
        { path: "/auth/points/store" },
      ]}
    />
    {children}
  </Stack>
);

export default AuthPointsLayout;
