import { useTranslations } from "next-intl";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { Button, Stack, Typography } from "@mui/material";

const Passkeys = () => {
  const tAuth = useTranslations("auth");

  return (
    <FormCard>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.passkeys.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <Stack
          alignItems={{ sm: "center" }}
          direction={{ xs: "column", sm: "row" }}
          gap={2}
          justifyContent="space-between"
          width="100%"
        >
          <Stack>
            <Typography fontWeight={500} variant="body2">
              {tAuth("settings.passkeys.title")}
            </Typography>
            <Typography color="text.secondary" mt={0.5} variant="caption">
              {tAuth("settings.passkeys.subtitle")}
            </Typography>
          </Stack>
          <Button
            disabled
            size="small"
            sx={{ flexShrink: 0 }}
            variant="contained"
          >
            {tAuth("settings.passkeys.add")}
          </Button>
        </Stack>
      </StyledCardContent>
    </FormCard>
  );
};

export default Passkeys;
