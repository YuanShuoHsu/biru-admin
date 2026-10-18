"use client";

import { useTranslations } from "next-intl";

import { useOrganization } from "@/hooks/organizations";
import useInvoiceAutoPrint from "@/hooks/useInvoiceAutoPrint";

import { FormControlLabel, Switch } from "@mui/material";

import type { Organization } from "@/types/organizations";

const InvoiceAutoPrintControl = ({
  organization,
}: {
  organization: Organization;
}) => {
  const tOrders = useTranslations("orders");

  const [enabled, setEnabled] = useInvoiceAutoPrint(organization);

  return (
    <FormControlLabel
      control={
        <Switch
          checked={enabled}
          onChange={(_, checked) => setEnabled(checked)}
        />
      }
      label={tOrders("autoPrint.label")}
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

  return <InvoiceAutoPrintControl organization={organization} />;
};

export default InvoiceAutoPrintSwitch;
