"use client";

import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
});

interface MemberAuthLayoutProps {
  children: React.ReactNode;
}

const MemberAuthLayout = ({ children }: MemberAuthLayoutProps) => (
  <StyledContainer disableGutters maxWidth="sm">
    {children}
  </StyledContainer>
);

export default MemberAuthLayout;
