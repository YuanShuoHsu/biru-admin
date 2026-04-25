"use client";

import { useTranslations } from "next-intl";
import { Fragment, type ComponentType } from "react";

import ProviderRow from "./ProviderRow";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import GoogleIcon from "@/components/GoogleIcon";

import { Divider, Typography } from "@mui/material";

export interface Provider {
  id: string;
  Icon: ComponentType;
  label: string;
}

const providers: Provider[] = [
  { id: "google", Icon: GoogleIcon, label: "Google" },
];

const LinkedAccounts = () => {
  const tAuth = useTranslations("auth");

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
        {providers.map(({ id, Icon, label }, index) => (
          <Fragment key={id}>
            {index > 0 && <Divider flexItem />}
            <ProviderRow id={id} Icon={Icon} label={label} />
          </Fragment>
        ))}
      </StyledCardContent>
    </FormCard>
  );
};

export default LinkedAccounts;
