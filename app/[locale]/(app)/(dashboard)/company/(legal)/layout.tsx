"use client";

import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: theme.spacing(2),
}));

interface CompanyLegalLayoutProps {
  children: React.ReactNode;
}

const CompanyLegalLayout = ({ children }: CompanyLegalLayoutProps) => (
  <StyledContainer disableGutters maxWidth="sm">
    {children}
  </StyledContainer>
);

export default CompanyLegalLayout;
