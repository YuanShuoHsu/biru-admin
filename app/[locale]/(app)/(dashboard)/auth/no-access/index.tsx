"use client";

import { useTranslations } from "next-intl";

import {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { Button, Card, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

interface AuthNoAccessProps {
  email: string;
}

const AuthNoAccess = ({ email }: AuthNoAccessProps) => {
  const tAuth = useTranslations("auth");

  return (
    <Card>
      <StyledCardHeader
        title={
          <StyledTypography align="center" color="primary" variant="h6">
            {tAuth("noAccess.label")}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        <Typography>{tAuth("noAccess.description", { email })}</Typography>
      </StyledCardContent>
      <StyledCardActions disableSpacing>
        <Button fullWidth href="/auth/sign-in" size="large" variant="contained">
          {tAuth("addAccount.label")}
        </Button>
        <Button
          fullWidth
          href={process.env.NEXT_PUBLIC_NEXT_URL}
          size="large"
          variant="outlined"
        >
          {tAuth("noAccess.goToStorefront")}
        </Button>
      </StyledCardActions>
    </Card>
  );
};

export default AuthNoAccess;
