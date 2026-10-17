"use client";

import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)({
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

interface MaintenanceLayoutProps {
  children: React.ReactNode;
}

const MaintenanceLayout = ({ children }: MaintenanceLayoutProps) => (
  <StyledContainer disableGutters maxWidth="sm">
    {children}
  </StyledContainer>
);

export default MaintenanceLayout;
