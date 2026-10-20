"use client";

import { useTranslations } from "next-intl";

import { useOrganization } from "@/hooks/organizations";
import useInvoiceAutoPrint from "@/hooks/useInvoiceAutoPrint";

import { Chip, FormControlLabel, Stack, Switch } from "@mui/material";

const InvoiceAutoPrintControl = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const tOrders = useTranslations("orders");

  const [enabled, setEnabled, interrupted] =
    useInvoiceAutoPrint(organizationId);

  return (
    <FormControlLabel
      control={
        <Switch
          checked={enabled}
          onChange={(_, checked) => setEnabled(checked)}
        />
      }
      label={
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          {tOrders("autoPrint.label")}
          {interrupted && (
            <Chip
              color="error"
              label={tOrders("autoPrint.interrupted")}
              size="small"
            />
          )}
        </Stack>
      }
    />
  );
};

interface InvoiceAutoPrintSwitchProps {
  organizationSlug: string;
}

const InvoiceAutoPrintSwitch = ({
  organizationSlug,
}: InvoiceAutoPrintSwitchProps) => {
  const organization = useOrganization(organizationSlug);

  if (!organization) return null;

  return <InvoiceAutoPrintControl organizationId={organization.id} />;
};

export default InvoiceAutoPrintSwitch;
