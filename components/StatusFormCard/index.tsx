"use client";

import { useTranslations } from "next-intl";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import {
  Avatar,
  type CardProps,
  type SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color: "error" | "primary" }>(({ color, theme }) => {
  const mainColor = theme.palette[color].main;

  return {
    alignSelf: "center",
    width: theme.spacing(7),
    height: theme.spacing(7),
    backgroundColor: alpha(mainColor, 0.2),
    color: mainColor,
  };
});

export interface StatusFormCardConfig {
  actions: React.ReactNode;
  color: "error" | "primary";
  icon: React.ComponentType<SvgIconProps>;
  subtitle: string;
  title: string;
}

interface StatusFormCardProps extends CardProps<"form"> {
  config: StatusFormCardConfig;
  email: string;
  emailError?: string;
}

const StatusFormCard = ({
  config,
  email,
  emailError,
  ...props
}: StatusFormCardProps) => {
  const tAuth = useTranslations("auth");

  const Icon = config.icon;

  return (
    <FormCard {...props}>
      <StyledCardHeader
        title={
          <StyledTypography align="center" color={config.color} variant="h6">
            {config.title}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        <StyledAvatar color={config.color}>
          <Icon fontSize="large" />
        </StyledAvatar>
        <Typography align="center" color="textSecondary" variant="caption">
          {config.subtitle}
        </Typography>
        <TextField
          autoComplete="email"
          error={!!emailError}
          fullWidth
          helperText={emailError}
          label={tAuth("email.label")}
          placeholder={tAuth("email.placeholder")}
          required
          slotProps={{ input: { readOnly: true } }}
          type="email"
          value={email}
        />
      </StyledCardContent>
      <StyledCardActions disableSpacing>{config.actions}</StyledCardActions>
    </FormCard>
  );
};

export default StatusFormCard;
