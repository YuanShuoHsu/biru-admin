"use client";

import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledStack = styled(Stack)(({ theme }) => ({
  marginBottom: "auto",
  gap: theme.spacing(2),
}));

const AuthCouponsLayout = ({ children }: { children: React.ReactNode }) => (
  <StyledStack>{children}</StyledStack>
);

export default AuthCouponsLayout;
