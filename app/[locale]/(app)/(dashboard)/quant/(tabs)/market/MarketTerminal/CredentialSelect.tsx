"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { Alert, Button, Chip, MenuItem, Stack, TextField } from "@mui/material";

import type { QuantCredential } from "@/types/quant";

interface CredentialSelectProps {
  credential: QuantCredential;
  credentials: QuantCredential[];
  onChange: (id: string) => void;
}

export const NoCredential = () => {
  const tQuant = useTranslations("quant");

  return (
    <Stack sx={{ gap: 2 }}>
      <Alert severity="info">{tQuant("account.noCredential")}</Alert>
      <Button component={Link} href="/quant/settings" variant="outlined">
        {tQuant("account.goToSettings")}
      </Button>
    </Stack>
  );
};

const CredentialSelect = ({
  credential,
  credentials,
  onChange,
}: CredentialSelectProps) => {
  const tQuant = useTranslations("quant");

  return (
    <Stack sx={{ alignItems: "center", flexDirection: "row", gap: 1 }}>
      <TextField
        fullWidth
        label={tQuant("order.credential")}
        onChange={(event) => onChange(event.target.value)}
        select
        value={credential.id}
      >
        {credentials.map(({ apiKeyLast4, id, label }) => (
          <MenuItem key={id} value={id}>
            {label} (…{apiKeyLast4})
          </MenuItem>
        ))}
      </TextField>
      <Chip color="warning" label={tQuant("order.live")} size="small" />
    </Stack>
  );
};

export default CredentialSelect;
