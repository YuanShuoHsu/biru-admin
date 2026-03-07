// https://mui.com/
// https://mui.com/templates/

"use client";

import Copyright from "./Copyright";
import LinkSection from "./LinkSection";
import Newsletter from "./Newsletter";
import SocialLinks from "./SocialLinks";

import {
  Container,
  type ContainerProps,
  Divider,
  Grid,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)<ContainerProps>(({ theme }) => ({
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const Footer = () => (
  <StyledContainer component="footer" disableGutters maxWidth="lg">
    <Grid container spacing={2}>
      <Newsletter />
      <LinkSection />
    </Grid>
    <Divider />
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems="center"
      gap={1}
    >
      <Copyright />
      <SocialLinks />
    </Stack>
  </StyledContainer>
);

export default Footer;
