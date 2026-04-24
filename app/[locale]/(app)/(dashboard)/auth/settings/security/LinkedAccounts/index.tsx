"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import GoogleIcon from "@/components/GoogleIcon";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Link as LinkIcon } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";

const LinkedAccounts = () => {
  const [loading, setLoading] = useState(false);

  const locale = useLocale();

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const handleLinkGoogle = async () => {
    setLoading(true);
    await authClient.linkSocial({
      provider: "google",
      callbackURL: `${process.env.NEXT_PUBLIC_NEXT_URL}/${locale}/auth/settings/security`,
      fetchOptions: {
        onError: ({ error: { code } }) => {
          setLoading(false);
          enqueueSnackbar(getErrorMessage(code, locale), { variant: "error" });
        },
      },
    });
  };

  return (
    <FormCard>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.linkedAccounts.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <Stack alignItems="center" direction="row" gap={2} width="100%">
          <Box
            alignItems="center"
            bgcolor="action.hover"
            borderRadius={2}
            display="flex"
            flexShrink={0}
            height={40}
            justifyContent="center"
            width={40}
          >
            <GoogleIcon />
          </Box>
          <Stack flex={1} minWidth={0}>
            <Typography fontWeight={500} variant="body2">
              {tAuth("settings.linkedAccounts.google.label")}
            </Typography>
            <Typography color="text.secondary" noWrap variant="caption">
              {tAuth("settings.linkedAccounts.google.subtitle")}
            </Typography>
          </Stack>
          <Button
            aria-label={tAuth("settings.linkedAccounts.google.subtitle")}
            loading={loading}
            onClick={handleLinkGoogle}
            size="small"
            startIcon={<LinkIcon />}
            sx={{ flexShrink: 0 }}
            variant="outlined"
          >
            {tAuth("settings.linkedAccounts.link")}
          </Button>
        </Stack>
      </StyledCardContent>
    </FormCard>
  );
};

export default LinkedAccounts;
