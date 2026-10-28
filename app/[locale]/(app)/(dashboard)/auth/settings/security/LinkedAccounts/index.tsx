"use client";

import { useTranslations } from "next-intl";
import { Fragment, type ComponentType } from "react";

import ProviderRow from "./ProviderRow";

import ErrorAlert from "@/components/ErrorAlert";
import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import GoogleIcon from "@/components/GoogleIcon";

import { Divider, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import useListAccounts from "@/hooks/useListAccounts";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

export interface Provider {
  id: string;
  Icon: ComponentType;
  label: string;
}

const providers: Provider[] = [
  { id: "google", Icon: GoogleIcon, label: "Google" },
];

const LinkedAccounts = () => {
  const { error, mutate } = useListAccounts();

  const tAuth = useTranslations("auth");

  return (
    <FormCard component="form">
      <StyledCardHeader
        title={
          <StyledTypography color="primary" variant="h6">
            {tAuth("settings.linkedAccounts.label")}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        {error && <ErrorAlert onRetry={() => mutate()} />}
        {!error &&
          providers.map(({ id, Icon, label }, index) => (
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
